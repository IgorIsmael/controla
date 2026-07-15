import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashPassword, verifyPassword } from "./_core/password";
import { signSession } from "./_core/session";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ── Lista de e-mails com acesso autorizado ──
// Edite aqui para adicionar/remover usuários
const ALLOWED_EMAILS = [
  process.env.ALLOWED_EMAIL_1 || "igor@example.com",
  process.env.ALLOWED_EMAIL_2 || "giovana@example.com",
];

export const appRouter = router({
  system: systemRouter,

  // ============ AUTH ============
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Informe seu nome"),
          email: z.string().email("E-mail inválido"),
          password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase().trim();

        const isAllowed = ALLOWED_EMAILS.some(
          (allowed) => allowed.toLowerCase() === email
        );
        if (!isAllowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `O e-mail ${email} não está autorizado a criar uma conta.`,
          });
        }

        const existing = await db.getProfileByEmail(email);

        let profile;
        if (existing) {
          if (existing.passwordHash) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Já existe uma conta com esse e-mail. Faça login.",
            });
          }

          // Existe um perfil sem senha (sobra de uma tentativa antiga de login) —
          // aproveita o registro atual para completar a conta em vez de bloquear.
          const passwordHash = await hashPassword(input.password);
          profile = await db.setProfilePassword(
            existing.id,
            passwordHash,
            input.name.trim()
          );
        } else {
          const passwordHash = await hashPassword(input.password);
          profile = await db.createProfile({
            email,
            displayName: input.name.trim(),
            passwordHash,
          });
        }

        if (!profile) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Não foi possível criar a conta.",
          });
        }

        const token = await signSession(profile.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true } as const;
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("E-mail inválido"),
          password: z.string().min(1, "Informe sua senha"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase().trim();
        const invalidCredentialsError = new TRPCError({
          code: "UNAUTHORIZED",
          message: "E-mail ou senha inválidos.",
        });

        const profile = await db.getProfileByEmail(email);
        if (!profile || !profile.passwordHash) {
          throw invalidCredentialsError;
        }

        const validPassword = await verifyPassword(input.password, profile.passwordHash);
        if (!validPassword) {
          throw invalidCredentialsError;
        }

        const token = await signSession(profile.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true } as const;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      return { success: true } as const;
    }),

    checkAccess: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) {
        return { authorized: false, message: "Não autenticado" };
      }

      const email = ctx.user.email || "";
      const isAuthorized = ALLOWED_EMAILS.some(
        (allowed) => email.toLowerCase() === allowed.toLowerCase()
      );

      if (!isAuthorized) {
        return {
          authorized: false,
          message: `Acesso negado. O e-mail ${email} não está autorizado.`,
        };
      }

      return {
        authorized: true,
        message: "Acesso autorizado",
        user: ctx.user.displayName || email.split("@")[0],
      };
    }),
  }),

  // ============ CATEGORIAS ============
  categories: router({
    list: publicProcedure.query(async () => {
      return db.getCategoriesByHousehold();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          icon: z.string().default("•"),
          color: z
            .string()
            .regex(/^#[0-9A-F]{6}$/i)
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const householdId = await db.getHouseholdId();
        if (!householdId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Household não encontrado" });

        const result = await db.createCategory({
          name: input.name,
          icon: input.icon,
          color: input.color,
          householdId,
        });
        return { success: true, id: result?.id };
      }),
  }),

  // ============ CARTÕES DE CRÉDITO ============
  // Nota: cartões de crédito não estão no schema Drizzle atual.
  // Retornamos lista vazia e operações de stub até o schema ser atualizado.
  creditCards: router({
    list: publicProcedure.query(async () => {
      // TODO: adicionar tabela credit_cards ao schema Drizzle
      return [] as any[];
    }),

    totals: publicProcedure.query(async () => {
      return { totalLimit: "0.00", totalUsed: "0.00", totalAvailable: "0.00" };
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          brand: z.string().default("Outros"),
          limitTotal: z.string().regex(/^\d+(\.\d{2})?$/),
        })
      )
      .mutation(async ({ input }) => {
        // TODO: inserir na tabela credit_cards quando o schema for atualizado
        console.log("[creditCards.create] input:", input);
        return { success: true, id: "stub" };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return null;
      }),
  }),

  // ============ TRANSAÇÕES ============
  transactions: router({
    listByMonth: publicProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ input }) => {
        return db.getTransactionsByMonth(input.month);
      }),

    listByPerson: publicProcedure
      .input(
        z.object({
          month: z.string(),
          person: z.enum(["Igor", "Giovana"]),
        })
      )
      .query(async ({ input }) => {
        // Filtragem por pessoa será feita quando tivermos mapeamento userId→nome
        const all = await db.getTransactionsByMonth(input.month);
        return all;
      }),

    listByDateRange: publicProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ input }) => {
        // Retorna transações do mês de startDate por enquanto
        const month = input.startDate.slice(0, 7);
        return db.getTransactionsByMonth(month);
      }),

    create: protectedProcedure
      .input(
        z.object({
          description: z.string().min(1),
          amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
          date: z.string(),
          month: z.string(),
          type: z.enum(["income", "expense"]),
          paymentMethod: z.enum(["pix", "creditCard"]),
          creditCardId: z.number().optional(),
          categoryId: z.number().optional(),
          person: z.enum(["Igor", "Giovana"]),
          isFixed: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get or create household + profile
        const householdId = await db.getOrCreateHousehold(
          userId,
          input.person,
          ctx.user?.email || ""
        );

        const result = await db.createTransaction({
          description: input.description,
          amount: input.amount,
          type: input.type,
          date: input.date,
          isFixed: input.isFixed,
          responsibleUserId: userId,
          householdId,
        });

        return { success: true, id: result?.id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.union([z.number(), z.string()]) }))
      .mutation(async ({ input }) => {
        return db.deleteTransaction(String(input.id));
      }),

    getTotals: publicProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ input }) => {
        return db.getTransactionTotals(input.month);
      }),

    getByCategory: publicProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ input }) => {
        // TODO: implementar quando tivermos join com categories
        return [] as any[];
      }),

    getByPerson: publicProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ input }) => {
        // Retorna totais fixos por nome; idealmente usaria a tabela de profiles
        const all = await db.getTransactionsByMonth(input.month);
        const totals: Record<string, number> = { Igor: 0, Giovana: 0 };
        // all transactions go to the totals — refined when person mapping is added
        return totals;
      }),
  }),

  // ============ RECORRÊNCIAS ============
  recurring: router({
    list: publicProcedure.query(async () => {
      // Busca transações fixas
      const householdId = await db.getHouseholdId();
      if (!householdId) return [];
      const all = await db.getTransactionsByHousehold(householdId);
      return all.filter((t: any) => t.isFixed);
    }),

    create: protectedProcedure
      .input(
        z.object({
          description: z.string().min(1),
          amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
          type: z.enum(["income", "expense"]),
          paymentMethod: z.enum(["pix", "creditCard"]),
          creditCardId: z.number().optional(),
          categoryId: z.number().optional(),
          person: z.enum(["Igor", "Giovana"]),
          dayOfMonth: z.number().default(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

        const householdId = await db.getOrCreateHousehold(
          userId,
          input.person,
          ctx.user?.email || ""
        );

        const today = new Date();
        const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(input.dayOfMonth).padStart(2, "0")}`;

        const result = await db.createTransaction({
          description: input.description,
          amount: input.amount,
          type: input.type,
          date,
          isFixed: true,
          responsibleUserId: userId,
          householdId,
        });

        return { success: true, id: result?.id };
      }),

    applyMonth: protectedProcedure
      .input(z.object({ month: z.string() }))
      .mutation(async ({ input }) => {
        // TODO: implementar aplicação de recorrências no mês
        return { applied: 0, items: [] };
      }),
  }),

  // ============ SALDO ============
  balance: router({
    getByMonth: publicProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ input }) => {
        const totals = await db.getTransactionTotals(input.month);
        const pixBalance =
          parseFloat(totals.income) - parseFloat(totals.expense);
        return { month: input.month, pixBalance };
      }),

    updateBudget: protectedProcedure
      .input(
        z.object({
          month: z.string(),
          budgetLimit: z.string().regex(/^\d+(\.\d{2})?$/),
        })
      )
      .mutation(async ({ input }) => {
        // TODO: implementar tabela de limites mensais
        return { success: true };
      }),

    recalculate: protectedProcedure
      .input(z.object({ month: z.string() }))
      .mutation(async ({ input }) => {
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
