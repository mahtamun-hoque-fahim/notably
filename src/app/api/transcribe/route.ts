import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { auth } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";

// Whisper needs Node (file handling, larger payloads), not edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Fallback transcription for browsers without the Web Speech API (e.g. Firefox).
// Gated behind a session so it can't be abused anonymously — each call costs money.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "transcription not configured" }, { status: 503 });
  }

  // Require a signed-in user (DB must be configured for sessions to exist).
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 });
  }

  const audio = form.get("audio");
  const lang = (form.get("lang") as string | null) ?? undefined;
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "no audio" }, { status: 400 });
  }
  // Guard against oversized uploads (~25MB Whisper limit).
  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "audio too large" }, { status: 413 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const buf = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buf, "audio.webm", { type: audio.type || "audio/webm" });

    const result = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      // Whisper wants a 2-letter ISO-639-1 code; our langs are BCP-47 (e.g. en-US).
      language: lang ? lang.split("-")[0] : undefined,
    });

    return NextResponse.json({ text: result.text });
  } catch {
    return NextResponse.json({ error: "transcription failed" }, { status: 500 });
  }
}
