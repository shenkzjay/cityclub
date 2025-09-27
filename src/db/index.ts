import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import "dotenv/config";

// Load environment variables
const dbPath = process.env.DB_FILENAME || "db.sqlite";

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Export the sqlite instance if you need raw queries
export { sqlite };
