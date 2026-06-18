"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { fadeUp, staggerChildren } from "@/lib/animations";
import { cn } from "@/lib/utils";

const STATS = [
  {
    value: 9000,
    suffix: "+",
    label: "Videos Delivered",
    tone: "bg-zinc-400",
  },
  {
    value: 500,
    suffix: "+",
    label: "Clients Served",
    tone: "bg-zinc-300",
  },
  {
    value: 5,
    suffix: "+",
    label: "Years in the US Market",
    tone: "bg-zinc-200",
  },
] as const;

/** Client logos — files in `public/clients/`. */
const CLIENTS = [
  { src: "/clients/hilton.png", alt: "Hilton logo" },
  { src: "/clients/raywhite.jpg", alt: "RayWhite logo" },
  { src: "/clients/H.png", alt: "Client logo" },
  { src: "/clients/hyatt.png", alt: "Hyatt logo" },
  { src: "/clients/thompson.png", alt: "Thompson logo" },
  { src: "/clients/golden-globes.png", alt: "Golden Globes logo" },
  { src: "/clients/ritz-carlton.png", alt: "The Ritz-Carlton logo" },
];

/**
 * §6.3 — Three light-shaded stat cards (gradient dark→light, matching
 * Slide 4) with `AnimatedNumber` count-ups, plus a white logos bar
 * underneath using `MediaPlaceholder` until real logos arrive.
 */
export function TheProof() {
  return (
    <Section id="the-proof">
      <Container>
        <SectionTitle title="By the Numbers" subtitle="Where We Started" />

        {/* Stats row */}
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className={cn(
                "flex min-h-[220px] flex-col items-center justify-center rounded-card-lg p-10 text-center text-ink-inverse",
                stat.tone,
              )}
            >
              <p className="font-display text-7xl tracking-display leading-none sm:text-8xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-4 font-display text-base uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Client logos — white bar matching the original design */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-12 grid grid-cols-3 items-center gap-x-4 gap-y-6 rounded-2xl bg-paper px-6 py-6 shadow-lg shadow-black/20 sm:px-12 sm:py-8 md:flex md:justify-between md:gap-6"
        >
          {CLIENTS.map((client, idx) => {
            const isLast = idx === CLIENTS.length - 1;
            return (
              <Image
                key={client.src}
                src={client.src}
                alt={client.alt}
                width={isLast ? 200 : 120}
                height={isLast ? 100 : 60}
                className={cn(
                  "w-auto cursor-default object-contain opacity-90 transition-all duration-300 hover:scale-105 hover:opacity-100",
                  // Last logo is the hero of the lineup — render it noticeably
                  // larger so it reads as the marquee partner, and center it
                  // on its own row at mobile.
                  isLast
                    ? "col-span-3 h-16 justify-self-center sm:h-20 md:col-span-1 md:h-24"
                    : "h-10 sm:h-12",
                )}
              />
            );
          })}
        </motion.div>
      </Container>
    </Section>
  );
}
