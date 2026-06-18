import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/anti-spam";
import { createEventsService } from "@/services/tracking";
import type { EventInput, EventType } from "@/types/tracking";

export const runtime = "nodejs";

// Per-event input — `eventData` is jsonb, so we just pass through the
// remaining keys. The discriminator becomes `eventType` on the way in.
const eventSchema = z.object({
  sessionId: z.string().min(1).max(64),
  eventType: z.enum([
    "page_view",
    "video_play",
    "video_progress",
    "cta_click",
    "scroll_depth",
    "external_link",
  ]),
  eventData: z.record(z.string(), z.unknown()).default({}),
  path: z.string().min(1).max(500),
  referrer: z.string().max(2000).nullable().optional(),
  utmSource: z.string().max(200).nullable().optional(),
  utmMedium: z.string().max(200).nullable().optional(),
  utmCampaign: z.string().max(200).nullable().optional(),
  userAgent: z.string().max(500).nullable().optional(),
  viewportWidth: z.number().int().nonnegative().max(10_000).nullable().optional(),
  viewportHeight: z.number().int().nonnegative().max(10_000).nullable().optional(),
});

const payloadSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

/**
 * POST /api/track
 *
 * Ingests a batch of visitor events from `tracker.ts`. Validates with
 * Zod, rate-limits per-IP (60/min — generous so a single noisy session
 * doesn't get cut off), forwards to the configured `EventsService`.
 *
 * Returns 204 No Content on success — fire-and-forget for the client.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limiter = rateLimit(`track:${ip}`, { windowMs: 60_000, max: 60 });
  if (!limiter.ok) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000)),
      },
    });
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = payloadSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const events: EventInput[] = parsed.events.map((e) => ({
    sessionId: e.sessionId,
    eventType: e.eventType as EventType,
    eventData: e.eventData,
    path: e.path,
    referrer: e.referrer ?? null,
    utmSource: e.utmSource ?? null,
    utmMedium: e.utmMedium ?? null,
    utmCampaign: e.utmCampaign ?? null,
    userAgent: e.userAgent ?? null,
    viewportWidth: e.viewportWidth ?? null,
    viewportHeight: e.viewportHeight ?? null,
  }));

  try {
    const service = createEventsService();
    await service.insertBatch(events);
  } catch (err) {
    console.error("[track] insert failed", err);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
