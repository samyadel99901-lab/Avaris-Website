import { headers } from "next/headers";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { TrackingProvider } from "@/components/tracking/TrackingProvider";

/**
 * Landing-only chrome: Navbar, smooth-scrolling provider, visitor
 * tracking, and the Organization JSON-LD blob. Lives in a route group
 * so `/admin/*` can render with its own AdminShell instead of inheriting
 * any of this.
 *
 * Read the per-request CSP nonce here so the JSON-LD `<script>` carries
 * a valid nonce under the strict CSP set in src/proxy.ts.
 */

const SITE_URL = "https://www.avarisco.net";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AVARIS Media Production",
  alternateName: "AVARIS",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Premium media production studio specializing in cinematic video, VFX, and photography.",
  foundingDate: "2020",
  email: "hello@avarisco.net",
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@avarisco.net",
    contactType: "Customer Support",
    availableLanguage: ["English"],
  },
  sameAs: ["https://www.instagram.com/avariscorporation"],
};

export default async function LandingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      {/* suppressHydrationWarning: the nonce changes per request, so
          the server-rendered nonce attribute will never match the client
          on hydration. The script runs once at parse time anyway. */}
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SmoothScroll>
        <Navbar />
        <Suspense fallback={null}>
          <TrackingProvider>{children}</TrackingProvider>
        </Suspense>
      </SmoothScroll>
    </>
  );
}
