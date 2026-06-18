import type { TrackingContext } from "@/types/tracking";

/**
 * Snapshot the current page context for an event. Intentionally
 * contains no PII: no IP, no email, no cookie ID. Session id is the
 * client-only identifier we use to link events from the same session.
 */
export function gatherContext(sessionId: string): TrackingContext {
  if (typeof window === "undefined") {
    return {
      sessionId,
      path: "",
      referrer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      userAgent: null,
      viewportWidth: null,
      viewportHeight: null,
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    sessionId,
    path: window.location.pathname,
    referrer: window.document.referrer || null,
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    userAgent: window.navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}
