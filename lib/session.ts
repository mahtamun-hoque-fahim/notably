import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireSession() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  return session ?? null;
}
