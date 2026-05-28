"use server";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { db, isDbConfigured } from "@/lib/db";
import { notes } from "@/lib/db/schema";

const MODEL = process.env.OPENAI_ENRICH_MODEL ?? "gpt-4o-mini";

export type EnrichResult =
  | { ok: true; title: string; summary: string; tags: string[] }
  | { ok: false; error: "auth" | "pro" | "unconfigured" | "notfound" | "failed" };

async function currentUser() {
  if (!isDbConfigured()) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// Generate a clean title, a one-sentence summary, and 2–5 tags for a note.
// Pro-only — it costs an LLM call per note.
export async function enrichNoteAction(id: string): Promise<EnrichResult> {
  if (!process.env.OPENAI_API_KEY) return { ok: false, error: "unconfigured" };
  const u = await currentUser();
  if (!u) return { ok: false, error: "auth" };
  if (((u as { plan?: string }).plan ?? "free") !== "pro") return { ok: false, error: "pro" };

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, u.id)));
  if (!note) return { ok: false, error: "notfound" };

  // Cap the body we send to keep token cost bounded.
  const body = note.body.slice(0, 6000);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You clean up voice-note transcripts. Given a raw transcript, return strict JSON " +
            'with keys: "title" (a short, specific title, max 8 words, no quotes), ' +
            '"summary" (one concise sentence capturing the gist), and ' +
            '"tags" (an array of 2 to 5 short lowercase topic tags, single words or short phrases, ' +
            "no # symbol). Respond in the same language as the transcript. Return only the JSON.",
        },
        { role: "user", content: body },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      title?: string;
      summary?: string;
      tags?: unknown;
    };

    const title = (parsed.title || note.title).trim().slice(0, 120);
    const summary = (parsed.summary || "").trim().slice(0, 400);
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.replace(/^#/, "").trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    await db
      .update(notes)
      .set({ title, summary, tags, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, u.id)));

    return { ok: true, title, summary, tags };
  } catch {
    return { ok: false, error: "failed" };
  }
}
