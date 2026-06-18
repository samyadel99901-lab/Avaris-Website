import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

/**
 * Centered max-width wrapper. Defaults to 1280px content width with
 * responsive horizontal padding. Use for any block that needs the
 * standard reading column.
 */
export function Container({
  children,
  className,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      className={cn("mx-auto w-full max-w-content px-6 sm:px-8", className)}
    >
      {children}
    </Component>
  );
}
