import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/anti-spam";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Schema for the contact form. Tight bounds because anything longer
 * than this isn't a real human message — it's an abuse payload.
 *
 * `website` is a honeypot: real users never see or fill it; bots
 * autofill every input they find. Non-empty → silently 200.
 */
const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function POST(request: Request): Promise<Response> {
  // Per-IP rate limit: 5 messages per hour. Generous for real users,
  // tight enough that scripted abuse hits a wall quickly.
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`contact:${ip}`, {
    windowMs: 60 * 60 * 1000,
    max: 5,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many messages. Try again in a bit." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    );
  }

  let body: z.infer<typeof contactSchema>;
  try {
    const json = await request.json();
    body = contactSchema.parse(json);
  } catch (err) {
    // Log the validation detail server-side only — never echo it to clients.
    console.warn("[contact] invalid submission:", err);
    return NextResponse.json(
      { error: "Please fill in your name, a valid email, and a longer message." },
      { status: 400 },
    );
  }

  // Honeypot triggered → pretend success so bots don't probe further.
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const subject = `AVARIS contact — ${body.name}`;
  const text = [
    `New contact form submission from the AVARIS website.`,
    ``,
    `Name:    ${body.name}`,
    `Email:   ${body.email}`,
    ``,
    `Message:`,
    body.message,
  ].join("\n");

  const result = await sendEmail({
    subject,
    text,
    replyTo: body.email,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Couldn't send your message. Try again or email hello@avarisco.net directly." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
