import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, color } = body;

  const db = getDb();
  const [updated] = await db
    .update(folders)
    .set({
      ...(name && { name: name.trim() }),
      ...(color && { color }),
      updatedAt: new Date(),
    })
    .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = getDb();
  await db
    .delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
