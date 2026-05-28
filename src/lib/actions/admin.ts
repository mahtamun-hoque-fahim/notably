"use server";

import { headers } from "next/headers";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, isDbConfigured } from "@/lib/db";
import { integrations, notes, user as userTable } from "@/lib/db/schema";

export type Role = "user" | "staff" | "admin";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  noteCount: number;
  createdAt: number;
};

export type DashboardData = {
  metrics: {
    totalUsers: number;
    proUsers: number;
    freeUsers: number;
    newUsers7d: number;
    totalNotes: number;
    notesToday: number;
    notes7d: number;
    hoursTranscribed: number;
    mrr: number;
    connections: number;
  };
  notesPerDay: { label: string; value: number }[];
  users: AdminUserRow[];
};

async function getRole(): Promise<{ role: Role; userId: string } | null> {
  if (!isDbConfigured()) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const role = ((session.user as { role?: string }).role ?? "user") as Role;
  return { role, userId: session.user.id };
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Aggregate dashboard data. Available to staff + admin.
export async function getDashboardDataAction(): Promise<
  { ok: true; data: DashboardData; role: Role } | { ok: false; error: "auth" | "forbidden" }
> {
  const ctx = await getRole();
  if (!ctx) return { ok: false, error: "auth" };
  if (ctx.role !== "admin" && ctx.role !== "staff") return { ok: false, error: "forbidden" };

  const now = new Date();
  const sevenAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Counts
  const [[{ totalUsers }], [{ proUsers }], [{ newUsers7d }]] = await Promise.all([
    db.select({ totalUsers: count() }).from(userTable),
    db.select({ proUsers: count() }).from(userTable).where(eq(userTable.plan, "pro")),
    db.select({ newUsers7d: count() }).from(userTable).where(gte(userTable.createdAt, sevenAgo)),
  ]);

  const [[{ totalNotes }], [{ notesToday }], [{ notes7d }], [{ durSum }], [{ connections }]] =
    await Promise.all([
      db.select({ totalNotes: count() }).from(notes),
      db.select({ notesToday: count() }).from(notes).where(gte(notes.createdAt, startToday)),
      db.select({ notes7d: count() }).from(notes).where(gte(notes.createdAt, sevenAgo)),
      db.select({ durSum: sql<number>`coalesce(sum(${notes.durationMs}), 0)` }).from(notes),
      db.select({ connections: count() }).from(integrations),
    ]);

  // Notes per day (last 7 days) — grouped in SQL, bucketed in JS for gaps.
  const rows = await db
    .select({
      d: sql<string>`to_char(${notes.createdAt}, 'YYYY-MM-DD')`,
      c: sql<number>`count(*)`,
    })
    .from(notes)
    .where(gte(notes.createdAt, sevenAgo))
    .groupBy(sql`to_char(${notes.createdAt}, 'YYYY-MM-DD')`);

  const byDay = new Map(rows.map((r) => [r.d, Number(r.c)]));
  const notesPerDay: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    notesPerDay.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      value: byDay.get(dayKey(d)) ?? 0,
    });
  }

  // Recent users + their note counts.
  const recent = await db
    .select()
    .from(userTable)
    .orderBy(desc(userTable.createdAt))
    .limit(100);

  const noteCounts = await db
    .select({ userId: notes.userId, c: count() })
    .from(notes)
    .groupBy(notes.userId);
  const countMap = new Map(noteCounts.map((r) => [r.userId, Number(r.c)]));

  const users: AdminUserRow[] = recent.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan,
    role: u.role,
    noteCount: countMap.get(u.id) ?? 0,
    createdAt: u.createdAt.getTime(),
  }));

  const pro = Number(proUsers);
  const total = Number(totalUsers);
  const data: DashboardData = {
    metrics: {
      totalUsers: total,
      proUsers: pro,
      freeUsers: total - pro,
      newUsers7d: Number(newUsers7d),
      totalNotes: Number(totalNotes),
      notesToday: Number(notesToday),
      notes7d: Number(notes7d),
      hoursTranscribed: Math.round(Number(durSum) / 3_600_000),
      mrr: pro * 5,
      connections: Number(connections),
    },
    notesPerDay,
    users,
  };

  return { ok: true, data, role: ctx.role };
}

// ───────────────────────── Admin-only mutations ─────────────────────────

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false }> {
  const ctx = await getRole();
  if (!ctx || ctx.role !== "admin") return { ok: false };
  return { ok: true, userId: ctx.userId };
}

export async function setUserPlanAction(
  userId: string,
  plan: "free" | "pro"
): Promise<{ ok: boolean }> {
  const a = await requireAdmin();
  if (!a.ok) return { ok: false };
  await db.update(userTable).set({ plan, updatedAt: new Date() }).where(eq(userTable.id, userId));
  return { ok: true };
}

export async function setUserRoleAction(
  userId: string,
  role: Role
): Promise<{ ok: boolean; error?: string }> {
  const a = await requireAdmin();
  if (!a.ok) return { ok: false };
  // Guard: an admin can't strip their own admin role (avoid lockout).
  if (userId === a.userId && role !== "admin") return { ok: false, error: "self" };
  await db.update(userTable).set({ role, updatedAt: new Date() }).where(eq(userTable.id, userId));
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  const a = await requireAdmin();
  if (!a.ok) return { ok: false };
  if (userId === a.userId) return { ok: false, error: "self" };
  // Cascades remove the user's notes, usage, integrations, sessions, accounts.
  await db.delete(userTable).where(eq(userTable.id, userId));
  return { ok: true };
}
