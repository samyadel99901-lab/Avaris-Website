"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

/**
 * Files on disk: insight-1.png, insight-2.png, insight-3.jpg, insight-4.jpg
 * (the spec referenced `content-grid.png` for the 4th — mapped to the
 * existing `insight-4.jpg` instead).
 */
const INSIGHTS = [
  { src: "/insights/insight-1.png", label: "Top Reel" },
  { src: "/insights/insight-2.png", label: "Property Launch" },
  { src: "/insights/insight-3.jpg", label: "Brand Campaign" },
  { src: "/insights/insight-4.jpg", label: "Top Content" },
];

const AUTO_ADVANCE_MS = 5000;

export function OrganicReach() {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  // Separate hover / focus pauses so leaving the mouse doesn't resume while
  // keyboard focus is still inside the carousel.
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const paused = hoverPaused || focusPaused;
  const [progressKey, setProgressKey] = useState(0);

  // Auto-advance every 5s, pause on hover/focus, respect reduced motion.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setTimeout(() => {
      setActiveIndex((i) => (i + 1) % INSIGHTS.length);
      setProgressKey((k) => k + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [activeIndex, paused, reducedMotion]);

  const handleSelect = (idx: number) => {
    setActiveIndex(idx);
    setProgressKey((k) => k + 1);
  };

  const active = INSIGHTS[activeIndex];

  // Visible thumbnails — every insight except the one currently in the main
  // viewer. We track `originalIdx` so click handlers map back to INSIGHTS.
  const visibleThumbs = INSIGHTS.map((insight, originalIdx) => ({
    insight,
    originalIdx,
  })).filter((t) => t.originalIdx !== activeIndex);

  return (
    <Section id="organic-reach" flush className="py-20 lg:py-24">
      <Container>
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Organic reach insights"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onFocus={() => setFocusPaused(true)}
          onBlur={() => setFocusPaused(false)}
          className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8"
        >
          {/* Screen-reader announcement of the current insight */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`Insight ${activeIndex + 1} of ${INSIGHTS.length}: ${active.label}`}
          </div>

          {/* LEFT — title + thumbnails */}
          <div className="md:col-span-6 lg:col-span-5">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.7, ease: cinematicEase }}
              className="font-display text-5xl font-bold capitalize tracking-display leading-display text-white lg:text-6xl"
            >
              Organic Reach
            </motion.h2>

            <div className="mt-20 flex flex-row justify-center gap-4 md:justify-start">
              {visibleThumbs.map(({ insight, originalIdx }, visibleIdx) => (
                <motion.button
                  key={insight.src}
                  type="button"
                  onClick={() => handleSelect(originalIdx)}
                  aria-label={`Show ${insight.label}`}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + visibleIdx * 0.05,
                    ease: cinematicEase,
                  }}
                  className="group relative aspect-[9/16] w-[70px] overflow-hidden rounded-xl border border-white/10 transition-all duration-300 hover:scale-[1.03] hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30 md:w-[80px] lg:w-[100px]"
                >
                  <Image
                    src={insight.src}
                    alt={insight.label}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* RIGHT — main viewer */}
          <div className="flex flex-col items-center justify-center md:col-span-6 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 0.7,
                delay: 0.3,
                ease: cinematicEase,
              }}
              className="relative mx-auto aspect-[9/16] w-full max-w-[310px] overflow-hidden rounded-[28px] shadow-2xl shadow-black/50 md:max-w-[350px]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: cinematicEase }}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.src}
                    alt={`${active.label} — Instagram insight`}
                    fill
                    sizes="(max-width: 768px) 310px, 350px"
                    className="object-contain"
                    priority={activeIndex === 0}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Auto-advance progress bar */}
            <div className="mt-3 h-px w-full max-w-[310px] overflow-hidden bg-white/20 md:max-w-[350px]">
              <motion.div
                key={progressKey}
                initial={{ width: "0%" }}
                animate={{
                  width: paused || reducedMotion ? "0%" : "100%",
                }}
                transition={{
                  duration: paused || reducedMotion
                    ? 0
                    : AUTO_ADVANCE_MS / 1000,
                  ease: "linear",
                }}
                className="h-full bg-gradient-accent"
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
