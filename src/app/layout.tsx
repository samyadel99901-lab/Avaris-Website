import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Anton, Inter, Orbitron, Oswald } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

// Tall, condensed wordmark face with light weights — used for the navbar
// AVARIS so it reads big but not heavy (Anton has no light weight).
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-oswald",
  display: "swap",
});

const SITE_URL = "https://avarisco.net";
const SITE_TITLE = "AVARIS | Premium Media Production";
const SITE_DESCRIPTION =
  "AVARIS Media Production — cinematic video editing, VFX, 3D animation, and real estate photography for brands ready to tell their story at an international level.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s · AVARIS",
  },
  description: SITE_DESCRIPTION,
  applicationName: "AVARIS",
  authors: [{ name: "AVARIS Media Production" }],
  keywords: [
    "video production",
    "media agency",
    "cinematic editing",
    "real estate videos",
    "VFX",
    "3D animation",
    "photography retouching",
    "lifestyle videos",
    "brand videos",
    "Middle East media production",
    "AVARIS",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "AVARIS",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0D12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} ${orbitron.variable} ${oswald.variable}`}
    >
      {/* suppressHydrationWarning: browser extensions (Grammarly, etc.)
          inject attributes like data-gr-ext-installed onto <body> before
          React hydrates, which would otherwise log a hydration mismatch.
          Scoped to <body> so it only ignores those injected attrs. */}
      <body
        className="min-h-screen bg-canvas text-ink antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-canvas focus:px-4 focus:py-2 focus:text-ink focus:outline-2 focus:outline-offset-2 focus:outline-white/30"
        >
          Skip to main content
        </a>
        {/* Landing-specific chrome (Navbar, smooth scroll, tracking,
            JSON-LD) lives in src/app/(landing)/layout.tsx. Admin pages
            in src/app/admin/* render with their own AdminShell instead.
            Vercel Analytics stays here so it tracks every route. */}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
