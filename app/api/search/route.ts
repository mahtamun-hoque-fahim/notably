import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) return NextResponse.json([]);

  const db = getDb();
  const results = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      wordCount: notes.wordCount,
      isPinned: notes.isPinned,
      folderId: notes.folderId,
      updatedAt: notes.updatedAt,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, session.user.id),
        or(
          ilike(notes.title, `%${q}%`),
          ilike(notes.content, `%${q}%`)
        )
      )
    )
    .orderBy(desc(notes.updatedAt))
    .limit(20);

  return NextResponse.json(results);
}
