import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "./auth-cookie";
import type { AdminSession } from "@/types/admin";

/**
 * Server-side helper: read + verify the admin session cookie.
 * Returns the session payload or null. Use in Server Components,
 * Server Actions, and Route Handlers.
 */
export async function getServerSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(raw);
}
