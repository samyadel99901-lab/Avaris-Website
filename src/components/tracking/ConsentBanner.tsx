"use client";

import { useSyncExternalStore } from "react";
import {
  getConsentServerState,
  getConsentState,
  setConsent,
  subscribeConsent,
  trackingEnabled,
} from "@/lib/tracking/consent";

/**
 * Bottom cookie-consent bar. Shown only when analytics tracking is wired for
 * the deploy AND the visitor hasn't decided yet (default deny — nothing is
 * tracked until "Accept"). Reads state through `useSyncExternalStore` so it
 * reacts live to a choice and never trips a hydration mismatch.
 */
export function ConsentBanner() {
  const state = useSyncExternalStore(
    subscribeConsent,
    getConsentState,
    getConsentServerState,
  );

  if (!trackingEnabled() || state !== "unknown") return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80"
    >
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-body text-sm text-ink-muted">
          We use privacy-friendly analytics to understand how this site is
          used. No tracking runs until you accept.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent(false)}
            className="rounded-full border border-white/15 px-4 py-2 font-body text-sm text-ink transition-colors hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setConsent(true)}
            className="rounded-full bg-ink px-4 py-2 font-body text-sm font-medium text-canvas transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
