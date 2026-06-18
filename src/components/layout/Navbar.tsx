"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

const NAV_LINKS = [
  { label: "Numbers", href: "#the-proof" },
  { label: "Services", href: "#services-overview" },
  { label: "Work", href: "#video-editing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#final-cta" },
];

export function Navbar() {
  const lenis = useLenis();
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  // Auto-hide on scroll-down past 100px, show on scroll-up.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 100 && y > lastY) setHidden(true);
        else setHidden(false);
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Active section detection — fires when section's center is in viewport.
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.replace("#", ""));
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const scrollToHash = (href: string, e?: MouseEvent) => {
    if (e) e.preventDefault();
    const id = href.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: -72 });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  };

  const scrollToTop = (e?: MouseEvent) => {
    if (e) e.preventDefault();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -32, opacity: 0 }}
        animate={{
          y: hidden ? -100 : 0,
          opacity: 1,
        }}
        transition={{ duration: 0.5, ease: cinematicEase }}
        className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-canvas/70 backdrop-blur-md"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-6 py-3 lg:px-12">
          <a
            href="#"
            onClick={scrollToTop}
            className="flex items-center gap-2 transition-transform duration-300 hover:scale-105"
            aria-label="AVARIS — back to top"
          >
            <Image
              src="/logo.png"
              alt="AVARIS Logo"
              width={32}
              height={32}
              priority
              className="h-7 w-7 object-contain"
            />
            <span className="font-wordmark text-xs uppercase tracking-[0.3em] text-ink">
              AVARIS
            </span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => {
              const id = link.href.replace("#", "");
              const isActive = activeSection === id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToHash(link.href, e)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group relative font-body text-sm transition-colors",
                    isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-1 left-0 h-px bg-ink transition-all duration-300",
                      isActive ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="text-ink lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: cinematicEase }}
              className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col border-l border-white/10 bg-canvas/95 backdrop-blur-lg lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="AVARIS Logo"
                    width={28}
                    height={28}
                    className="h-6 w-6 object-contain"
                  />
                  <span className="font-wordmark text-xs uppercase tracking-[0.3em] text-ink">
                    AVARIS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="text-ink"
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-6">
                {NAV_LINKS.map((link) => {
                  const id = link.href.replace("#", "");
                  const isActive = activeSection === id;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => scrollToHash(link.href, e)}
                      className={cn(
                        "py-3 font-body text-lg transition-colors",
                        isActive
                          ? "text-ink"
                          : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
