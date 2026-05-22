import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import OpenAI from "openai";
import { getDb } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("audio") as File | null;
  const noteId = formData.get("noteId") as string | null;
  const mode = (formData.get("mode") as string) ?? "append"; // "append" | "replace"

  if (!file || !noteId) {
    return NextResponse.json({ error: "Missing audio or noteId" }, { status: 400 });
  }

  // Verify note ownership
  const db = getDb();
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)));

  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
    response_format: "text",
  });

  const transcript = (transcription as unknown as string).trim();

  // Merge into note content
  const newContent =
    mode === "replace"
      ? transcript
      : note.content
      ? `${note.content}\n\n${transcript}`
      : transcript;

  const wordCount = String(newContent.trim().split(/\s+/).filter(Boolean).length);

  const [updated] = await db
    .update(notes)
    .set({ content: newContent, wordCount, updatedAt: new Date() })
    .where(eq(notes.id, noteId))
    .returning();

  return NextResponse.json({ transcript, content: updated.content });
}
