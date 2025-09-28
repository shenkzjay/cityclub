import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "../../server/index";
import { createContext } from "../../server/trpc";
import cors from "cors";

const handler = createNextApiHandler({
  router: appRouter,
  createContext,
});

const corsMiddleware = cors({
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin: process.env.TRPC_CORS_ORIGIN
    ? process.env.TRPC_CORS_ORIGIN.split(",")
    : ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
});

export default async function trpcApiHandler(req: any, res: any) {
  // Apply CORS middleware
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(null);
    });
  });

  // Handle tRPC request
  return handler(req, res);
}
