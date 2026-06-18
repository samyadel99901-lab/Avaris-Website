import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Drop the default vertical padding — useful for full-bleed hero sections. */
  flush?: boolean;
  /** Render as `<header>` / `<footer>` instead of `<section>`. */
  as?: "section" | "header" | "footer" | "article";
};

/**
 * A page section with the brief's standard vertical rhythm
 * (80px mobile, 120px desktop). Pair with `Container` for the
 * 1280px content column inside.
 */
export function Section({
  children,
  id,
  className,
  flush = false,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={cn(!flush && "py-20 md:py-30", className)}
    >
      {children}
    </Tag>
  );
}
