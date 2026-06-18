import type { Admin } from "@/types/admin";

/**
 * Auth service interface. Phase 2a implementation reads admins from env
 * vars; Phase 2b will swap to Clerk or Supabase Auth without touching
 * the API routes that depend on this contract.
 */
export interface AuthService {
  /**
   * Verify an email + password pair.
   * Returns the matching `Admin` on success, `null` on any failure
   * (unknown email, wrong password, malformed inputs).
   *
   * Implementations MUST run constant-time comparisons and SHOULD
   * spend the same amount of time on email-not-found vs password-wrong
   * to prevent user enumeration.
   */
  verifyCredentials(email: string, password: string): Promise<Admin | null>;

  /** Lookup by id — used by /api/admin/auth/me to refresh the session payload. */
  getAdmin(id: string): Promise<Admin | null>;

  listAdmins(): Promise<Admin[]>;
}
