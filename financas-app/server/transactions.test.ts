import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: "00000000-0000-0000-0000-000000000002",
    email: "igor@example.com",
    displayName: "Igor",
    passwordHash: "somesalt:somehash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("transactions", () => {
  it("should list transactions by month", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.listByMonth({
      month: "2026-07",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get transaction totals", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.getTotals({
      month: "2026-07",
    });

    expect(result).toBeDefined();
    expect(result.income).toBeDefined();
    expect(result.expense).toBeDefined();
  });
});

describe("creditCards", () => {
  it("should list credit cards", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.creditCards.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get credit card totals", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.creditCards.totals();

    expect(result).toBeDefined();
    expect(result.totalLimit).toBeDefined();
    expect(result.totalUsed).toBeDefined();
    expect(result.totalAvailable).toBeDefined();
  });
});
