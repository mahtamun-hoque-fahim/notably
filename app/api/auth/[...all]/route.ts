import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

// Defer handler creation to request time so DATABASE_URL isn't needed at build
export function GET(req: NextRequest) {
  return toNextJsHandler(getAuth()).GET(req);
}

export function POST(req: NextRequest) {
  return toNextJsHandler(getAuth()).POST(req);
}
