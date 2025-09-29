import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./index.js";
import { createContext } from "./trpc.js";
import cors from "cors";
import "dotenv/config";

const port = 3005;

createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // ✅ Allow Vite dev server
    credentials: true, // ✅ If you use cookies/auth
  }),
}).listen(port);

console.log(`✅ tRPC server running on http://localhost:${port}`);
