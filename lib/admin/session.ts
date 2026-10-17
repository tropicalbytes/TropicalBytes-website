// Admin session limits, enforced by middleware.ts on every /admin request (and
// by SessionTimer in an open tab). Supabase's own session time limits are a
// paid feature, so the app enforces them itself:
//   - idle: signed out after 24 hours with no admin activity;
//   - maximum: signed in again every 48 hours, however active.
// Runs in the Edge runtime (middleware), so no Node-only APIs here.

export const IDLE_LIMIT_MS = 24 * 60 * 60 * 1000;
export const MAX_SESSION_MS = 48 * 60 * 60 * 1000;

/** Time of the last admin request, refreshed by middleware. */
export const LAST_SEEN_COOKIE = "tb_admin_seen";
/** Sign-in time, set at sign-in. Backup for tokens without an `amr` time (see signedInAt). */
export const SIGNED_IN_COOKIE = "tb_admin_since";

const cookie = (name: string, value: number, maxAgeMs: number) => ({
  name,
  value: String(value),
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
  maxAge: Math.ceil(maxAgeMs / 1000) + 3600,
});
export const lastSeenCookie = (now: number) => cookie(LAST_SEEN_COOKIE, now, IDLE_LIMIT_MS);
export const signedInCookie = (now: number) => cookie(SIGNED_IN_COOKIE, now, MAX_SESSION_MS);
/** Cookies to clear on sign-out. */
export const SESSION_COOKIES = [LAST_SEEN_COOKIE, SIGNED_IN_COOKIE];

/**
 * When the user signed in (ms), from the access token's `amr` claim, which
 * Supabase sets at sign-in and keeps through token refreshes. It's part of the
 * signed token, so it can't be pushed back by editing a cookie. Null if absent.
 * Only call this after the token has been verified (supabase.auth.getUser()).
 */
export function signedInAt(accessToken: string | undefined): number | null {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "="))) as {
      amr?: { timestamp?: number }[];
    };
    const times = (claims.amr ?? []).map((a) => a.timestamp).filter((t): t is number => typeof t === "number");
    return times.length ? Math.max(...times) * 1000 : null;
  } catch {
    return null;
  }
}

export type ExpiryReason = "idle" | "max";

/**
 * Why the session has expired, or null if it's still valid. Missing
 * information counts as expired ("max"): e.g. sessions started before these
 * limits existed, which have no activity cookie, are asked to sign in again once.
 */
export function sessionExpiry(now: number, signedIn: number | null, lastSeen: number | null): ExpiryReason | null {
  if (signedIn === null || lastSeen === null || now - signedIn > MAX_SESSION_MS) return "max";
  if (now - lastSeen > IDLE_LIMIT_MS) return "idle";
  return null;
}
