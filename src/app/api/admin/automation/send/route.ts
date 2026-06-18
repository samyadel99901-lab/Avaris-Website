import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/admin/session";
import { runSend } from "@/services/automation/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  emails: z.array(z.string().email()).min(1).max(200),
});

/**
 * POST /api/admin/automation/send
 *
 * Creates + sends PayPal invoices for the selected customers. Super-admin
 * only — this spends real money once PAYPAL_MODE=live. Auth is re-checked
 * here (defense in depth) on top of the proxy gate.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (session.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden — super admin only" },
      { status: 403 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    body = bodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid body", details: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  try {
    const report = await runSend({
      emails: body.emails,
      triggeredBy: "manual_admin",
    });
    return NextResponse.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
