/**
 * Formatting helpers for the admin UI.
 *
 * Money: USD figures are stored as integer cents and EGP figures as
 * integer whole units (per the Phase 3 schema). The helpers below take
 * the raw stored integer and produce a localized display string.
 */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const egp = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("en-US");

/** Cents → "$1,250" (no fractional cents). */
export function formatUsdCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return usd.format(cents / 100);
}

/** Cents → "$1,250.00" (always shows cents — for itemized totals). */
export function formatUsdCentsPrecise(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return usdPrecise.format(cents / 100);
}

/** EGP whole units → "EGP 1,250". */
export function formatEgp(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return egp.format(amount);
}

export function formatInteger(n: number | null | undefined): string {
  if (n == null) return "—";
  return integer.format(n);
}

/** YYYY-MM-DD → "May 10, 2026". */
export function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  // Accept full ISO too — slice off the time component.
  const dateOnly = s.length >= 10 ? s.slice(0, 10) : s;
  const d = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ISO timestamp → "May 10, 2026, 3:42 PM". */
export function formatDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "2 hours ago", "yesterday", "5 days ago". Falls back to formatDate for >30 days. */
export function formatRelative(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(s);
}

// ── Status / class / video-type label maps ────────────────────────────

import type { ClientStatus } from "@/types/clients";
import type { ProjectClass, ProjectVideoType } from "@/types/projects";

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  new: "New",
  to_review: "To Review",
  important: "Important",
  active: "Active",
  quiet: "Quiet",
  not_found: "Not Found",
  upset: "Upset",
  inactive: "Inactive",
};

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export const CLIENT_STATUS_TONES: Record<ClientStatus, BadgeTone> = {
  new: "info",
  to_review: "warning",
  important: "info",
  active: "success",
  quiet: "neutral",
  not_found: "neutral",
  upset: "danger",
  inactive: "neutral",
};

export const PROJECT_VIDEO_TYPE_LABELS: Record<ProjectVideoType, string> = {
  reel_short: "Reel < 1min",
  reel_long: "Reel > 1min",
  video_short: "Video < 1min",
  video_long: "Video > 1min",
  photo: "Photo",
  other: "Other",
};

export const PROJECT_CLASS_TONES: Record<ProjectClass, BadgeTone> = {
  A: "info",
  B: "success",
  C: "neutral",
};

/**
 * Map a Monday status label to a Badge tone. Conservative: defaults to
 * neutral for anything we don't explicitly know.
 */
export function projectStatusTone(status: string | null): BadgeTone {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (s === "done" || s === "sent") return "success";
  if (s === "in progress" || s === "uploading") return "info";
  if (
    s === "revisions" ||
    s === "internal revisions" ||
    s === "ready for approval" ||
    s === "ready to send" ||
    s === "waiting"
  )
    return "warning";
  if (s === "archived") return "neutral";
  return "neutral";
}

export function invoiceStatusTone(status: string | null): BadgeTone {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (s === "paid" || s === "checked" || s === "new checked") return "success";
  if (s === "deposit paid" || s === "to review") return "info";
  if (s === "pendeing" || s === "pendingnotsend" || s === "not send")
    return "warning";
  if (s === "archieved") return "neutral";
  return "neutral";
}
