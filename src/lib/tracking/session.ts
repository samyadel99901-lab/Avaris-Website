const STORAGE_KEY = "avaris-session-id";

/**
 * Returns a stable session id for the current browser. New random id
 * if none exists in localStorage. Falls back to a per-page id if
 * localStorage is unavailable (private mode, denied permissions) so
 * events still flow but don't link across pages.
 *
 * Server-side calls return "" — tracking only runs client-side.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = `s_${crypto.randomUUID()}`;
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return `s_${crypto.randomUUID()}`;
  }
}
