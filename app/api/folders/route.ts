import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const result = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, session.user.id))
    .orderBy(asc(folders.createdAt));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, color } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const [folder] = await db
    .insert(folders)
    .values({ userId: session.user.id, name: name.trim(), color: color || "#00e676" })
    .returning();

  return NextResponse.json(folder, { status: 201 });
}
