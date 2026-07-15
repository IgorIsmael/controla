import { and, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

function needsSsl(connectionString: string): boolean {
  try {
    const { hostname } = new URL(connectionString);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return true;
  }
}

/** Extracts the real underlying error message (postgres/network), not the generic
 * "Failed query: ..." wrapper that drizzle-orm throws, which hides the actual cause. */
export function describeDbError(err: unknown): string {
  const anyErr = err as any;
  const cause = anyErr?.cause ?? anyErr;
  return (
    cause?.message ||
    anyErr?.message ||
    (typeof err === "string" ? err : "Erro desconhecido no banco de dados")
  );
}

/**
 * Lazily creates the drizzle instance so local tooling can run without a DB.
 * Supports Supabase connection strings (postgres:// or postgresql://).
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, {
        // Supabase (e qualquer host remoto) exige SSL, independente de NODE_ENV
        ssl: needsSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        // Necessário quando a DATABASE_URL aponta para o Transaction Pooler do
        // Supabase (porta 6543, PgBouncer/Supavisor em modo transaction), que não
        // suporta prepared statements. Sem isso, TODA query falha com "Failed query".
        prepare: false,
      });
      _db = drizzle(client, { schema });
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", describeDbError(error));
      _db = null;
    }
  }
  return _db;
}

// ============================================================
// HOUSEHOLD
// ============================================================

/**
 * Get or create a household for the current user.
 * Returns the household ID.
 */
export async function getOrCreateHousehold(
  userId: string,
  displayName: string,
  email: string = ""
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Upsert profile
  const existing = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId as any))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(schema.profiles).values({
      id: userId as any,
      email: email || `${userId}@app.local`,
      displayName,
    });
  }

  // Get or create shared household
  const existingHousehold = await db
    .select()
    .from(schema.households)
    .where(eq(schema.households.slug, "controle-financeiro"))
    .limit(1);

  let householdId: string;

  if (existingHousehold.length === 0) {
    const result = await db
      .insert(schema.households)
      .values({ slug: "controle-financeiro", name: "Controle Financeiro" })
      .returning();
    householdId = result[0]?.id || "";
  } else {
    householdId = existingHousehold[0]?.id || "";
  }

  // Add user as member if not already
  const existingMember = await db
    .select()
    .from(schema.householdMembers)
    .where(
      and(
        eq(schema.householdMembers.householdId, householdId as any),
        eq(schema.householdMembers.userId, userId as any)
      )
    )
    .limit(1);

  if (existingMember.length === 0) {
    await db.insert(schema.householdMembers).values({
      householdId: householdId as any,
      userId: userId as any,
      role: "admin",
    });
  }

  return householdId;
}

/**
 * Get the shared household ID (creates if not exists).
 */
export async function getHouseholdId(): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ id: schema.households.id })
    .from(schema.households)
    .where(eq(schema.households.slug, "controle-financeiro"))
    .limit(1);

  return result[0]?.id || null;
}

// ============================================================
// TRANSACTIONS
// ============================================================

/**
 * Get transactions for a month (yyyy-MM format).
 */
export async function getTransactionsByMonth(month: string) {
  const db = await getDb();
  if (!db) return [];

  const householdId = await getHouseholdId();
  if (!householdId) return [];

  const startDate = `${month}-01`;
  // Last day of month
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  return db
    .select({
      id: schema.transactions.id,
      description: schema.transactions.description,
      amount: schema.transactions.amount,
      kind: schema.transactions.kind,
      transactionDate: schema.transactions.transactionDate,
      isFixed: schema.transactions.isFixed,
      notes: schema.transactions.notes,
      categoryId: schema.transactions.categoryId,
      responsibleUserId: schema.transactions.responsibleUserId,
      createdAt: schema.transactions.createdAt,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.householdId, householdId as any),
        gte(schema.transactions.transactionDate, startDate as any),
        lte(schema.transactions.transactionDate, endDate as any)
      )
    )
    .orderBy(schema.transactions.transactionDate);
}

/**
 * Get transaction totals (income and expense) for a month.
 */
