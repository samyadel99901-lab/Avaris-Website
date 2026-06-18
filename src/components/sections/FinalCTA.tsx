"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, FileText } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ContactDialog } from "@/components/forms/ContactDialog";
import { ProjectFormDialog } from "@/components/forms/ProjectFormDialog";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { fadeUp, staggerChildren } from "@/lib/animations";

const cinematicEase = [0.16, 1, 0.3, 1] as const;

const CONTACT = [
  { label: "Email", value: "hello@avarisco.net", href: "mailto:hello@avarisco.net" },
  { label: "Website", value: "www.avarisco.net", href: "https://www.avarisco.net" },
  { label: "Social", value: "@avariscorporation", href: "https://www.instagram.com/avariscorporation" },
];

/**
 * §6.12 — Final CTA + footer.
 *
 * Headline copy is "Your videos deserve this." Below the headline two
 * primary actions:
 *   - "Get more details" → opens ContactDialog (free-form message)
 *   - "Submit a new project" → opens ProjectFormDialog (the embedded
 *     monday.com WorkForm)
 *
 * The same two buttons also live in the Hero now — this is the
 * bottom-of-page duplicate, so visitors who scroll all the way down
 * can still act.
 *
 * ContactDialog POSTs to an API route that sends mail via Resend; the
 * project form submits straight to monday.com.
 */
export function FinalCTA() {
  const [contactOpen, setContactOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  return (
    <>
    <Section
      id="final-cta"
      flush
      as="footer"
      className="relative bg-noir paper-texture py-24 lg:py-32"
    >
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[60%_40%] lg:gap-16">
          {/* LEFT — headline + contact list */}
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-15%" }}
            className="flex flex-col"
          >
            <motion.h2
              variants={fadeUp}
              className="font-display uppercase tracking-display leading-[0.95] text-6xl sm:text-7xl lg:text-8xl"
            >
              Your videos
              <br />
              deserve this.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl font-body text-lg leading-relaxed text-ink-muted"
            >
              Be the first in your market to tell your story at an
              international level.
            </motion.p>

            {/* Action buttons */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                data-track="cta_click"
                data-track-label="Get more details"
                data-track-location="final-cta"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-paper px-7 py-3.5 font-body font-medium text-ink-inverse shadow-lg shadow-black/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              >
                Get more details
                <ArrowUpRight
                  size={18}
                  strokeWidth={1.75}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>
              <button
                type="button"
                onClick={() => setProjectOpen(true)}
                data-track="cta_click"
                data-track-label="Submit a new project"
                data-track-location="final-cta"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-hairline-strong px-7 py-3.5 font-body font-medium text-ink transition-all duration-200 hover:border-ink hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              >
                <FileText size={18} strokeWidth={1.75} />
                Submit a new project
              </button>
            </motion.div>

            <motion.dl
              variants={fadeUp}
              className="mt-12 flex flex-col gap-5"
            >
              {CONTACT.map((item) => {
                const isExternal = item.label === "Social";
                return (
                  <div key={item.label} className="flex flex-col gap-1">
                    <dt className="font-body text-xs uppercase tracking-[0.3em] text-gold">
                      {item.label}
                    </dt>
                    <dd>
                      <a
                        href={item.href}
                        className="font-body text-lg text-ink transition-colors hover:text-ink-muted"
                        target={item.label === "Email" ? undefined : "_blank"}
                        rel={item.label === "Email" ? undefined : "noopener noreferrer"}
                        data-track={isExternal ? "external" : "cta_click"}
                        data-track-label={`${item.label}: ${item.value}`}
                        data-track-location="final-cta"
                      >
                        {item.value}
                      </a>
                    </dd>
                  </div>
                );
              })}
            </motion.dl>
          </motion.div>

          {/* Vertical divider — visible on lg+ */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 hidden w-px bg-white/20 lg:block"
            />

            {/* RIGHT — logo + signature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.8, ease: cinematicEase, delay: 0.2 }}
              className="flex flex-col items-center text-center lg:pl-12 lg:items-center"
            >
              <Image
                src="/logo.png"
                alt="AVARIS Logo"
                width={160}
                height={160}
                priority
                className="h-40 w-40 object-contain"
              />
              <p className="mt-6 font-wordmark text-4xl tracking-[0.05em] text-ink sm:text-5xl">
                AVARIS
              </p>
              <p className="mt-4 font-display text-base uppercase tracking-[0.2em] text-ink">
                Storytelling is everything.
              </p>
              <p className="mt-8 font-body text-sm italic text-ink-faint">
                Est. 2020
              </p>
            </motion.div>
          </div>
        </div>
      </Container>
    </Section>

    <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} />
    </>
  );
}
