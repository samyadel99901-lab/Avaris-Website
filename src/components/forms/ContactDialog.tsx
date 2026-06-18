"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DialogShell } from "./DialogShell";
import { Field, TextArea, TextInput } from "./FormField";

type Status = "idle" | "sending" | "success" | "error";

export function ContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("website") ?? ""),
    };

    // Client-side validation — mirrors server schema bounds.
    const next: Record<string, string> = {};
    if (payload.name.length < 2) next.name = "Please enter your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email))
      next.email = "Please enter a valid email.";
    if (payload.message.length < 10)
      next.message = "Tell us a bit more — at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(json?.error ?? `Request failed (${res.status})`);
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          // Reset on close so reopening starts fresh.
          setStatus("idle");
          setServerError(null);
          setErrors({});
        }
      }}
      title="Get in touch"
      description="Tell us about your project — we'll get back within 24h."
    >
      {status === "success" ? (
        <SuccessState
          message="Your message landed safely. We'll reply within 24 hours."
          onClose={() => onOpenChange(false)}
        />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Honeypot — hidden from real users, irresistible to bots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <Field label="Name" htmlFor="cf-name" required error={errors.name}>
            <TextInput
              id="cf-name"
              name="name"
              autoComplete="name"
              placeholder="Your name"
              required
              maxLength={120}
            />
          </Field>

          <Field
            label="Email"
            htmlFor="cf-email"
            required
            error={errors.email}
          >
            <TextInput
              id="cf-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
            />
          </Field>

          <Field
            label="Message"
            htmlFor="cf-message"
            required
            error={errors.message}
            hint="A few sentences about what you're working on."
          >
            <TextArea
              id="cf-message"
              name="message"
              placeholder="Tell us about your project…"
              required
              minLength={10}
              maxLength={4000}
              rows={5}
            />
          </Field>

          {serverError && (
            <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-body text-xs text-rose-200">
              {serverError}
            </p>
          )}

          <div className="mt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      )}
    </DialogShell>
  );
}

function SuccessState({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-300"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="font-body text-sm text-ink">{message}</p>
      <Button onClick={onClose}>Done</Button>
    </div>
  );
}
