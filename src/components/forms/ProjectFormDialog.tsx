"use client";

import { DialogShell } from "./DialogShell";

/**
 * "Submit a new project" — embeds the monday.com WorkForm (wkf.ms/4upt85k)
 * in an iframe so submissions land straight on the monday board and the
 * client never leaves the site.
 *
 * This is the chosen approach (decided over a custom React form). Note:
 * monday's embed renders on a light surface regardless of theme — that's
 * a monday limitation, accepted here.
 */
const MONDAY_FORM_SRC =
  "https://forms.monday.com/forms/embed/d506125960a83431f07f31bdf6890b45?r=use1";

export function ProjectFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Submit a New Project"
      description="Tell us about your project and share your footage."
      wide
    >
      <iframe
        src={MONDAY_FORM_SRC}
        title="Submit a new project"
        loading="lazy"
        // Constrain the third-party frame's capabilities and avoid leaking
        // the full landing URL (incl. any ?utm_*) to monday in the Referer.
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-[72vh] max-h-[680px] w-full rounded-lg border-0 bg-white"
      />
    </DialogShell>
  );
}
