"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Wraps a label + control + (optional) error text in a vertical stack. */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-body text-xs uppercase tracking-[0.2em] text-ink-muted"
      >
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {children}
      {error ? (
        <p className="font-body text-xs text-rose-300">{error}</p>
      ) : hint ? (
        <p className="font-body text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 font-body text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-white/40 focus:bg-white/[0.07] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(inputBase, className)}
      {...props}
    />
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(inputBase, "resize-y", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        inputBase,
        // Force dark option panels in Chromium browsers — Firefox/Safari
        // ignore option CSS, which is fine: OS default is still readable.
        "[&>option]:bg-canvas [&>option]:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
