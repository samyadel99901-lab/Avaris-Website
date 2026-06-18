"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp, staggerChildren } from "@/lib/animations";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
  /** Heading level — pick one based on document outline (default h2). */
  as?: "h1" | "h2" | "h3";
};

/**
 * Bold, condensed Anton title with an optional Inter italic subtitle.
 * Reveals on scroll: parent staggers, title lifts then subtitle.
 */
export function SectionTitle({
  title,
  subtitle,
  className,
  align = "left",
  as: Heading = "h2",
}: SectionTitleProps) {
  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-15%" }}
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <motion.div variants={fadeUp}>
        <Heading className="font-display uppercase text-5xl tracking-display leading-display sm:text-6xl md:text-7xl">
          {title}
        </Heading>
      </motion.div>
      {subtitle && (
        <motion.p
          variants={fadeUp}
          className="font-body italic text-lg text-ink-muted"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
