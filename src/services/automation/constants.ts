/**
 * Eligibility constants for the invoicing automation, mirroring the
 * filters the original Laravel automation used on the "Customer Projects"
 * board.
 */

/**
 * Monday group ids that are in scope for invoicing — "Sent", "Revisions",
 * "Finished" (verified against the board on 2026-06). Group ids are stable
 * across renames.
 */
export const ELIGIBLE_GROUP_IDS = [
  "new_group69732__1", // Sent
  "new_group41442__1", // Revisions
  "group_title", // Finished
] as const;

/**
 * Invoice-status labels that mean "not yet invoiced" — only these are
 * candidates. After a successful send the status flips to "Pendeing"
 * (see INVOICED_STATUS_LABEL), removing the project from this set.
 */
export const ELIGIBLE_INVOICE_STATUSES = ["Not send", "Deposit paid"] as const;

/** Hard cap on customers processed per send request (Vercel 60s budget). */
export const SEND_TIME_BUDGET_MS = 50_000;
