import type { EventDataIn, EventInput, EventType } from "@/types/tracking";
import { hasConsent } from "./consent";
import { gatherContext } from "./context";
import { getOrCreateSessionId } from "./session";

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH = 50;
const ENDPOINT = "/api/track";

let queue: EventInput[] = [];
let flushTimer: number | null = null;
let bound = false;

/**
 * Public API. Drop an event from anywhere in the landing. Cheap, sync,
 * no-op on the server and when consent is denied. Network I/O happens
 * later via `flush()`.
 */
export function track(payload: EventDataIn): void {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;

  const sessionId = getOrCreateSessionId();
  const ctx = gatherContext(sessionId);

  queue.push({
    sessionId,
    eventType: payload.type as EventType,
    eventData: stripDiscriminator(payload),
    path: ctx.path,
    referrer: ctx.referrer,
    utmSource: ctx.utmSource,
    utmMedium: ctx.utmMedium,
    utmCampaign: ctx.utmCampaign,
    userAgent: ctx.userAgent,
    viewportWidth: ctx.viewportWidth,
    viewportHeight: ctx.viewportHeight,
  });

  bindOnce();

  if (queue.length >= MAX_BATCH) flush();
}

function stripDiscriminator(p: EventDataIn): Record<string, unknown> {
  const { type: _type, ...rest } = p as { type: string } & Record<string, unknown>;
  void _type;
  return rest;
}

function bindOnce() {
  if (bound || typeof window === "undefined") return;
  bound = true;

  flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);

  // Best-effort flush on tab hide / unload — sendBeacon survives nav.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}

function flush() {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];

  const body = JSON.stringify({ events: batch });

  // Prefer sendBeacon — survives tab close, doesn't block nav.
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (ok) return;
    }
  } catch {
    /* fall through to fetch */
  }

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* tracking is best-effort; swallow */
  });
}

/** Test/teardown helper — clears state so callers can re-init. */
export function _resetTracker() {
  queue = [];
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  bound = false;
}
