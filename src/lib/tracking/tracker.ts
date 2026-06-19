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
let onVisibility: (() => void) | null = null;
let onPageHide: (() => void) | null = null;

// Cap how much a persistent send failure can accumulate, so re-queuing
// can't grow memory without bound while still surviving a transient blip.
const MAX_QUEUE = MAX_BATCH * 4;

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
  // Keep references so `_resetTracker` can actually remove them.
  onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  onPageHide = () => flush();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
}

/** Put a failed batch back at the front of the queue, bounded. */
function requeue(batch: EventInput[]) {
  queue = [...batch, ...queue].slice(0, MAX_QUEUE);
}

function flush() {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];

  const body = JSON.stringify({ events: batch });

  // Prefer sendBeacon — survives tab close, doesn't block nav. It returns
  // false when the payload is too large or the queue is full; fall through
  // to fetch in that case rather than dropping the batch.
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }

  // Best-effort, but don't lose events on a transient failure — re-queue
  // so the next flush retries them.
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) requeue(batch);
    })
    .catch(() => requeue(batch));
}

/** Test/teardown helper — clears state and detaches listeners. */
export function _resetTracker() {
  queue = [];
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  if (onVisibility) {
    document.removeEventListener("visibilitychange", onVisibility);
    onVisibility = null;
  }
  if (onPageHide) {
    window.removeEventListener("pagehide", onPageHide);
    onPageHide = null;
  }
  bound = false;
}
