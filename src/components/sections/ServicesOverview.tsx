"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { fadeUp, staggerChildren } from "@/lib/animations";

const SERVICES = [
  {
    number: "01",
    title: "Video Editing",
    anchor: "video-editing",
    blurb: "Cinematic, lifestyle, trendy, realtor and branding edits.",
    image: "/services-overview/video-production.jpg",
    alt: "Cinematic video editing preview",
  },
  {
    number: "02",
    title: "VFX & 3D Animation",
    anchor: "vfx-3d",
    blurb: "Architectural visualization, product CGI and motion graphics.",
    image: "/services-overview/vfx-3d.jpg",
    alt: "VFX & 3D architectural visualization preview",
  },
  {
    number: "03",
    title: "Photo editing",
    anchor: "photoshoot",
    blurb: "HDR blending, sky replacement, twilight conversions.",
    image: "/services-overview/photoshoot.jpg",
    alt: "Photoshoot & retouching preview",
  },
] as const;

/**
 * §6.5 — Three full-bleed service cards. Each card is a tall image
 * placeholder with a number + title overlaid at the bottom. Hover
 * subtly zooms the image and lightens the dark overlay. Monochrome
 * by design — no accent color (see feedback_accent_gradient memory).
 */
export function ServicesOverview() {
  return (
    <Section id="services-overview">
      <Container>
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {SERVICES.map((service, idx) => (
            <motion.a
              key={service.number}
              variants={fadeUp}
              href={`#${service.anchor}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-card-lg bg-elevated"
            >
              {/* Image */}
              <Image
                src={service.image}
                alt={service.alt}
                fill
                priority={idx === 0}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Dark gradient overlay — readable text on bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/20 transition-opacity duration-300 group-hover:opacity-80" />

              {/* Caption */}
              <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
                <p className="font-display text-5xl text-ink/40 sm:text-6xl">
                  {service.number}
                </p>
                <h3 className="mt-1 font-display text-3xl uppercase tracking-wide sm:text-4xl">
                  {service.title}
                </h3>
                <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-ink-muted">
                  {service.blurb}
                </p>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
