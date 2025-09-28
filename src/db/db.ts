import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";
// import "dotenv/config";

let _drizzleInstance: NeonHttpDatabase<typeof schema> | undefined;

export const db = {
  get: () => {
    if (!_drizzleInstance) {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
      }
      const sql = neon(process.env.DATABASE_URL);
      _drizzleInstance = drizzle(sql, { schema });
    }
    return _drizzleInstance;
  },
};
