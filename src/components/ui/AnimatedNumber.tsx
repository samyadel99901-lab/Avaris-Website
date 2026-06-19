"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

type AnimatedNumberProps = {
  value: number;
  /** Animation duration in seconds. Default ~1.3s for snappy count-ups. */
  duration?: number;
  /** Custom formatter — defaults to en-US comma separation. */
  format?: (n: number) => string;
  /** Suffix appended after the number (e.g. "+", "%"). */
  suffix?: string;
  className?: string;
};

const defaultFormat = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));

/**
 * Counts up from 0 to `value` once the element enters the viewport.
 * Honors prefers-reduced-motion by skipping straight to the final value.
 *
 * Used for the "9,000+ Videos Delivered" stat cards in §6.3.
 */
export function AnimatedNumber({
  value,
  duration = 1.3,
  format = defaultFormat,
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => format(latest));

  useEffect(() => {
    // Reduced-motion (or it resolving to true after first paint): jump
    // straight to the final value instead of leaving a stuck "0".
    if (reducedMotion) {
      motionValue.set(value);
      return;
    }
    if (inView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: "easeOut",
      });
      return () => controls.stop();
    }
  }, [inView, reducedMotion, value, duration, motionValue]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
