/**
 * Cloudflare Stream video-ID map + iframe-URL helpers.
 *
 * Videos now play from Cloudflare Stream. The `.jpg` posters/thumbnails stay
 * LOCAL (served from /public) — we only map each local video path to its
 * Stream video ID so the player can be embedded.
 */

/** Customer subdomain for the Stream embed domain. */
export const STREAM_CUSTOMER = "customer-7fv8604cj73c3ujd";

/**
 * Absolute origin used to build poster URLs the Stream player can fetch.
 * The player runs inside a cloudflarestream.com iframe, so a relative
 * `/x.jpg` would resolve against Stream's domain, not ours — it needs an
 * absolute URL back to our site.
 */
const SITE_ORIGIN = "https://avarisco.net";

/** local video path → Cloudflare Stream video ID */
const STREAM_IDS: Record<string, string> = {
  "/video-production/architectural-1.mp4": "926d9c1bd8dee4983614f86404796655",
  "/video-production/architectural-2.mp4": "416eb9823fa16701b6fc3a6fbc2fda4d",
  "/video-production/branding.mp4": "72896df12d6ed14a1823b5cd63d7e4fb",
  "/video-production/branding2.mp4": "73628de9cf622d518c7ba41e94c06060",
  "/video-production/cinematic.mp4": "d14c9b9180db976eaca9183631e3ab05",
  "/video-production/cinematic2.mp4": "8c48f58c18f0b8d77ed504047194866f",
  "/video-production/lifestyle.mp4": "272174f0cf6475ace452156af7a2815c",
  "/video-production/lifestyle2.mp4": "d0433d7383f6a7380f9a4166850eeddb",
  "/video-production/realtor.mp4": "ac98f5076c68e9f8fcf11d24984eef37",
  "/video-production/realtor2.mp4": "1694adac12428d726de63070fd23c26d",
  "/video-production/trendy.mp4": "c4655162ca9464105b547b9aa9b70645",
  "/video-production/trendy2.mp4": "8aa3c699dcd6dea3e3c7eb5165710066",
  "/video-production/website cover.mp4": "ea05d80e42fe6e63de7bed1a2e04bed6",
  // VFX3D uses the /vfx/ paths — same underlying files as the two
  // architectural clips above, so they reuse the same Stream IDs.
  "/vfx/architectural-1.mp4": "926d9c1bd8dee4983614f86404796655",
  "/vfx/architectural-2.mp4": "416eb9823fa16701b6fc3a6fbc2fda4d",
};

/** Look up the Cloudflare Stream video ID for a local video path. */
export function streamId(path: string): string | undefined {
  return STREAM_IDS[path];
}

/** Absolute URL for a local poster so the Stream player (on its own domain)
 *  can load it. Pass a site-relative path like `/hero.jpg`. */
export function posterUrl(localPath: string): string {
  return `${SITE_ORIGIN}${localPath}`;
}

type StreamParams = Record<string, string | number | boolean>;

/** Build the Cloudflare Stream iframe URL for a video ID + query params. */
export function streamIframeUrl(id: string, params: StreamParams = {}): string {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const base = `https://${STREAM_CUSTOMER}.cloudflarestream.com/${id}/iframe`;
  return qs ? `${base}?${qs}` : base;
}
