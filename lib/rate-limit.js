// Tiny in-memory fixed-window limiter. Good enough for a single-server SQLite deployment.
const buckets = globalThis.__wameedRateLimit ?? new Map();
globalThis.__wameedRateLimit = buckets;

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - bucket.count };
}

export function resetRateLimit(key) {
  buckets.delete(key);
}
