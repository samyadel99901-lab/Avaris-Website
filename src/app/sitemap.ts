import type { MetadataRoute } from "next";

const SITE_URL = "https://www.avarisco.net";

const SECTION_ANCHORS = [
  "where-we-started",
  "the-proof",
  "services-overview",
  "video-production",
  "vfx-3d",
  "photoshoot",
  "our-process",
  "organic-reach",
  "testimonials",
  "final-cta",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...SECTION_ANCHORS.map((anchor) => ({
      url: `${SITE_URL}/#${anchor}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
