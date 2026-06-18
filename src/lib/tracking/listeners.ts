import { track } from "./tracker";

const SCROLL_THRESHOLDS: ReadonlyArray<25 | 50 | 75 | 100> = [25, 50, 75, 100];

/**
 * Wires scroll-depth milestones for the current page mount. Each
 * threshold fires once, the first time it's reached. Returns a detach
 * function — re-attach per page via the TrackingProvider effect.
 */
export function attachScrollDepthListener(): () => void {
  if (typeof window === "undefined") return () => {};
  const fired = new Set<number>();

  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    for (const t of SCROLL_THRESHOLDS) {
      if (!fired.has(t) && pct >= t) {
        fired.add(t);
        track({ type: "scroll_depth", percent: t });
      }
    }
  };

  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(handler);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(raf);
  };
}

/**
 * Delegated click handler for any anchor with [data-track]. Use:
 *   <a href="…"
 *      data-track="cta_click"          // or "external"
 *      data-track-label="Email us"
 *      data-track-location="final-cta">
 *
 * If `href` looks like an external URL we additionally fire an
 * `external_link` event so we can see who's leaving the site.
 */
export function attachAnchorListener(): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest("a[data-track]") as HTMLAnchorElement | null;
    if (!anchor) return;

    const kind = anchor.getAttribute("data-track");
    const label =
      anchor.getAttribute("data-track-label") ||
      anchor.textContent?.trim() ||
      "(unknown)";
    const location = anchor.getAttribute("data-track-location") || "unknown";
    const href = anchor.getAttribute("href") || "";

    if (kind === "external" || isExternalHttp(href)) {
      track({ type: "external_link", href, label });
      return;
    }
    track({
      type: "cta_click",
      ctaLabel: label,
      location,
      destination: href,
    });
  };

  document.addEventListener("click", handler, { capture: true });
  return () => document.removeEventListener("click", handler, true);
}

function isExternalHttp(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const url = new URL(href, window.location.origin);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}
