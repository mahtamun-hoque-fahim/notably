/**
 * Grant a role to a user by email. Roles are server-only (never settable from
 * the client), so this script bootstraps your first admin.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/set-role.mjs you@email.com admin
 *   DATABASE_URL=... node scripts/set-role.mjs teammate@email.com staff
 */
import { neon } from "@neondatabase/serverless";

const [, , email, role = "admin"] = process.argv;

if (!email) {
  console.error("Usage: node scripts/set-role.mjs <email> <user|staff|admin>");
  process.exit(1);
}
if (!["user", "staff", "admin"].includes(role)) {
  console.error(`Invalid role "${role}". Use user, staff, or admin.`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`UPDATE "user" SET role = ${role}, updated_at = now() WHERE email = ${email} RETURNING id, email, role`;

if (rows.length === 0) {
  console.error(`No user found with email ${email}. Have they signed up yet?`);
  process.exit(1);
}
console.log(`✓ ${rows[0].email} is now ${rows[0].role}`);
