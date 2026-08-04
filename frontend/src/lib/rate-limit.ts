export type RateLimitPolicy = { limit: number; windowMs: number };
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

const localCounters = new Map<string, { count: number; resetAt: number }>();

function localRateLimit(key: string, policy: RateLimitPolicy, now = Date.now()): RateLimitResult {
  const current = localCounters.get(key);
  const entry = !current || current.resetAt <= now ? { count: 1, resetAt: now + policy.windowMs } : { ...current, count: current.count + 1 };
  localCounters.set(key, entry);
  return {
    allowed: entry.count <= policy.limit,
    remaining: Math.max(0, policy.limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function getApiRateLimitPolicy(pathname: string): RateLimitPolicy {
  if (pathname.startsWith("/api/webhooks/")) return { limit: 180, windowMs: 60_000 };
  if (pathname.startsWith("/api/auth/") || pathname === "/api/orders/create") return { limit: 10, windowMs: 60_000 };
  if (pathname.startsWith("/api/stripe/") || pathname.startsWith("/api/paypal/")) return { limit: 20, windowMs: 60_000 };
  if (["/api/contact", "/api/newsletter", "/api/withdrawal"].includes(pathname)) return { limit: 5, windowMs: 10 * 60_000 };
  return { limit: 60, windowMs: 60_000 };
}

export async function applyRateLimit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!restUrl || !restToken) return localRateLimit(key, policy);

  const script = "local c=redis.call('INCR',KEYS[1]); if c==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {c,redis.call('PTTL',KEYS[1])}";
  try {
    const response = await fetch(restUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${restToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", script, 1, key, policy.windowMs]),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Rate-limit store returned ${response.status}`);
    const data = (await response.json()) as { result?: [number, number] };
    const count = Number(data.result?.[0]);
    const ttl = Number(data.result?.[1]);
    if (!Number.isFinite(count) || !Number.isFinite(ttl)) throw new Error("Invalid rate-limit store response");
    return { allowed: count <= policy.limit, remaining: Math.max(0, policy.limit - count), retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)) };
  } catch (error) {
    console.error("Distributed rate limiting unavailable; using process-local fallback:", error);
    return localRateLimit(key, policy);
  }
}

export function resetLocalRateLimitsForTests() {
  localCounters.clear();
}
