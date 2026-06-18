"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { cn } from "@/lib/utils";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

export type SlideImage = {
  /** When undefined or load fails, MediaPlaceholder renders instead. */
  src?: string;
  alt: string;
  placeholderLabel: string;
};

export type Slide = {
  category: string;
  features: string[];
  tagline: string;
  images: [SlideImage, SlideImage];
};

type SectionSliderProps = {
  title: string;
  slides: Slide[];
  /** Auto-advance interval. Default 8000ms. Set to 0 to disable. */
  autoAdvanceMs?: number;
};

const imageVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: cinematicEase },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: { duration: 0.6, ease: cinematicEase },
  }),
};

const textVariants: Variants = {
  enter: { opacity: 0 },
  center: {
    opacity: 1,
    transition: { delay: 0.2, duration: 0.4, ease: cinematicEase },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Reusable carousel for the Photoshoot + VFX deep-dive sections.
 *
 * Layout (lg+): title row → info row (category + features + tagline)
 * → two images side-by-side → nav row. Everything sized so the full
 * stack fits in `100vh` — the image row flexes to consume whatever
 * height is left after the surrounding rows take their natural size.
 *
 * On mobile (<lg) the constraint is dropped and the slider scrolls
 * naturally inside the page.
 */
export function SectionSlider({
  title,
  slides,
  autoAdvanceMs = 8000,
}: SectionSliderProps) {
  const reducedMotion = useReducedMotion();
  const [[current, direction], setSlide] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);

  const total = slides.length;
  const counter = `${pad2(current + 1)} / ${pad2(total)}`;

  const next = useCallback(() => {
    setSlide(([c]) => [(c + 1) % total, 1]);
  }, [total]);
  const prev = useCallback(() => {
    setSlide(([c]) => [(c - 1 + total) % total, -1]);
  }, [total]);
  const goTo = useCallback((idx: number) => {
    setSlide(([c]) => [idx, idx > c ? 1 : -1]);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || autoAdvanceMs <= 0) return;
    const id = window.setInterval(next, autoAdvanceMs);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, autoAdvanceMs, next]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  const slide = slides[current];

  return (
    // lg:h-screen + flex-col keeps the whole slider locked to viewport
    // height on desktop. On mobile we let it grow.
    <div className="flex flex-col lg:h-screen lg:max-h-screen lg:py-8">
      {/* Title — auto height */}
      <div className="text-center">
        <h2 className="font-display text-4xl uppercase tracking-display leading-display sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </div>

      {/* Slide info row — category + features + tagline. Auto height. */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={onKeyDown}
        className="mt-6 flex min-h-0 flex-1 flex-col rounded-card-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/30"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`info-${current}`}
            variants={textVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center"
          >
            <h3 className="font-display text-xl uppercase tracking-wide leading-tight sm:text-2xl">
              {slide.category}
            </h3>
            <div className="mt-3 h-px w-[60px] bg-white/30" aria-hidden />
            <p className="mt-3 font-body text-sm text-ink-muted sm:text-base">
              {slide.features.join(" · ")}
            </p>
            <p className="mt-3 bg-gradient-accent bg-clip-text font-body text-base italic text-transparent sm:text-lg">
              {slide.tagline}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Images row — fills remaining height on lg. Two side-by-side.
            min-h-0 lets the flex child actually shrink when the viewport
            is tight; without it the image row overflows the parent. */}
        <div className="relative mt-6 min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={`imgs-${current}`}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid h-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            >
              {slide.images.map((img, i) => (
                <SlideImageBox
                  key={`${current}-${i}`}
                  image={img}
                  priority={current === 0 && i === 0}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav — auto height */}
      <div className="mt-4 flex items-center justify-center gap-6 sm:gap-8">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={prev}
          className="rounded-full border border-hairline-strong p-2 text-ink transition-colors hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>

        <div
          className="min-w-20 text-center font-mono text-base tracking-widest text-ink"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={current}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="inline-block"
            >
              {counter}
            </motion.span>
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Next slide"
          onClick={next}
          className="rounded-full border border-hairline-strong p-2 text-ink transition-colors hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
        >
          <ChevronRight size={24} strokeWidth={1.5} />
        </button>

        <div className="ml-2 flex gap-1 sm:ml-4">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
              onClick={() => goTo(i)}
              className="grid h-11 w-11 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-2 w-2 rounded-full border border-ink/40 transition-colors",
                  i === current ? "border-ink bg-ink" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type SlideImageBoxProps = { image: SlideImage; priority: boolean };

function SlideImageBox({ image, priority }: SlideImageBoxProps) {
  const [error, setError] = useState(false);
  const showPlaceholder = !image.src || error;

  // h-full so the box stretches to fill its flex slot. object-cover
  // means images may crop slightly when the slot's aspect doesn't match
  // 3:2, but that's preferable to letterboxing on these brand photos.
  // On mobile we fall back to a fixed aspect so they don't collapse to
  // 0px when the parent is auto-height.
  return (
    <div className="group relative aspect-[3/2] w-full overflow-hidden rounded-xl sm:aspect-auto sm:h-full">
      {showPlaceholder ? (
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]">
          <MediaPlaceholder
            label={image.placeholderLabel}
            tone="dark"
            className="h-full rounded-none border-0"
          />
        </div>
      ) : (
        <Image
          src={image.src!}
          alt={image.alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, 45vw"
          onError={() => setError(true)}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      )}
    </div>
  );
}
