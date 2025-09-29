// import { createNextApiHandler } from "@trpc/server/adapters/next";
// import { createVercelHandler } from "@trpc/server/adapters/vercel"
// import { appRouter } from "../../server/index";
// import { createContext } from "../../server/trpc";
// import cors from "cors";

// const handler = createVercelHandler({
//   router: appRouter,
//   createContext,
// });
import { appRouter } from "../../src/server/index.js";
import { createContext } from "../../src/server/trpc.js";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// const corsMiddleware = cors({
//   methods: ["GET", "POST", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   origin: process.env.TRPC_CORS_ORIGIN
//     ? process.env.TRPC_CORS_ORIGIN.split(",")
//     : ["http://localhost:5173", "http://localhost:5174"],
//   credentials: true,
// });

export default async function handler(request: Request): Promise<Response> {
  // Handle tRPC requests
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext,
  });
}
