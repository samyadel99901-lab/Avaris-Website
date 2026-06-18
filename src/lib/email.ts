/**
 * Resend wrapper with graceful fallback.
 *
 * If `RESEND_API_KEY` is unset (local dev / preview before mail is
 * wired up), we log the message to the server console and return
 * success. That way the contact + project-request forms work
 * end-to-end during development without anyone needing to sign up for
 * Resend first.
 *
 * In production, set these three env vars and you're done:
 *   RESEND_API_KEY        = re_xxxxxxxx
 *   CONTACT_EMAIL_FROM    = "AVARIS <noreply@avarisco.net>"
 *   CONTACT_EMAIL_TO      = hello@avarisco.net
 */

import { Resend } from "resend";
import { env } from "@/lib/env";

export interface SendEmailInput {
  /** Subject line — defaults to "AVARIS — new submission". */
  subject: string;
  /** Plain-text body. Used as-is when `html` is missing. */
  text: string;
  /** Optional HTML body for richer rendering. */
  html?: string;
  /** Optional Reply-To (e.g. the form submitter's address). */
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  /** "sent" when Resend dispatched. "logged" when no API key configured. */
  mode: "sent" | "logged";
  /** Provider message id when ok && mode==="sent". */
  id?: string;
  /** Populated when ok===false. */
  error?: string;
}

let cached: Resend | null = null;
function client(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  cached ??= new Resend(env.RESEND_API_KEY);
  return cached;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = client();
  const from = env.CONTACT_EMAIL_FROM;
  const to = env.CONTACT_EMAIL_TO;

  // Fallback path — log + succeed. Lets local dev exercise the full
  // form flow without Resend setup, and avoids a "broken contact form"
  // in production if the env vars are misconfigured at deploy time.
  if (!resend || !from || !to) {
    console.warn(
      "[email] Resend not configured — logging submission instead.\n" +
        `  subject: ${input.subject}\n` +
        `  replyTo: ${input.replyTo ?? "(none)"}\n` +
        `  body:\n${input.text}`,
    );
    return { ok: true, mode: "logged" };
  }

  try {
    const res = await resend.emails.send({
      from,
      to: [to],
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (res.error) {
      return { ok: false, mode: "sent", error: res.error.message };
    }
    return { ok: true, mode: "sent", id: res.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, mode: "sent", error: msg };
  }
}
