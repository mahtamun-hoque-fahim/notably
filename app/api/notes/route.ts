import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
