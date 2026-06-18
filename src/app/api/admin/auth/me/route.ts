import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/admin/session";
import { getAuthService } from "@/services/admin";

export const runtime = "nodejs";

/**
 * GET /api/admin/auth/me
 *
 * Returns the current admin profile or 401 if no valid session.
 * Useful for client-side bootstrapping (e.g. UserMenu rendering).
 */
export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Re-fetch from the source of truth so a stale cookie can't drift
  // from current admin state (e.g. role changed, admin removed).
  const auth = getAuthService();
  const admin = await auth.getAdmin(session.adminId);
  if (!admin) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  return NextResponse.json({ admin, expiresAt: session.expiresAt });
}
