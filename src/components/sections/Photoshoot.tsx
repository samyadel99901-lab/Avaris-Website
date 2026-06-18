import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import {
  SectionSlider,
  type Slide,
} from "@/components/ui/SectionSlider";

/**
 * Slide data for §6.8.
 *
 * Image files live under `public/photoshoot/...`. If a `src` is removed
 * or fails to load, `SlideImageBox` falls back to `MediaPlaceholder`
 * with the matching `placeholderLabel`.
 */
const SLIDES: Slide[] = [
  {
    category: "Real Estate Interiors",
    features: ["HDR blending", "Color correction", "Virtual staging"],
    tagline: "Every space tells a story.",
    images: [
      {
        src: "/photoshoot/slide-1-real-estate/image-1.jpg",
        alt: "Real estate interior, primary",
        placeholderLabel: "Real Estate · 1",
      },
      {
        src: "/photoshoot/slide-1-real-estate/image-2.jpg",
        alt: "Real estate interior, secondary",
        placeholderLabel: "Real Estate · 2",
      },
    ],
  },
  {
    category: "Property Exteriors",
    features: [
      "Sky replacement",
      "Twilight conversion",
      "Detail enhancement",
    ],
    tagline: "From day to dream in 24 hours.",
    images: [
      {
        src: "/photoshoot/slide-2-exteriors/image-1.jpg",
        alt: "Property exterior, primary",
        placeholderLabel: "Exteriors · 1",
      },
      {
        src: "/photoshoot/slide-2-exteriors/image-2.jpg",
        alt: "Property exterior, secondary",
        placeholderLabel: "Exteriors · 2",
      },
    ],
  },
  {
    category: "Lifestyle Photography",
    features: ["Mood grading", "Object removal", "Sharpening"],
    tagline: "Lifestyle that sells the feeling.",
    images: [
      {
        src: "/photoshoot/slide-3-lifestyle/image-1.jpg",
        alt: "Lifestyle scene, primary",
        placeholderLabel: "Lifestyle · 1",
      },
      {
        src: "/photoshoot/slide-3-lifestyle/image-2.jpg",
        alt: "Lifestyle scene, secondary",
        placeholderLabel: "Lifestyle · 2",
      },
    ],
  },
  {
    category: "Architectural Detail",
    features: ["HDR fusion", "Selective retouching", "Final polish"],
    tagline: "Where craft meets vision.",
    images: [
      {
        src: "/photoshoot/slide-4-architectural/image-1.jpg",
        alt: "Architectural detail, primary",
        placeholderLabel: "Architectural · 1",
      },
      {
        src: "/photoshoot/slide-4-architectural/image-2.jpg",
        alt: "Architectural detail, secondary",
        placeholderLabel: "Architectural · 2",
      },
    ],
  },
];

/**
 * §6.8 — Photoshoot & Retouching, 4-slide carousel inside the
 * standard Container so it stays in rhythm with every other section
 * (see `feedback_no_full_bleed_sections` memory).
 */
export function Photoshoot() {
  return (
    <Section
      id="photoshoot"
      flush
      // py-12 on mobile for breathing room. On lg, the slider provides
      // its own internal padding (lg:py-8) and uses lg:h-screen, so the
      // Section drops its padding to keep the total at exactly 100vh.
      className="py-12 lg:py-0"
    >
      <Container>
        <SectionSlider title="Photo editing" slides={SLIDES} />
      </Container>
    </Section>
  );
}
