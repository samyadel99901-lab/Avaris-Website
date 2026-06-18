import type { Variants } from "framer-motion";

/**
 * Shared Framer Motion variants. Use with `motion.div` (or any motion element):
 *
 *   <motion.div initial="hidden" whileInView="show" variants={fadeUp} />
 *
 * The cinematic easing curve [0.16, 1, 0.3, 1] is "expo-out" — slow-finish,
 * matches the brief's "slow reveal" feel.
 */

const cinematicEase = [0.16, 1, 0.3, 1] as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: cinematicEase } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: cinematicEase },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: cinematicEase },
  },
};

/** Parent variant — children with their own variants stagger in sequence. */
export const staggerChildren: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

/** Slightly slower stagger tuned for card grids (Video Production, Process). */
export const staggerCards: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};
