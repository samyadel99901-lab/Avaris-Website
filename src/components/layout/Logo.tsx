import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  /** Accessible label. Pass empty string for purely decorative use. */
  title?: string;
};

/**
 * AVARIS mark — geometric "A" inside a circle with two diamond accents.
 * Approximation drawn from design-references/Slide4.PNG and Slide41.PNG.
 * Color is inherited via `currentColor` — set with text-* utilities.
 */
export function Logo({
  size = 64,
  className,
  title = "AVARIS",
}: LogoProps) {
  const decorative = title === "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      className={cn("inline-block shrink-0", className)}
    >
      {!decorative && <title>{title}</title>}

      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* "A" — two diagonals meeting at top apex */}
      <path
        d="M 26 76 L 50 24 L 74 76"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />

      {/* Crossbar */}
      <path
        d="M 36 60 L 64 60"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
      />

      {/* Two diamond accents nested in the A */}
      <path d="M 41 53 L 45 49 L 49 53 L 45 57 Z" fill="currentColor" />
      <path d="M 51 53 L 55 49 L 59 53 L 55 57 Z" fill="currentColor" />
    </svg>
  );
}
