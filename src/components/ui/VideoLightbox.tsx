"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { DialogShell } from "@/components/forms/DialogShell";
import { videoUrl } from "@/lib/media";
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
 * sized to the clip's aspect ratio (horizontal stays 16:9, vertical 9:16) and
 * the <video> uses object-contain, so nothing is ever stretched.
 *
 * Videos load from R2 via videoUrl(); the local .jpg is used as the poster.
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
  const go = (dir: number) => setIndex((i) => (i + dir + total) % total);

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
            <video
              key={index}
              src={videoUrl(current.src)}
              poster={current.src.replace(/\.mp4$/i, ".jpg")}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            />

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
