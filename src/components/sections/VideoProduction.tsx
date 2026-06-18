"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { HybridVideoCard } from "@/components/ui/HybridVideoCard";
import { Section } from "@/components/ui/Section";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { fadeUp, staggerCards } from "@/lib/animations";

/**
 * §6.6 — Video Editing deep-dive.
 *
 * The videos ship in two orientations:
 *   - Landscape 16:9: Cinematic, Lifestyle (long-form pieces)
 *   - Portrait 9:16:  Trendy, Realtor, Branding (short-form reels)
 *
 * Forcing one aspect across all five mangles half of them. The layout
 * below honors both: a "Long-form" row of two landscape cards on top,
 * a "Short-form" row of three portrait cards underneath. On mobile
 * everything stacks single-column at its natural aspect.
 */

const LONG_FORM = [
  {
    num: "01",
    title: "Cinematic Edits",
    body: "Story-driven pacing and dramatic grades that make every frame iconic.",
    videoSrc: "/video-production/cinematic.mp4",
  },
  {
    num: "02",
    title: "Lifestyle Edits",
    body: "Human-centric cuts that sell the feeling, not just the space.",
    videoSrc: "/video-production/lifestyle.mp4",
  },
] as const;

const SHORT_FORM = [
  {
    num: "03",
    title: "Trendy Edits",
    body: "High-retention short form built for maximum reach and engagement.",
    videoSrc: "/video-production/trendy.mp4",
  },
  {
    num: "04",
    title: "Realtor Videos",
    body: "Agent intro reels and team videos that build authority and identity.",
    videoSrc: "/video-production/realtor.mp4",
  },
  {
    num: "05",
    title: "Branding Videos",
    body: "Walkthroughs and listings transformed into premium visual experiences.",
    videoSrc: "/video-production/branding.mp4",
  },
] as const;

export function VideoProduction() {
  return (
    <Section id="video-editing">
      <Container>
        <SectionTitle title="Video Editing" subtitle="Our craft, broken down" />

        {/* Row 1 — landscape long-form */}
        <motion.div
          variants={staggerCards}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          className="mt-16"
        >
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="font-body text-xs uppercase tracking-[0.3em] text-ink-faint">
              Long-form
            </h3>
            <span className="font-body text-xs text-ink-faint">16:9 · cinema cut</span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {LONG_FORM.map((sub) => (
              <motion.div key={sub.num} variants={fadeUp}>
                <HybridVideoCard
                  number={sub.num}
                  title={sub.title}
                  description={sub.body}
                  videoSrc={sub.videoSrc}
                  aspectClassName="aspect-video"
                  enableAudio
                  mobilePlayMode="inview"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Row 2 — portrait reels */}
        <motion.div
          variants={staggerCards}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          className="mt-12"
        >
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="font-body text-xs uppercase tracking-[0.3em] text-ink-faint">
              Short-form · Reels
            </h3>
            <span className="font-body text-xs text-ink-faint">9:16 · vertical</span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {SHORT_FORM.map((sub) => (
              <motion.div key={sub.num} variants={fadeUp}>
                <HybridVideoCard
                  number={sub.num}
                  title={sub.title}
                  description={sub.body}
                  videoSrc={sub.videoSrc}
                  aspectClassName="aspect-[9/16]"
                  enableAudio
                  mobilePlayMode="inview"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
