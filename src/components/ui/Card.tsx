import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Surface = "elevated" | "paper" | "noir";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Surface tone (default elevated dark card). */
  surface?: Surface;
  /** Wrap with the signature pink→purple gradient outline. */
  gradientBorder?: boolean;
};

const surfaceStyles: Record<Surface, string> = {
  elevated: "bg-elevated text-ink",
  paper: "bg-paper text-ink-inverse",
  noir: "bg-noir text-ink",
};

/**
 * Base card. Default: hairline border on the elevated surface.
 * `gradientBorder` swaps the border for the AVARIS signature gradient
 * (pink → purple) using a 1px gradient padding wrapper.
 */
export function Card({
  children,
  className,
  surface = "elevated",
  gradientBorder = false,
}: CardProps) {
  if (gradientBorder) {
    return (
      <div className={cn("rounded-card-lg p-px bg-gradient-accent", className)}>
        <div
          className={cn(
            "h-full w-full rounded-[calc(var(--radius-card-lg)-1px)] p-6 md:p-8",
            surfaceStyles[surface],
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-card-lg border border-hairline p-6 md:p-8",
        surfaceStyles[surface],
        className,
      )}
    >
      {children}
    </div>
  );
}
