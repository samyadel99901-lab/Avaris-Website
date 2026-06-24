"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useLenis } from "lenis/react";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Radix-Dialog chrome used by ContactDialog.
 *
 * Centers on viewport. Closes on Esc + backdrop click. Locks body
 * scroll while open (Radix handles that). Animations match the
 * cinematic easing used elsewhere.
 */
export function DialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  /** Wider dialogs (project request) opt in via `wide`. */
  wide,
  /** Explicit max-width class — overrides `wide`/default (e.g. the video
   *  lightbox passes a larger one). */
  maxWidthClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
  maxWidthClassName?: string;
}) {
  const lenis = useLenis();

  // Radix locks <body> scroll automatically, but Lenis hooks wheel +
  // touch events at the window level and ignores body's overflow.
  // Stop Lenis while a dialog is open so scrolling inside the form
  // doesn't bleed through to the page underneath.
  useEffect(() => {
    if (!lenis) return;
    if (open) lenis.stop();
    else lenis.start();
    return () => {
      // Defensive restart on unmount in case the dialog tree
      // disappears while still open.
      lenis.start();
    };
  }, [open, lenis]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "max-h-[92vh] w-[92vw] overflow-y-auto",
            maxWidthClassName ?? (wide ? "max-w-2xl" : "max-w-md"),
            "rounded-2xl border border-white/15 bg-canvas/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl uppercase tracking-wide text-ink">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 font-body text-sm text-ink-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-md p-1 text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              aria-label="Close"
            >
              <X size={18} strokeWidth={1.5} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
