import { env } from "@/lib/env";

const base = (env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "").replace(/\/+$/, "");

/**
 * Resolve a video path to its servable URL.
 *
 *  - No base (local dev): keep the `/public` subfolder path so the file is
 *    served from disk (e.g. `/video-production/cinematic.mp4`).
 *  - Base set (Cloudflare R2): the bucket is FLAT (objects at the root), so
 *    we use only the filename: `BASE/cinematic.mp4`.
 *
 * The filename is URL-encoded in both cases so the space in
 * "website cover.mp4" becomes `%20`. Pass the raw (unencoded) path.
 *
 * Thumbnails/posters are intentionally NOT routed through here — only the
 * heavy `.mp4` videos live on R2; the `.jpg` posters stay local.
 */
export function videoUrl(path: string): string {
  const i = path.lastIndexOf("/");
  const dir = path.slice(0, i); // "/video-production"
  const file = encodeURIComponent(path.slice(i + 1)); // "website%20cover.mp4"
  return base ? `${base}/${file}` : `${dir}/${file}`;
}
