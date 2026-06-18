import { env } from "@/lib/env";

const OPT_OUT_KEY = "avaris-tracking-opt-out";

/**
 * Tracking is enabled when ALL of the following are true:
 *  - `NEXT_PUBLIC_TRACKING_ENABLED === "true"` (env, controlled per-deploy)
 *  - User hasn't set `Do Not Track`
 *  - User hasn't opted out via `optOut()` (localStorage flag)
 *  - Not running under headless automation (`navigator.webdriver`)
 */
export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (env.NEXT_PUBLIC_TRACKING_ENABLED !== "true") return false;
  if (window.navigator.doNotTrack === "1") return false;
  if (window.navigator.webdriver) return false;
  try {
    if (window.localStorage.getItem(OPT_OUT_KEY) === "1") return false;
  } catch {
    /* localStorage blocked — treat as no opt-out */
  }
  return true;
}

export function optOut() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OPT_OUT_KEY, "1");
  } catch {
    /* ignore */
  }
}
