"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronDown, FileText } from "lucide-react";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { ContactDialog } from "@/components/forms/ContactDialog";
import { ProjectFormDialog } from "@/components/forms/ProjectFormDialog";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { posterUrl, streamId, streamIframeUrl } from "@/lib/stream-videos";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

const HERO_VIDEO = "/video-production/website cover.mp4";
const heroStreamId = streamId(HERO_VIDEO);

/**
 * §6.1 — Full-viewport hero.
 *
 * Cinematic background video (muted, looping, autoplay). `hero.jpg`
 * stays as the poster so the layout never goes blank during the first
 * frames of loading, and as the still rendered when
 * `prefers-reduced-motion: reduce` is on.
 *
 * Logo above the AVARIS wordmark, subtitle below, then two CTA buttons
 * ("Get more details" + "Submit a new project") that open the same
 * dialogs the FinalCTA used to, and a bouncing chevron at the bottom.
 */
export function Hero() {
  const reducedMotion = useReducedMotion();
  const [contactOpen, setContactOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  // Render the still on SSR + the first client render, then mount the Stream
  // iframe only after hydration. Switching element type (img ↔ iframe) on the
  // first render — as useReducedMotion() resolving true post-hydration would —
  // trips a hydration mismatch. useSyncExternalStore gives a lint-safe mounted
  // flag (no setState-in-effect).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <Section
      flush
      as="header"
      className="group relative min-h-screen overflow-hidden bg-canvas"
    >
      {/* Before hydration, on reduced-motion, or with no Stream id → static
          still. Otherwise the Cloudflare Stream background reel. */}
      {!mounted || reducedMotion || !heroStreamId ? (
        <Image
          src="/hero.jpg"
          alt="AVARIS Media Production studio"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <iframe
          src={streamIframeUrl(heroStreamId, {
            autoplay: true,
            muted: true,
            loop: true,
            controls: false,
            preload: "auto",
            poster: posterUrl("/hero.jpg"),
          })}
          title="AVARIS background reel"
          aria-hidden
          tabIndex={-1}
          allow="autoplay; encrypted-media"
          // iframes can't object-cover: size the 16:9 frame larger than the
          // viewport and center it; the Section's overflow-hidden crops it to
          // a full-bleed cover, like the old <video object-cover>.
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-screen w-screen min-w-[177.78vh] -translate-x-1/2 -translate-y-1/2 border-0"
        />
      )}

      {/* Bottom-up dark gradient — keeps the headline + footer
          readable. Lightens on hover so the video reads more vividly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-canvas via-canvas/40 to-transparent transition-all duration-500 group-hover:from-canvas/60 group-hover:via-canvas/10"
      />

      <Container className="relative z-20 flex min-h-screen flex-col items-center justify-center text-center">
        {/* Logo — sits ABOVE the wordmark */}
        <motion.div
          className="mb-6 sm:mb-8 lg:mb-12"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: cinematicEase, delay: 0.2 }}
        >
          <Image
            src="/logo.png"
            alt="AVARIS Logo"
            width={100}
            height={100}
            priority
            sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 100px"
            className="h-16 w-16 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
          />
        </motion.div>

        {/* AVARIS display */}
        <motion.h1
          className="font-display uppercase tracking-display leading-display text-[clamp(4rem,18vw,12rem)]"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: cinematicEase, delay: 0.4 }}
        >
          AVARIS
        </motion.h1>

        <motion.p
          className="mt-2 font-body uppercase tracking-[0.4em] text-xs sm:text-sm text-ink"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: cinematicEase, delay: 0.7 }}
        >
          Media Production
        </motion.p>

        {/* CTA buttons — same dialogs as FinalCTA, but tuned for the
            video background. Glass surfaces + stronger borders/shadows
            so they read clearly no matter what frame the cover reel
            is on. */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: cinematicEase, delay: 1 }}
        >
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            data-track="cta_click"
            data-track-label="Get more details"
            data-track-location="hero"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-paper px-8 py-4 font-body text-base font-medium text-ink-inverse shadow-2xl shadow-black/50 ring-1 ring-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            Get more details
            <ArrowUpRight
              size={18}
              strokeWidth={1.75}
              className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
          <button
            type="button"
            onClick={() => setProjectOpen(true)}
            data-track="cta_click"
            data-track-label="Submit a new project"
            data-track-location="hero"
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-white/50 bg-black/30 px-8 py-4 font-body text-base font-medium text-white shadow-2xl shadow-black/50 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:border-white/80 hover:bg-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            <FileText size={18} strokeWidth={1.75} />
            Submit a new project
          </button>
        </motion.div>

        {/* Bouncing chevron */}
        <motion.div
          className="absolute bottom-8 text-ink-faint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 1.2 },
            y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          }}
          aria-hidden
        >
          <ChevronDown size={28} strokeWidth={1.5} />
        </motion.div>
      </Container>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} />
    </Section>
  );
}
