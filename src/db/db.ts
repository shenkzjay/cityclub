import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema"; // Removed .js extension
// import "dotenv/config";

function getNeonHttpUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  // ✅ Convert postgresql:// → https://
  if (url.startsWith("postgresql://")) {
    return url.replace("postgresql://", "https://");
  }

  // If it's already https://, use as-is
  if (url.startsWith("https://")) {
    return url;
  }

  throw new Error("Invalid DATABASE_URL protocol. Must be postgresql:// or https://");
}

let drizzleInstance: NeonHttpDatabase<typeof schema> | undefined;

export const db = {
  get: () => {
    if (!drizzleInstance) {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
      }
      getNeonHttpUrl();
      const sql = neon(process.env.DATABASE_URL);
      drizzleInstance = drizzle(sql, { schema });
    }
    return drizzleInstance;
  },
};
