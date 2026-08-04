import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyRateLimit, getApiRateLimitPolicy, resetLocalRateLimitsForTests } from "@/lib/rate-limit";

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  resetLocalRateLimitsForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("API rate limiting", () => {
  it("uses stricter policies for authentication and order creation", () => {
    expect(getApiRateLimitPolicy("/api/auth/login").limit).toBe(10);
    expect(getApiRateLimitPolicy("/api/orders/create").limit).toBe(10);
    expect(getApiRateLimitPolicy("/api/webhooks/stripe").limit).toBe(180);
  });

  it("rejects requests after the configured limit", async () => {
    const policy = { limit: 2, windowMs: 60_000 };
    await expect(applyRateLimit("test-key", policy)).resolves.toMatchObject({ allowed: true, remaining: 1 });
    await expect(applyRateLimit("test-key", policy)).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(applyRateLimit("test-key", policy)).resolves.toMatchObject({ allowed: false, remaining: 0 });
  });

  it("fails closed instead of using process memory in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(applyRateLimit("production-key", { limit: 2, windowMs: 60_000 })).rejects.toThrow(
      "Distributed rate limiting is required in production",
    );
  });
});
