import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  const db = getDb();
  const where = folderId
    ? and(eq(notes.userId, userId), eq(notes.folderId, folderId as string))
    : eq(notes.userId, userId);

  const result = await db
    .select()
    .from(notes)
    .where(where)
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const { title, content, folderId } = body;

  const db = getDb();
  const wordCount = String(
    (content ?? "").trim().split(/\s+/).filter(Boolean).length
  );

  const [note] = await db
    .insert(notes)
    .values({
      userId,
      title: title || "Untitled",
      content: content || "",
      folderId: folderId || null,
      wordCount,
    })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
