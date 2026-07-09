"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { track } from "@/lib/tracking/tracker";
import { cn } from "@/lib/utils";

type VideoPosterCardProps = {
  number: string;
  title: string;
  description: string;
  /** Local video path — used for the local `.jpg` poster + play tracking.
   *  Actual playback happens in the lightbox (Cloudflare Stream). */
  videoSrc: string;
  /** Tailwind aspect class (e.g. `aspect-video`, `aspect-[9/16]`). */
  aspectClassName?: string;
  /** Shows the "2 versions" hint badge on hover. */
  hasSecond?: boolean;
  /** Opens the lightbox. Called after firing the `video_play` event. */
  onActivate: () => void;
};

/**
 * Still poster card for the Video Editing section. Shows the LOCAL `.jpg`
 * thumbnail + caption; clicking (or Enter/Space) opens the Stream lightbox.
 * No inline playback — that lives in the lightbox now.
 *
 * Fires the `video_play` analytics event on activation (the same event the
 * old inline player fired on play). Granular `video_progress` milestones are
 * handled by the lightbox — see VideoLightbox.
 */
export function VideoPosterCard({
  number,
  title,
  description,
  videoSrc,
  aspectClassName = "aspect-[3/4]",
  hasSecond = false,
  onActivate,
}: VideoPosterCardProps) {
  const thumbnailSrc = videoSrc.replace(/\.mp4$/i, ".jpg");
  const [thumbError, setThumbError] = useState(false);

  const activate = () => {
    track({ type: "video_play", videoSrc, videoLabel: title });
    onActivate();
  };

  return (
    <div
      onClick={activate}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-card-lg bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30",
        aspectClassName,
      )}
    >
      {/* Thumbnail — local .jpg, with a placeholder fallback if missing. */}
      {thumbError ? (
        <div className="absolute inset-0">
          <MediaPlaceholder
            label={title}
            tone="dark"
            className="h-full rounded-none border-0"
          />
        </div>
      ) : (
        <Image
          src={thumbnailSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={() => setThumbError(true)}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      )}

      {/* "Has a second version" hint — centered, solid, fades in on hover. */}
      {hasSecond && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-ink-inverse shadow-xl shadow-black/40">
            2 versions
            <ChevronRight size={16} strokeWidth={2.5} />
          </span>
        </div>
      )}

      {/* Dark gradient — keeps caption legible */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 bg-gradient-to-t from-canvas via-canvas/40 to-transparent"
      />

      {/* Caption */}
      {(number || title || description) && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
          {number ? (
            <span className="font-body text-xs tracking-[0.3em] text-ink/70">
              {number}
            </span>
          ) : (
            <span aria-hidden />
          )}
          {(title || description) && (
            <div>
              {title && (
                <h3 className="mb-2 font-display text-2xl uppercase tracking-wide text-ink">
                  {title}
                </h3>
              )}
              {description && (
                <p className="line-clamp-2 font-body text-sm leading-relaxed text-ink/80">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
