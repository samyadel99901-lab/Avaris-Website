"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { HybridVideoCard } from "@/components/ui/HybridVideoCard";
import { Section } from "@/components/ui/Section";
import { fadeUp, staggerChildren } from "@/lib/animations";

const TAGS = [
  "Architectural visualization",
  "Product CGI",
  "Virtual staging",
  "Motion graphics",
  "VFX",
];

// Source videos are mixed orientation — architectural-2 is landscape
// (3840×2160 = 16:9), architectural-1 is portrait (2160×3840 = 9:16).
//
// Editorial row: on sm+ the two wrappers share the row width via flex-grow
// values proportional to each clip's aspect ratio (16/9 ≈ 1.78 for the
// landscape, 9/16 ≈ 0.5625 for the portrait). Because width is handed out
// in proportion to aspect ratio, both cards resolve to the SAME height with
// zero crop — the landscape lands wide on the left, the portrait a slim
// column on the right. On mobile they stack, the portrait capped so it
// doesn't tower.
const VIDEOS = [
  {
    videoSrc: "/vfx/architectural-2.mp4",
    title: "Product CGI",
    wrapperClass: "w-full sm:w-auto sm:basis-0 sm:grow-[1.78]",
    aspectClass: "aspect-video w-full",
  },
  {
    videoSrc: "/vfx/architectural-1.mp4",
    title: "Architectural visualization",
    wrapperClass:
      "w-[65%] max-w-[17rem] sm:w-auto sm:max-w-none sm:basis-0 sm:grow-[0.5625]",
    aspectClass: "aspect-[9/16] w-full",
  },
];

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-hairline-strong px-3 py-1 font-body text-xs uppercase tracking-wider text-ink-muted">
      {children}
    </span>
  );
}

/**
 * §6.7 — VFX & 3D Animation.
 *
 * Layout: title centered at top, blurb + tag chips below, then an
 * editorial two-up of the mixed-orientation clips — a wide landscape
 * (16:9) and a slim portrait (9:16) sharing one row at matched height,
 * each at its true proportions with no crop (see VIDEOS for the sizing
 * math). They stack on mobile.
 */
export function VFX3D() {
  return (
    <Section id="vfx-3d" className="py-12 lg:py-20">
      <Container className="flex flex-col">
        {/* Title row */}
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          className="text-center"
        >
          <motion.p
            variants={fadeUp}
            className="font-body text-sm tracking-[0.3em] text-ink-faint"
          >
            02
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-2 font-display text-4xl uppercase tracking-display leading-display sm:text-5xl lg:text-6xl"
          >
            VFX & 3D Animation
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-2xl font-body text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            We transform raw renders and properties into photorealistic,
            cinematic productions.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            {TAGS.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </motion.div>
        </motion.div>

        {/* Videos row — editorial split. Stacks on mobile; on sm+ the
            wrappers grow in proportion to their clip aspect ratios so the
            landscape (wide) and portrait (slim) end up the same height. */}
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center"
        >
          {VIDEOS.map((v) => (
            <motion.div
              key={v.videoSrc}
              variants={fadeUp}
              className={v.wrapperClass}
            >
              <HybridVideoCard
                number=""
                title={v.title}
                description=""
                videoSrc={v.videoSrc}
                enableAudio
                mobilePlayMode="inview"
                aspectClassName={v.aspectClass}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
