import "server-only";

import { randomUUID } from "node:crypto";
import { isProductionRuntime } from "@/lib/runtime-config";

export type LockRelease = () => Promise<void>;

const localLocks = new Map<string, { token: string; expiresAt: number }>();

const RELEASE_SCRIPT = "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0";

async function redisCommand(restUrl: string, restToken: string, command: unknown[]): Promise<unknown> {
  const response = await fetch(restUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${restToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Lock store returned ${response.status}`);
  return ((await response.json()) as { result?: unknown }).result;
}

function acquireLocal(key: string, ttlMs: number): LockRelease | null {
  const now = Date.now();
  const current = localLocks.get(key);
  if (current && current.expiresAt > now) return null;
  const token = randomUUID();
  localLocks.set(key, { token, expiresAt: now + ttlMs });
  return async () => {
    if (localLocks.get(key)?.token === token) localLocks.delete(key);
  };
}

/**
 * Atomically claims `key` for `ttlMs`. Returns a release function, or null when
 * another request already holds the lock. Uses Upstash Redis (SET NX PX) when
 * configured so the claim holds across serverless instances; production fails
 * closed without it, development falls back to a process-local lock.
 */
export async function acquireLock(key: string, ttlMs: number): Promise<LockRelease | null> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!restUrl || !restToken) {
    if (isProductionRuntime()) throw new Error("Distributed locking is required in production");
    return acquireLocal(key, ttlMs);
  }

  const token = randomUUID();
  try {
    const result = await redisCommand(restUrl, restToken, ["SET", key, token, "NX", "PX", ttlMs]);
    if (result !== "OK") return null;
  } catch (error) {
    if (isProductionRuntime()) throw new Error("Distributed locking unavailable", { cause: error });
    console.error("Distributed locking unavailable; using process-local development fallback");
    return acquireLocal(key, ttlMs);
  }

  return async () => {
    try {
      await redisCommand(restUrl, restToken, ["EVAL", RELEASE_SCRIPT, 1, key, token]);
    } catch {
      console.error("Failed to release distributed lock; it will expire on its own");
    }
  };
}

export function resetLocalLocksForTests() {
  localLocks.clear();
}
