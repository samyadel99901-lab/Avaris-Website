import { env } from "@/lib/env";

const CONSENT_KEY = "avaris-tracking-consent";
const CONSENT_EVENT = "avaris-consent-change";

/** Tracking is wired for this deploy at all. */
const enabled = env.NEXT_PUBLIC_TRACKING_ENABLED === "true";

export type ConsentState = "granted" | "denied" | "unknown";

/**
 * Current decision for this browser.
 *
 * `Do Not Track` and headless automation count as an implicit **denied**
 * so we never track them and never show them a banner. Otherwise the value
 * comes from the explicit choice stored in localStorage; absent a choice it
 * is **unknown** (banner pending). Default is therefore deny, not allow.
 */
function read(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  if (window.navigator.doNotTrack === "1" || window.navigator.webdriver) {
    return "denied";
  }
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    if (v === "granted") return "granted";
    if (v === "denied") return "denied";
  } catch {
    /* localStorage blocked — leave the decision pending */
  }
  return "unknown";
}

export function getConsentState(): ConsentState {
  return read();
}

/**
 * Server snapshot for `useSyncExternalStore`. Always "unknown" so the first
 * client (hydration) render matches the server, then re-renders with the
 * real localStorage value — no hydration mismatch.
 */
export function getConsentServerState(): ConsentState {
  return "unknown";
}

/** Persist an explicit Accept / Decline and notify subscribers live. */
export function setConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    /* ignore — without storage the choice just won't persist */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/**
 * Tracking may run only on explicit opt-in (default deny), only when enabled
 * for this deploy, and never under DNT / headless automation.
 */
export function hasConsent(): boolean {
  return enabled && read() === "granted";
}

/** Whether tracking is wired for this deploy (gates the consent banner). */
export function trackingEnabled(): boolean {
  return enabled;
}

/** Subscribe to consent changes (same tab via custom event, other tabs via
 *  the `storage` event). For `useSyncExternalStore`. */
export function subscribeConsent(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CONSENT_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CONSENT_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