export async function getTransactionTotals(month: string) {
  const db = await getDb();
  if (!db) return { income: "0.00", expense: "0.00" };

  const householdId = await getHouseholdId();
  if (!householdId) return { income: "0.00", expense: "0.00" };

  const startDate = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db
    .select({
      kind: schema.transactions.kind,
      total: sql<string>`COALESCE(SUM(${schema.transactions.amount}), 0)::text`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.householdId, householdId as any),
        gte(schema.transactions.transactionDate, startDate as any),
        lte(schema.transactions.transactionDate, endDate as any)
      )
    )
    .groupBy(schema.transactions.kind);

  const income = rows.find((r) => r.kind === "income")?.total || "0.00";
  const expense = rows.find((r) => r.kind === "expense")?.total || "0.00";
  return { income, expense };
}

/**
 * Create a new transaction.
 */
export async function createTransaction(input: {
  description: string;
  amount: string;
  type: "income" | "expense";
  date: string;
  isFixed: boolean;
  categoryId?: string;
  responsibleUserId: string;
  householdId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(schema.transactions)
    .values({
      householdId: input.householdId as any,
      categoryId: input.categoryId as any,
      createdBy: input.responsibleUserId as any,
      responsibleUserId: input.responsibleUserId as any,
      kind: input.type,
      description: input.description,
      amount: input.amount as any,
      transactionDate: input.date as any,
      isFixed: input.isFixed,
    })
    .returning();

  return result[0];
}

/**
 * Delete a transaction by ID.
 */
export async function deleteTransaction(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(schema.transactions)
    .where(eq(schema.transactions.id, id as any));

  return { success: true };
}

// ============================================================
// CATEGORIES
// ============================================================

export async function getCategoriesByHousehold() {
  const db = await getDb();
  if (!db) return [];

  const householdId = await getHouseholdId();
  if (!householdId) return [];

  return db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.householdId, householdId as any));
}

export async function createCategory(input: {
  name: string;
  icon: string;
  color?: string;
  householdId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(schema.categories)
    .values({
      householdId: input.householdId as any,
      name: input.name,
      icon: input.icon,
      color: input.color,
    })
    .returning();

  return result[0];
}

// ============================================================
// GOALS
// ============================================================

export async function getGoalsByHousehold() {
  const db = await getDb();
  if (!db) return [];

  const householdId = await getHouseholdId();
  if (!householdId) return [];

  return db
    .select()
    .from(schema.goals)
    .where(eq(schema.goals.householdId, householdId as any));
}

export async function getTransactionsByHousehold(householdId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.householdId, householdId as any));
}

export async function getCategoriesByHouseholdId(householdId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.householdId, householdId as any));
}

export async function getBudgetsByHousehold(householdId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(schema.budgets)
    .where(eq(schema.budgets.householdId, householdId as any));
}

// ============================================================
// AUTH (e-mail + senha, próprio)
// ============================================================

export async function getProfileByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.email, email))
      .limit(1);

    return result[0] ?? null;
  } catch (err) {
    const reason = describeDbError(err);
    console.error("[Database] getProfileByEmail failed:", reason);
    throw new Error(`Erro ao consultar o banco de dados: ${reason}`);
  }
}

export async function getProfileById(id: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, id as any))
      .limit(1);

    return result[0] ?? null;
  } catch (err) {
    const reason = describeDbError(err);
    console.error("[Database] getProfileById failed:", reason);
    throw new Error(`Erro ao consultar o banco de dados: ${reason}`);
  }
}

export async function createProfile(input: {
  email: string;
  displayName: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .insert(schema.profiles)
      .values({
        email: input.email,
        displayName: input.displayName,
        passwordHash: input.passwordHash,
      })
      .returning();

    return result[0];
  } catch (err) {
    const reason = describeDbError(err);
    console.error("[Database] createProfile failed:", reason);
    throw new Error(`Erro ao criar conta no banco de dados: ${reason}`);
  }
}

/** Sets the password on an already-existing profile (e.g. a row left over
 * from an old login flow that never had a password) instead of blocking
 * registration with a "conflict" error. */
export async function setProfilePassword(
  id: string,
  passwordHash: string,
  displayName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .update(schema.profiles)
      .set({ passwordHash, displayName, updatedAt: new Date() })
      .where(eq(schema.profiles.id, id as any))
      .returning();

    return result[0];
  } catch (err) {
    const reason = describeDbError(err);
    console.error("[Database] setProfilePassword failed:", reason);
    throw new Error(`Erro ao atualizar a conta no banco de dados: ${reason}`);
  }
}
