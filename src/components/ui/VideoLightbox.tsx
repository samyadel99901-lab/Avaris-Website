"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { DialogShell } from "@/components/forms/DialogShell";
import { posterUrl, streamId, streamIframeUrl } from "@/lib/stream-videos";
import { track } from "@/lib/tracking/tracker";
import { cn } from "@/lib/utils";

export type LightboxVideo = { src: string; label: string };

type VideoLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  videos: LightboxVideo[];
  /** Drives the media box shape so the clip keeps its true proportions. */
  ratio: "16:9" | "9:16";
};

/**
 * Lightbox that shows a category's two video versions, switchable with
 * prev/next. Reuses DialogShell (Radix → focus-trap + Esc). The media box is
 * sized to the clip's aspect ratio (horizontal 16:9, vertical 9:16); the
 * Cloudflare Stream player fills it, so nothing is ever stretched.
 *
 * Videos play from Cloudflare Stream (mapped via streamId); the local .jpg is
 * the poster.
 */
export function VideoLightbox({
  open,
  onOpenChange,
  title,
  videos,
  ratio,
}: VideoLightboxProps) {
  const [index, setIndex] = useState(0);

  // Reset to the first video whenever a different category opens. Done during
  // render (not in an effect) so it's lint-safe re: set-state-in-effect.
  const [prevTitle, setPrevTitle] = useState(title);
  if (title !== prevTitle) {
    setPrevTitle(title);
    setIndex(0);
  }

  const total = videos.length;
  const current = videos[index];
  const id = current ? streamId(current.src) : undefined;

  const go = (dir: number) => {
    const next = (index + dir + total) % total;
    // Track viewing the switched-to version. The primary version is tracked
    // by the card when the lightbox first opens.
    track({ type: "video_play", videoSrc: videos[next].src, videoLabel: title });
    setIndex(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (total < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      maxWidthClassName={ratio === "16:9" ? "max-w-5xl" : "max-w-xl"}
    >
      {current && (
        <div onKeyDown={onKeyDown}>
          <div
            className={cn(
              "relative mx-auto overflow-hidden rounded-lg bg-black",
              ratio === "16:9"
                ? "aspect-video w-full"
                : "aspect-[9/16] h-[78vh] max-h-[78vh] max-w-full",
            )}
          >
            {/* Cloudflare Stream player. NOTE: granular video_progress
                (25/50/75/100%) tracking used to come from the <video>
                timeupdate; with the Stream iframe it would need the Cloudflare
                Stream Player SDK (postMessage bridge), which we don't load here
                to keep the strict CSP (no extra script-src) and avoid a new
                dependency. `video_play` is tracked on open + on each switch. */}
            {id ? (
              <iframe
                key={index}
                src={streamIframeUrl(id, {
                  autoplay: true,
                  poster: posterUrl(current.src.replace(/\.mp4$/i, ".jpg")),
                })}
                title={title}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <Image
                src={current.src.replace(/\.mp4$/i, ".jpg")}
                alt={title}
                fill
                className="object-contain"
              />
            )}

            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous video"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-canvas/70 p-2 text-ink backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-canvas/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                >
                  <ChevronLeft size={22} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label="Next video"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-canvas/70 p-2 text-ink backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-canvas/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                >
                  <ChevronRight size={22} strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>

          {total > 1 && (
            <div
              className="mt-4 text-center font-mono text-sm tracking-widest text-ink-muted"
              aria-live="polite"
            >
              {index + 1} / {total}
            </div>
          )}
        </div>
      )}
    </DialogShell>
  );
}
