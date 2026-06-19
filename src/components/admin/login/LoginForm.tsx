"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only honor a same-origin internal path. Reject absolute / protocol-
  // relative URLs ("https://evil.com", "//evil.com") to avoid an open
  // redirect off-site after login.
  const rawNext = searchParams.get("next");
  const next =
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("://")
      ? rawNext
      : "/admin/analytics";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Login failed");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-faint">
          Email
        </span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={submitting}
          placeholder="you@avarisco.net"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-xs font-medium uppercase tracking-wider text-ink-faint">
          Password
        </span>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={submitting}
          placeholder="••••••••"
        />
      </label>
      {error && (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-body text-sm text-rose-200">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={submitting}
        className="mt-2 justify-center"
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
      <Link
        href="/"
        className="mt-2 text-center font-body text-xs text-ink-faint hover:text-ink-muted"
      >
        ← Back to AVARIS site
      </Link>
    </form>
  );
}
