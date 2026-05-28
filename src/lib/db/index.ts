import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Edge-compatible Neon HTTP driver. The connection is lazy — `neon()` only
// stores config and doesn't open a socket until a query runs, so this module
// loads safely at build time even when DATABASE_URL is absent (we fall back to
// a placeholder URL). Real queries against a missing/invalid URL fail at
// runtime, which is the correct behavior.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/placeholder";

export const db = drizzle(neon(connectionString), { schema });

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
