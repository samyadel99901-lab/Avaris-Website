"use client";

import { useReducedMotion } from "framer-motion";
import { ChevronRight, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { videoUrl } from "@/lib/media";
import { track } from "@/lib/tracking/tracker";
import { cn } from "@/lib/utils";

const PROGRESS_MILESTONES = [25, 50, 75, 100] as const;

type HybridVideoCardProps = {
  title: string;
  description: string;
  number: string;
  /** Path to the video file (relative to /public). Thumbnail is `videoSrc.replace('.mp4','.jpg')`. */
  videoSrc: string;
  className?: string;
  /** When true, hover/focus plays with sound (subject to the browser's
   *  autoplay policy) and a mute toggle is shown. */
  enableAudio?: boolean;
  /** How the video starts on touch devices. Currently only 'inview' is wired. */
  mobilePlayMode?: "inview" | "tap";
  /** Tailwind aspect class for the card. Default `aspect-[3/4]` (portrait poster).
   *  Override with `aspect-video` for landscape edits, `aspect-[9/16]` for reels. */
  aspectClassName?: string;
  /** When provided, the card becomes clickable/keyboard-activatable (e.g. to
   *  open a lightbox). The mute toggle stops propagation so it won't fire this. */
  onActivate?: () => void;
  /** When true, shows a "2 versions" hint badge on hover. */
  hasSecond?: boolean;
};

/**
 * Card that shows a still thumbnail at rest and plays a muted video on
 * hover (desktop) or when scrolled into the viewport (touch devices).
 *
 * `enableAudio`: hover/focus plays with sound (browsers permitting — unmuted
 * playback needs a prior user interaction on the page) and a Volume2/VolumeX
 * toggle is shown for manual control. Leaving the card re-mutes.
 *
 * Honors `prefers-reduced-motion` by never autoplaying.
 */
export function HybridVideoCard({
  title,
  description,
  number,
  videoSrc,
  className,
  enableAudio = false,
  mobilePlayMode = "inview",
  aspectClassName = "aspect-[3/4]",
  onActivate,
  hasSecond = false,
}: HybridVideoCardProps) {
  const reducedMotion = useReducedMotion();
  const thumbnailSrc = videoSrc.replace(/\.mp4$/i, ".jpg");

  const cardRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const firedMilestones = useRef<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [thumbError, setThumbError] = useState(false);

  // Apply mute state to the underlying <video> element whenever it changes.
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = isMuted;
  }, [isMuted]);

  // Track 25/50/75/100% milestones once per component lifetime.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => {
      if (!v.duration || Number.isNaN(v.duration)) return;
      const pct = (v.currentTime / v.duration) * 100;
      for (const m of PROGRESS_MILESTONES) {
        if (pct >= m && !firedMilestones.current.has(m)) {
          firedMilestones.current.add(m);
          track({ type: "video_progress", videoSrc, percent: m });
        }
      }
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [videoSrc]);

  const trackPlay = useCallback(() => {
    track({ type: "video_play", videoSrc, videoLabel: title });
  }, [videoSrc, title]);

  // Touch / scroll-based play: when the card is at least 60% visible,
  // auto-play (always muted — browsers block unmuted autoplay). User
  // taps the volume button to enable sound.
  useEffect(() => {
    if (reducedMotion || mobilePlayMode !== "inview") return;
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        const isCoarse = window.matchMedia("(pointer: coarse)").matches;
        if (!isCoarse) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          v.play()
            .then(() => {
              setIsPlaying(true);
              trackPlay();
            })
            .catch(() => {});
        } else {
          v.pause();
          v.currentTime = 0;
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, mobilePlayMode, trackPlay]);

  const handleEnter = useCallback(() => {
    if (reducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    // Hover/focus plays with sound when the card opts into audio. Set the DOM
    // property directly so this play() picks it up immediately (the state is
    // just for the toggle UI).
    if (enableAudio) {
      v.muted = false;
      setIsMuted(false);
    }
    v.play()
      .then(() => {
        setIsPlaying(true);
        trackPlay();
      })
      .catch(() => {
        // Browsers block unmuted autoplay until the user has interacted with
        // the page at least once. Fall back to muted playback so the video
        // still runs; the user can click the toggle for sound.
        if (enableAudio && !v.muted) {
          v.muted = true;
          setIsMuted(true);
          v.play()
            .then(() => {
              setIsPlaying(true);
              trackPlay();
            })
            .catch(() => {});
        }
      });
  }, [reducedMotion, enableAudio, trackPlay]);

  const handleLeave = useCallback(() => {
    if (reducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setIsPlaying(false);
    setIsMuted(true);
  }, [reducedMotion]);

  const toggleMute = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMuted((m) => !m);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onClick={onActivate}
      onKeyDown={
        onActivate
          ? (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-card-lg bg-elevated",
        aspectClassName,
        className,
      )}
    >
      {/* Thumbnail — visible at rest. Falls back to a placeholder if the
          .jpg is missing (safety net). */}
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
          className={cn(
            "object-cover transition-opacity duration-300",
            isPlaying ? "opacity-0" : "opacity-100",
          )}
        />
      )}

      {/* Video — fades in on hover / scroll */}
      <video
        ref={videoRef}
        src={videoUrl(videoSrc)}
        muted
        loop
        playsInline
        preload="metadata"
        poster={thumbnailSrc}
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isPlaying ? "opacity-100" : "opacity-0",
        )}
      />

      {/* "Has a second version" hint — centered, solid for legibility,
          fades in on hover. */}
      {hasSecond && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 font-body text-sm font-semibold uppercase tracking-wide text-ink-inverse shadow-xl shadow-black/40">
            2 versions
            <ChevronRight size={16} strokeWidth={2.5} />
          </span>
        </div>
      )}

      {/* Audio toggle — top-right, only when audio is enabled */}
      {enableAudio && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          title={isMuted ? "Play with sound" : "Mute"}
          className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-white/20 bg-canvas/80 px-3 py-2 text-ink shadow-lg shadow-black/30 backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-canvas/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span className="text-xs font-medium uppercase tracking-wider">
            {isMuted ? "Sound" : "Mute"}
          </span>
        </button>
      )}

      {/* Dark gradient — keeps caption legible */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 bg-gradient-to-t from-canvas via-canvas/40 to-transparent"
      />

      {/* Caption — only renders when number/title/description provided */}
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
