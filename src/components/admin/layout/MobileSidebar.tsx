"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SidebarNav } from "./SidebarNav";

/**
 * Mobile drawer wrapper — Radix Dialog with slide-from-left.
 * Visible only on `<lg`; desktop uses the fixed `Sidebar`.
 */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-md text-ink-muted hover:bg-white/[0.04] hover:text-ink lg:hidden"
        >
          <Menu size={20} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-canvas/80 backdrop-blur-sm lg:hidden" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-canvas focus:outline-none lg:hidden"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="AVARIS"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              <Dialog.Title className="font-wordmark text-xs uppercase tracking-[0.3em] text-ink">
                AVARIS Admin
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-md text-ink-muted hover:bg-white/[0.04] hover:text-ink"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
