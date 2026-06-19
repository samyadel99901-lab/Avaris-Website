"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  getConsentServerState,
  getConsentState,
  subscribeConsent,
} from "@/lib/tracking/consent";
import {
  attachAnchorListener,
  attachScrollDepthListener,
} from "@/lib/tracking/listeners";
import { track } from "@/lib/tracking/tracker";

/**
 * Mounts at the root of the landing layout (never on /admin/*, which has its
 * own layout). Reacts live to consent: nothing fires until the visitor opts
 * in, and an opt-in mid-session starts tracking without a reload.
 *
 *  - Fires `page_view` on mount + every App Router navigation
 *  - Re-attaches scroll-depth listener per route so milestones reset
 *  - Attaches a single delegated anchor click listener
 */
export function TrackingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Subscribe to consent so granting it later re-runs the effects below.
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentState,
    getConsentServerState,
  );
  const granted = consent === "granted";

  // Page view on every path / search change. App Router doesn't expose a
  // single "navigation complete" hook; pathname+search effectively covers
  // regular nav, back/forward, and `?utm_*` re-entries.
  useEffect(() => {
    if (!granted) return;
    track({ type: "page_view" });
  }, [pathname, searchParams, granted]);

  // Scroll listener: re-mounts each route so the `fired` set resets.
  // Anchor listener: same lifecycle for consistency.
  useEffect(() => {
    if (!granted) return;
    const detachScroll = attachScrollDepthListener();
    const detachAnchors = attachAnchorListener();
    return () => {
      detachScroll();
      detachAnchors();
    };
  }, [pathname, granted]);

  return <>{children}</>;
}
