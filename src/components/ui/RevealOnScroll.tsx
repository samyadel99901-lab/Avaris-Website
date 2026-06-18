"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/animations";

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before this element starts animating. */
  delay?: number;
  /** Override the default fade-up variant. */
  variants?: Variants;
  /** IntersectionObserver rootMargin (Framer Motion's `viewport.margin`). */
  margin?: string;
};

/**
 * Wraps children with a one-shot fade-up animation triggered when
 * the element enters the viewport. Reduced motion is honored at
 * the framework level via globals.css base layer.
 */
export function RevealOnScroll({
  children,
  className,
  delay = 0,
  variants = fadeUp,
  margin = "-10%",
}: RevealOnScrollProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
