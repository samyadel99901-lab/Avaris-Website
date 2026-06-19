import type { MetadataRoute } from "next";

const SITE_URL = "https://www.avarisco.net";

// Must match the actual section `id`s rendered on the landing page.
const SECTION_ANCHORS = [
  "the-proof",
  "services-overview",
  "video-editing",
  "vfx-3d",
  "photoshoot",
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
