"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { hasConsent } from "@/lib/tracking/consent";
import {
  attachAnchorListener,
  attachScrollDepthListener,
} from "@/lib/tracking/listeners";
import { track } from "@/lib/tracking/tracker";

/**
 * Mounts at the root of the landing layout. Skipped on /admin/*.
 *
 *  - Fires `page_view` on mount + every App Router navigation
 *  - Re-attaches scroll-depth listener per route so milestones reset
 *  - Attaches a single delegated anchor click listener
 */
export function TrackingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Page view on every path / search change. App Router doesn't expose
  // a single "navigation complete" hook; pathname+search effectively
  // covers regular nav, back/forward, and `?utm_*` re-entries.
  useEffect(() => {
    if (!hasConsent()) return;
    if (pathname.startsWith("/admin")) return;
    track({ type: "page_view" });
  }, [pathname, searchParams]);

  // Scroll listener: re-mounts each route so the `fired` set resets.
  // Anchor listener: same lifecycle for consistency.
  useEffect(() => {
    if (!hasConsent()) return;
    if (pathname.startsWith("/admin")) return;
    const detachScroll = attachScrollDepthListener();
    const detachAnchors = attachAnchorListener();
    return () => {
      detachScroll();
      detachAnchors();
    };
  }, [pathname]);

  return <>{children}</>;
}
