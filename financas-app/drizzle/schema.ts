import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  numeric,
  boolean,
  pgEnum,
  uuid,
  date,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * PostgreSQL Schema para Supabase
 * Compatível com o schema SQL que você já tem no Supabase
 */

// Enums
export const transactionKindEnum = pgEnum("transaction_kind", [
  "income",
  "expense",
]);
export const memberRoleEnum = pgEnum("member_role", ["admin"]);

// Tabelas
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const householdMembers = pgTable(
  "household_members",
  {
    householdId: uuid("household_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: memberRoleEnum("role").default("admin").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey(table.householdId, table.userId),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull(),
    name: text("name").notNull(),
    icon: text("icon").default("•").notNull(),
    color: varchar("color", { length: 7 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    unique: uniqueIndex().on(table.householdId, table.name),
  })
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull(),
    categoryId: uuid("category_id"),
    createdBy: uuid("created_by").notNull(),
    responsibleUserId: uuid("responsible_user_id").notNull(),
    kind: transactionKindEnum("kind").notNull(),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    transactionDate: date("transaction_date").notNull(),
    isFixed: boolean("is_fixed").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    householdDateIdx: index("transactions_household_date_idx").on(
      table.householdId,
      table.transactionDate
    ),
    categoryDateIdx: index("transactions_category_date_idx").on(
      table.categoryId,
      table.transactionDate
    ),
    fixedIdx: index("transactions_fixed_idx").on(
      table.householdId,
      table.isFixed
    ),
  })
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").notNull(),
    categoryId: uuid("category_id"),
    budgetMonth: date("budget_month").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    unique: uniqueIndex().on(table.householdId, table.categoryId, table.budgetMonth),
  })
);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type Household = typeof households.$inferSelect;
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
