import { hash, verify } from "@node-rs/argon2";
import { env } from "@/lib/env";
import type { Admin, AdminRole } from "@/types/admin";
import type { AuthService } from "./auth";

/**
 * Reads admins from env vars (`ADMIN_EMAIL_1..5`, etc.). Verifies
 * passwords with argon2id. Phase 2a implementation — replace with
 * Clerk/Supabase Auth in Phase 2b.
 *
 * IDs are deterministic (`admin_<index>`) so reissued sessions still
 * resolve to the same admin across restarts.
 */
export function createHardcodedAuthService(): AuthService {
  const admins = collectAdminsFromEnv();

  // Pre-computed dummy hash to keep timing constant when an unknown
  // email is submitted. Avoids enumeration via response time.
  let dummyHashPromise: Promise<string> | null = null;
  const dummyHash = () => {
    dummyHashPromise ??= hash("not-a-real-password", {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
    });
    return dummyHashPromise;
  };

  return {
    async verifyCredentials(emailRaw, password) {
      const email = (emailRaw ?? "").trim().toLowerCase();
      if (!email || !password) {
        // Even with empty creds, do a verify against the dummy so the
        // total work matches a real attempt.
        await verify(await dummyHash(), password ?? "");
        return null;
      }
      const admin = admins.find((a) => a.email.toLowerCase() === email);
      if (!admin) {
        await verify(await dummyHash(), password);
        return null;
      }
      let ok = false;
      try {
        ok = await verify(admin.hash, password);
      } catch {
        ok = false;
      }
      if (!ok) return null;
      return toAdmin(admin);
    },

    async getAdmin(id) {
      const admin = admins.find((a) => a.id === id);
      return admin ? toAdmin(admin) : null;
    },

    async listAdmins() {
      return admins.map(toAdmin);
    },
  };
}

// ─── Internals ────────────────────────────────────────────────────────
type RawAdmin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  hash: string;
};

function collectAdminsFromEnv(): RawAdmin[] {
  const list: RawAdmin[] = [];
  // Slot 1 is required → assert non-undefined.
  list.push({
    id: "admin_1",
    email: env.ADMIN_EMAIL_1,
    name: env.ADMIN_NAME_1,
    role: env.ADMIN_ROLE_1,
    hash: env.ADMIN_PASSWORD_HASH_1,
  });

  for (const i of [2, 3, 4, 5] as const) {
    const e = (env as Record<string, unknown>)[`ADMIN_EMAIL_${i}`] as string | undefined;
    const n = (env as Record<string, unknown>)[`ADMIN_NAME_${i}`] as string | undefined;
    const h = (env as Record<string, unknown>)[`ADMIN_PASSWORD_HASH_${i}`] as string | undefined;
    const r = (env as Record<string, unknown>)[`ADMIN_ROLE_${i}`] as AdminRole | undefined;
    if (e && n && h) {
      list.push({
        id: `admin_${i}`,
        email: e,
        name: n,
        role: r ?? "admin",
        hash: h,
      });
    }
  }
  return list;
}

function toAdmin(a: RawAdmin): Admin {
  return { id: a.id, email: a.email, name: a.name, role: a.role };
}
