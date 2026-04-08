/**
 * Simple in-memory rate limiter.
 * Works for single-instance (dev / Vercel serverless with warm lambda).
 * For multi-instance prod, swap the store for Redis/Upstash.
 *
 * Usage:
 *   const ok = rateLimit(`xp:${userId}`, { limit: 20, windowMs: 60_000 });
 *   if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt < now) store.delete(key);
    });
  }, 5 * 60_000);
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
