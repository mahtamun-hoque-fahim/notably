"use server";

import { headers } from "next/headers";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, isDbConfigured } from "@/lib/db";
import { notes, usage } from "@/lib/db/schema";
import { DAILY_FREE_LIMIT } from "@/lib/notes";

export type ActionNote = {
  id: string;
  title: string;
  body: string;
  durationMs: number;
  lang: string;
  createdAt: number;
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function requireUser() {
  if (!isDbConfigured()) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function toActionNote(row: typeof notes.$inferSelect): ActionNote {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    durationMs: row.durationMs,
    lang: row.lang,
    createdAt: row.createdAt.getTime(),
  };
}

// ───────────────────────── Read ─────────────────────────

export async function listNotesAction(): Promise<ActionNote[]> {
  const u = await requireUser();
  if (!u) return [];
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, u.id))
    .orderBy(desc(notes.createdAt));
  return rows.map(toActionNote);
}

export async function getUsageAction(
  localDate: string
): Promise<{ used: number; remaining: number; plan: string }> {
  const u = await requireUser();
  if (!u) return { used: 0, remaining: DAILY_FREE_LIMIT, plan: "free" };

  const [row] = await db
    .select({ count: usage.count })
    .from(usage)
    .where(and(eq(usage.userId, u.id), eq(usage.date, localDate)));

  const plan = (u as { plan?: string }).plan ?? "free";
  const used = row?.count ?? 0;
  const remaining = plan === "pro" ? Infinity : Math.max(0, DAILY_FREE_LIMIT - used);
  return { used, remaining: remaining === Infinity ? 9999 : remaining, plan };
}

// ───────────────────────── Mutations ─────────────────────────

export async function createNoteAction(input: {
  title: string;
  body: string;
  durationMs: number;
  lang: string;
  localDate: string;
}): Promise<{ ok: true; note: ActionNote } | { ok: false; error: "quota" | "auth" }> {
  const u = await requireUser();
  if (!u) return { ok: false, error: "auth" };

  const plan = (u as { plan?: string }).plan ?? "free";

  // Server-side quota enforcement (free tier only).
  if (plan !== "pro") {
    const [row] = await db
      .select({ count: usage.count })
      .from(usage)
      .where(and(eq(usage.userId, u.id), eq(usage.date, input.localDate)));
    if ((row?.count ?? 0) >= DAILY_FREE_LIMIT) {
      return { ok: false, error: "quota" };
    }
  }

  const [created] = await db
    .insert(notes)
    .values({
      id: genId("note"),
      userId: u.id,
      title: input.title,
      body: input.body,
      durationMs: input.durationMs,
      lang: input.lang,
    })
    .returning();

  // Upsert the daily usage counter.
  await db
    .insert(usage)
    .values({ id: genId("use"), userId: u.id, date: input.localDate, count: 1 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.date],
      set: { count: sql`${usage.count} + 1` },
    });

  return { ok: true, note: toActionNote(created) };
}

export async function updateNoteAction(input: {
  id: string;
  title: string;
  body: string;
}): Promise<{ ok: boolean }> {
  const u = await requireUser();
  if (!u) return { ok: false };
  await db
    .update(notes)
    .set({ title: input.title, body: input.body, updatedAt: new Date() })
    .where(and(eq(notes.id, input.id), eq(notes.userId, u.id)));
  return { ok: true };
}

export async function deleteNoteAction(id: string): Promise<{ ok: boolean }> {
  const u = await requireUser();
  if (!u) return { ok: false };
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, u.id)));
  return { ok: true };
}

// Bulk import — used once when a guest signs in and has local notes.
// Does NOT count against the daily quota (these were already created locally).
export async function importNotesAction(
  items: { title: string; body: string; durationMs: number; lang: string; createdAt: number }[]
): Promise<{ ok: boolean; imported: number }> {
  const u = await requireUser();
  if (!u) return { ok: false, imported: 0 };
  if (items.length === 0) return { ok: true, imported: 0 };

  const rows = items.slice(0, 200).map((it) => ({
    id: genId("note"),
    userId: u.id,
    title: it.title,
    body: it.body,
    durationMs: it.durationMs,
    lang: it.lang,
    createdAt: new Date(it.createdAt),
  }));

  await db.insert(notes).values(rows);
  return { ok: true, imported: rows.length };
}
