import { COOKIE_NAME } from "@shared/const";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import type { Profile } from "../../drizzle/schema";
import * as db from "../db";
import { verifySession } from "./session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: Profile | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: Profile | null = null;

  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
    const session = await verifySession(cookies[COOKIE_NAME]);
    if (session) {
      user = (await db.getProfileById(session.profileId)) ?? null;
    }
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
