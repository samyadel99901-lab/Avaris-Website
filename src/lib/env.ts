import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const adminRole = z.enum(["admin", "super_admin"]);

/**
 * Supabase keys come in two flavors right now:
 *   - Legacy JWT-style:    eyJ...                  (old anon / service_role)
 *   - 2025+ short-prefix:  sb_publishable_...       (anon / publishable)
 *                          sb_secret_...            (service_role / secret)
 * Both are valid; we accept either format.
 */
const supabasePublishableKey = z
  .string()
  .min(20)
  .refine(
    (v) => v.startsWith("sb_publishable_") || v.startsWith("eyJ"),
    "Expected an sb_publishable_… or legacy eyJ… key",
  );

const supabaseSecretKey = z
  .string()
  .min(20)
  .refine(
    (v) => v.startsWith("sb_secret_") || v.startsWith("eyJ"),
    "Expected an sb_secret_… or legacy eyJ… key",
  );

/**
 * Validated environment variables.
 *
 * Supabase, tracking, admin auth (up to 5 admins), contact email (Resend).
 * (Monday / PayPal / cron vars moved out with the automation app.)
 *
 * Admin _1 is required so we always have one valid login. _2..5 are
 * optional. To skip env validation in CI/build steps that don't need
 * the secrets, set `SKIP_ENV_VALIDATION=true`.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Supabase service role — server-only, bypasses RLS.
    // Optional so the build succeeds without a Supabase project (mock
    // data path). Adapter throws at call time if invoked without it.
    SUPABASE_SERVICE_ROLE_KEY: supabaseSecretKey.optional(),

    // Switches the admin services factory between mock and supabase.
    ADMIN_DATA_SOURCE: z.enum(["mock", "supabase"]).default("mock"),

    // ── Admin auth ────────────────────────────────────────────────
    SESSION_SECRET: z.string().min(32),

    ADMIN_EMAIL_1: z.string().email(),
    ADMIN_NAME_1: z.string().min(1),
    ADMIN_PASSWORD_HASH_1: z.string().startsWith("$argon2"),
    ADMIN_ROLE_1: adminRole.default("admin"),

    ADMIN_EMAIL_2: z.string().email().optional(),
    ADMIN_NAME_2: z.string().min(1).optional(),
    ADMIN_PASSWORD_HASH_2: z.string().startsWith("$argon2").optional(),
    ADMIN_ROLE_2: adminRole.optional(),

    ADMIN_EMAIL_3: z.string().email().optional(),
    ADMIN_NAME_3: z.string().min(1).optional(),
    ADMIN_PASSWORD_HASH_3: z.string().startsWith("$argon2").optional(),
    ADMIN_ROLE_3: adminRole.optional(),

    ADMIN_EMAIL_4: z.string().email().optional(),
    ADMIN_NAME_4: z.string().min(1).optional(),
    ADMIN_PASSWORD_HASH_4: z.string().startsWith("$argon2").optional(),
    ADMIN_ROLE_4: adminRole.optional(),

    ADMIN_EMAIL_5: z.string().email().optional(),
    ADMIN_NAME_5: z.string().min(1).optional(),
    ADMIN_PASSWORD_HASH_5: z.string().startsWith("$argon2").optional(),
    ADMIN_ROLE_5: adminRole.optional(),

    // ── Contact email (Resend) ────────────────────────────────────
    // Optional in all envs: missing key → API routes log the submission
    // to the server console and return success. Set in production to
    // actually deliver mail.
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    /** Verified sender on Resend (e.g. "AVARIS <noreply@avarisco.net>"). */
    CONTACT_EMAIL_FROM: z.string().min(3).optional(),
    /** Where contact + project-request forms send to. */
    CONTACT_EMAIL_TO: z.string().email().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabasePublishableKey.optional(),
    NEXT_PUBLIC_TRACKING_ENABLED: z
      .enum(["true", "false"])
      .default("false"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_DATA_SOURCE: process.env.ADMIN_DATA_SOURCE,
    NEXT_PUBLIC_TRACKING_ENABLED: process.env.NEXT_PUBLIC_TRACKING_ENABLED,
    SESSION_SECRET: process.env.SESSION_SECRET,
    ADMIN_EMAIL_1: process.env.ADMIN_EMAIL_1,
    ADMIN_NAME_1: process.env.ADMIN_NAME_1,
    ADMIN_PASSWORD_HASH_1: process.env.ADMIN_PASSWORD_HASH_1,
    ADMIN_ROLE_1: process.env.ADMIN_ROLE_1,
    ADMIN_EMAIL_2: process.env.ADMIN_EMAIL_2,
    ADMIN_NAME_2: process.env.ADMIN_NAME_2,
    ADMIN_PASSWORD_HASH_2: process.env.ADMIN_PASSWORD_HASH_2,
    ADMIN_ROLE_2: process.env.ADMIN_ROLE_2,
    ADMIN_EMAIL_3: process.env.ADMIN_EMAIL_3,
    ADMIN_NAME_3: process.env.ADMIN_NAME_3,
    ADMIN_PASSWORD_HASH_3: process.env.ADMIN_PASSWORD_HASH_3,
    ADMIN_ROLE_3: process.env.ADMIN_ROLE_3,
    ADMIN_EMAIL_4: process.env.ADMIN_EMAIL_4,
    ADMIN_NAME_4: process.env.ADMIN_NAME_4,
    ADMIN_PASSWORD_HASH_4: process.env.ADMIN_PASSWORD_HASH_4,
    ADMIN_ROLE_4: process.env.ADMIN_ROLE_4,
    ADMIN_EMAIL_5: process.env.ADMIN_EMAIL_5,
    ADMIN_NAME_5: process.env.ADMIN_NAME_5,
    ADMIN_PASSWORD_HASH_5: process.env.ADMIN_PASSWORD_HASH_5,
    ADMIN_ROLE_5: process.env.ADMIN_ROLE_5,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_EMAIL_FROM: process.env.CONTACT_EMAIL_FROM,
    CONTACT_EMAIL_TO: process.env.CONTACT_EMAIL_TO,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
