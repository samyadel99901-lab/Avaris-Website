import type { TrackingContext } from "@/types/tracking";

/**
 * Reduce a full User-Agent string to a coarse "Browser · OS" bucket. The
 * raw UA is a fingerprinting surface; for analytics we only need rough
 * browser/OS share, so we never store the verbatim string.
 */
function coarseUserAgent(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Other";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Other";
  return `${browser} · ${os}`;
}

/**
 * Snapshot the current page context for an event. Intentionally
 * contains no PII: no IP, no email, no cookie ID, no verbatim UA. Session
 * id is the client-only identifier we use to link events from the same
 * session.
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
    userAgent: coarseUserAgent(window.navigator.userAgent),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}
