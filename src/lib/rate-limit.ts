// Minimal in-memory rate limiter for the login endpoint.
//
// This is sufficient for a single-instance prototype. In a real, horizontally
// scaled deployment, replace this module's storage with a shared store
// (e.g. Redis) so limits are enforced across all instances — the call sites
// that use `checkRateLimit` will not need to change.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - existing.count };
}
