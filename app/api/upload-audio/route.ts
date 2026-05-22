import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { uploadAudioToCloudinary } from "@/lib/cloudinary";
import { getDb } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("audio") as File | null;
  const noteId = formData.get("noteId") as string | null;

  if (!file || !noteId) {
    return NextResponse.json({ error: "Missing audio or noteId" }, { status: 400 });
  }

  // Verify note belongs to user
  const db = getDb();
  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)));

  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicId = `${session.user.id}-${noteId}`;

  const audioUrl = await uploadAudioToCloudinary(buffer, publicId);

  const [updated] = await db
    .update(notes)
    .set({ audioUrl, updatedAt: new Date() })
    .where(eq(notes.id, noteId))
    .returning();

  return NextResponse.json({ audioUrl: updated.audioUrl });
}
