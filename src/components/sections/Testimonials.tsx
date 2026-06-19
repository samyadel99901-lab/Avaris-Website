"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Star,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

type Platform = "Slack" | "Instagram";

type Testimonial = {
  name: string;
  subline: string;
  platform: Platform;
  avatarColor: string;
  review: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ketch Johnson",
    subline: "Slack DM Client",
    platform: "Slack",
    avatarColor: "bg-purple-700",
    review:
      "Guys it's freaking amazing. You did such a good job! Thank you so much. ❤❤❤ Absolutely! I am so beyond impressed. I truly can't thank you enough for being so incredible to work with!",
  },
  {
    name: "Hunter Weeks",
    subline: "@hunterweeks",
    platform: "Instagram",
    avatarColor: "bg-pink-600",
    review:
      "NAILED IT ❤ Love this. So good ❤ I just got you another client. Showed him and he may use your editor full time.",
  },
  {
    name: "Vadim Tsygipalo",
    subline: "Slack DM Client",
    platform: "Slack",
    avatarColor: "bg-blue-700",
    review:
      "You guys do a great job — coloring and quick turnaround are amazing. I applaud you. Yesss!! Love this version. Great job. Thank you for taking the feedback.",
  },
  {
    name: "Frank Garnica",
    subline: "@frank.garnica",
    platform: "Instagram",
    avatarColor: "bg-orange-600",
    review:
      "Amazing thank you! ❤ Next time I will know for the client on delivery. Thank you! Your team is amazing. — After receiving his real estate highlight reel",
  },
  {
    name: "ArmstrongProd",
    subline: "@armstrongprod",
    platform: "Instagram",
    avatarColor: "bg-emerald-700",
    review:
      "I just submitted the feedback form, and I also wanted to personally say thank you. I came across you guys and everything started to shift. You blessed me with Class A editing — that moment meant more than you probably realized. I really appreciate you all. Thank you again. ❤",
  },
];

const AUTO_ADVANCE_MS = 6000;

const getInitial = (name: string) => name.charAt(0).toUpperCase();

/** Modular offset so the loop wraps cleanly: cards at offset ±2 are
 * just out of frame (opacity 0) and slide in/out on transition. */
function modOffset(i: number, active: number, total: number) {
  let offset = i - active;
  const half = total / 2;
  if (offset > half) offset -= total;
  if (offset < -half) offset += total;
  return offset;
}

/**
 * §6.11 — What They Say. Five white cards in a peek carousel: one
 * center card at 100%, two side peeks at 0.4 opacity / 0.85 scale.
 * Auto-advances every 6s, pauses on hover, respects reduced motion.
 * The pink→purple top accent bar on each card is an approved
 * accent-gradient usage.
 */
export function Testimonials() {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  // Track hover and focus pauses separately — a single flag lets onMouseLeave
  // resume auto-advance while the keyboard focus is still inside.
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const paused = hoverPaused || focusPaused;

  const total = TESTIMONIALS.length;

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setTimeout(next, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [activeIndex, paused, reducedMotion, next]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  return (
    <Section id="testimonials">
      <Container>
        <SectionTitle title="What They Say" subtitle="Feedbacks" />

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Client testimonials"
          tabIndex={0}
          className="relative mt-16 rounded-card-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/30"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onFocus={() => setFocusPaused(true)}
          onBlur={() => setFocusPaused(false)}
          onKeyDown={onKeyDown}
        >
          {/* Screen-reader announcement of the current slide */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`Testimonial ${activeIndex + 1} of ${total}: ${TESTIMONIALS[activeIndex].name}`}
          </div>

          {/* Carousel viewport */}
          <div className="relative h-[440px] overflow-hidden sm:h-[400px]">
            {TESTIMONIALS.map((t, i) => {
              const offset = modOffset(i, activeIndex, total);
              const isActive = offset === 0;
              const isPeek = Math.abs(offset) === 1;
              return (
                <motion.article
                  key={t.name}
                  animate={{
                    x: `${offset * 80}%`,
                    scale: isActive ? 1 : 0.85,
                    opacity: isActive ? 1 : isPeek ? 0.4 : 0,
                  }}
                  transition={{ duration: 0.6, ease: cinematicEase }}
                  className={cn(
                    "absolute inset-y-0 left-1/2 w-[88%] max-w-[520px] -translate-x-1/2",
                    !isActive && "pointer-events-none",
                    isActive ? "z-10" : "z-0",
                  )}
                  aria-hidden={!isActive}
                >
                  <div className="relative h-full overflow-hidden rounded-card-lg bg-paper p-6 shadow-2xl shadow-black/40 sm:p-8">
                    {/* Top gradient accent bar */}
                    <div
                      className="absolute inset-x-0 top-0 h-1.5 bg-gradient-accent"
                      aria-hidden
                    />

                    {/* Header */}
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white",
                            t.avatarColor,
                          )}
                          aria-hidden
                        >
                          {getInitial(t.name)}
                        </div>
                        <div>
                          <p className="font-medium text-ink-inverse">
                            {t.name}
                          </p>
                          <p className="text-xs text-zinc-500">{t.subline}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600">
                        {t.platform === "Slack" ? (
                          <MessageSquare size={12} />
                        ) : (
                          <FaInstagram size={12} />
                        )}
                        {t.platform}
                      </span>
                    </div>

                    {/* Review */}
                    <p className="mt-6 font-body text-sm leading-relaxed text-ink-inverse sm:text-base">
                      {t.review}
                    </p>

                    {/* Footer — stars + verified */}
                    <div className="absolute inset-x-6 bottom-6 flex items-center justify-between sm:inset-x-8 sm:bottom-8">
                      <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                        {[0, 1, 2, 3, 4].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className="fill-gold text-gold"
                            aria-hidden
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gold">
                        Verified Client Review
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Arrow nav — at carousel edges */}
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={prev}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-hairline-strong bg-canvas/70 p-2 text-ink backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
          >
            <ChevronLeft size={28} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={next}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-hairline-strong bg-canvas/70 p-2 text-ink backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
          >
            <ChevronRight size={28} strokeWidth={1.5} />
          </button>
        </div>

        {/* Dots indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-label={`Go to testimonial ${i + 1}`}
              aria-current={i === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(i)}
              className="grid h-11 w-11 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-2 w-2 rounded-full border border-ink/40 transition-colors",
                  i === activeIndex ? "border-ink bg-ink" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </div>
      </Container>
    </Section>
  );
}
