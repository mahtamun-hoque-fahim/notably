import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing env: DATABASE_URL");
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}
