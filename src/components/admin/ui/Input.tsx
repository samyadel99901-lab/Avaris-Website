import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-md border border-white/15 bg-white/[0.03] px-3 py-2 font-body text-sm text-ink placeholder:text-ink-faint",
        "transition-colors focus:border-blue-500/60 focus:bg-white/[0.06] focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
