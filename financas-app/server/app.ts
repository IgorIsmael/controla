import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createContext } from "./_core/context";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";

/**
 * Builds the Express app with only the API routes (tRPC + storage proxy).
 * No `.listen()` here and no static file serving — this is shared between:
 *  - the Vercel serverless function (api/index.ts)
 *  - the local/self-hosted server (server/_core/index.ts), which adds
 *    static file serving / Vite dev middleware on top of this.
 */
export function createApiApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
