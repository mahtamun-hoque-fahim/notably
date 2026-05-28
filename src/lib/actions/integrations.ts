"use server";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, isDbConfigured } from "@/lib/db";
import { integrations, notes } from "@/lib/db/schema";

type Provider = "slack" | "notion";

function genId(): string {
  return `int_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function currentUser() {
  if (!isDbConfigured()) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function isPro(u: { plan?: string | null }): boolean {
  return (u.plan ?? "free") === "pro";
}

// ───────────────────────── Connection management ─────────────────────────

// Returns which providers are connected — never the stored secrets.
export async function getConnectionsAction(): Promise<{
  slack: boolean;
  notion: boolean;
  emailConfigured: boolean;
}> {
  const u = await currentUser();
  if (!u) return { slack: false, notion: false, emailConfigured: false };
  const rows = await db
    .select({ provider: integrations.provider })
    .from(integrations)
    .where(eq(integrations.userId, u.id));
  const set = new Set(rows.map((r) => r.provider));
  return {
    slack: set.has("slack"),
    notion: set.has("notion"),
    emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EXPORT_FROM_EMAIL),
  };
}

async function upsertIntegration(userId: string, provider: Provider, config: object) {
  await db
    .insert(integrations)
    .values({ id: genId(), userId, provider, config: JSON.stringify(config) })
    .onConflictDoUpdate({
      target: [integrations.userId, integrations.provider],
      set: { config: JSON.stringify(config), updatedAt: new Date() },
    });
}

export async function saveSlackAction(webhookUrl: string): Promise<{ ok: boolean; error?: string }> {
  const u = await currentUser();
  if (!u) return { ok: false, error: "auth" };
  if (!isPro(u)) return { ok: false, error: "pro" };
  if (!/^https:\/\/hooks\.slack\.com\//.test(webhookUrl.trim())) {
    return { ok: false, error: "invalid" };
  }
  await upsertIntegration(u.id, "slack", { webhookUrl: webhookUrl.trim() });
  return { ok: true };
}

export async function saveNotionAction(
  token: string,
  parentPageId: string
): Promise<{ ok: boolean; error?: string }> {
  const u = await currentUser();
  if (!u) return { ok: false, error: "auth" };
  if (!isPro(u)) return { ok: false, error: "pro" };
  if (!token.trim() || !parentPageId.trim()) return { ok: false, error: "invalid" };
  // Accept a raw page ID or a full Notion URL; extract the 32-char id.
  const id = parentPageId.replace(/-/g, "").match(/[0-9a-f]{32}/i)?.[0];
  if (!id) return { ok: false, error: "invalid" };
  await upsertIntegration(u.id, "notion", { token: token.trim(), parentPageId: id });
  return { ok: true };
}

export async function removeConnectionAction(provider: Provider): Promise<{ ok: boolean }> {
  const u = await currentUser();
  if (!u) return { ok: false };
  await db
    .delete(integrations)
    .where(and(eq(integrations.userId, u.id), eq(integrations.provider, provider)));
  return { ok: true };
}

// ───────────────────────── Export ─────────────────────────

async function getConfig<T>(userId: string, provider: Provider): Promise<T | null> {
  const [row] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)));
  if (!row) return null;
  try {
    return JSON.parse(row.config) as T;
  } catch {
    return null;
  }
}

export type ExportTarget = "email" | "slack" | "notion";

export async function exportNoteAction(
  id: string,
  target: ExportTarget,
  emailTo?: string
): Promise<{ ok: boolean; error?: string }> {
  const u = await currentUser();
  if (!u) return { ok: false, error: "auth" };
  if (!isPro(u)) return { ok: false, error: "pro" };

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, u.id)));
  if (!note) return { ok: false, error: "notfound" };

  const tagLine = note.tags && note.tags.length > 0 ? note.tags.map((t) => `#${t}`).join(" ") : "";

  try {
    if (target === "email") {
      if (!process.env.RESEND_API_KEY || !process.env.EXPORT_FROM_EMAIL) {
        return { ok: false, error: "unconfigured" };
      }
      const to = (emailTo || u.email).trim();
      const html =
        `<h2>${escapeHtml(note.title)}</h2>` +
        (note.summary ? `<p><em>${escapeHtml(note.summary)}</em></p>` : "") +
        `<p>${escapeHtml(note.body).replace(/\n/g, "<br>")}</p>` +
        (tagLine ? `<p style="color:#4f7a5a">${escapeHtml(tagLine)}</p>` : "") +
        `<hr><p style="color:#888;font-size:12px">Captured with Notably</p>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EXPORT_FROM_EMAIL,
          to,
          subject: note.title,
          html,
        }),
      });
      if (!res.ok) return { ok: false, error: "failed" };
      return { ok: true };
    }

    if (target === "slack") {
      const cfg = await getConfig<{ webhookUrl: string }>(u.id, "slack");
      if (!cfg?.webhookUrl) return { ok: false, error: "notconnected" };
      const text =
        `*${note.title}*\n` +
        (note.summary ? `_${note.summary}_\n` : "") +
        `${note.body}\n` +
        (tagLine ? tagLine : "");
      const res = await fetch(cfg.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return { ok: false, error: "failed" };
      return { ok: true };
    }

    if (target === "notion") {
      const cfg = await getConfig<{ token: string; parentPageId: string }>(u.id, "notion");
      if (!cfg?.token || !cfg?.parentPageId) return { ok: false, error: "notconnected" };

      const children: unknown[] = [];
      if (note.summary) {
        children.push(paragraph(note.summary, true));
      }
      // Split the body into paragraphs; Notion blocks cap at ~2000 chars each.
      for (const para of note.body.split(/\n{2,}/)) {
        for (const chunk of chunkText(para.trim(), 1900)) {
          if (chunk) children.push(paragraph(chunk));
        }
      }
      if (tagLine) children.push(paragraph(tagLine));

      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { page_id: cfg.parentPageId },
          properties: {
            title: { title: [{ text: { content: note.title.slice(0, 100) } }] },
          },
          children,
        }),
      });
      if (!res.ok) return { ok: false, error: "failed" };
      return { ok: true };
    }

    return { ok: false, error: "failed" };
  } catch {
    return { ok: false, error: "failed" };
  }
}

// ───────────────────────── helpers ─────────────────────────

function paragraph(text: string, italic = false) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: text }, annotations: { italic } }],
    },
  };
}

function chunkText(text: string, size: number): string[] {
  if (text.length <= size) return [text];
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
