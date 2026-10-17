import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/client-ip";
import { applyRateLimit, getApiRateLimitPolicy, getRateLimitMessage, inferRequestLocale, resetLocalRateLimitsForTests } from "@/lib/rate-limit";

const headers = (values: Record<string, string>) => new Headers(values);

describe("getClientIp", () => {
  it("ignores X-Forwarded-For unless trusted proxies are configured", () => {
    expect(getClientIp(headers({ "x-forwarded-for": "203.0.113.9" }), {})).toBe("unknown");
    expect(getClientIp(headers({ "x-forwarded-for": "203.0.113.9" }), { TRUSTED_PROXY_HOPS: "0" })).toBe("unknown");
  });

  it("reads from the right so a client-supplied prefix cannot choose its own address", () => {
    const forged = headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" });
    expect(getClientIp(forged, { TRUSTED_PROXY_HOPS: "1" })).toBe("198.51.100.7");
    const twoProxies = headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7, 10.0.0.2" });
    expect(getClientIp(twoProxies, { TRUSTED_PROXY_HOPS: "2" })).toBe("198.51.100.7");
  });

  it("rejects malformed values and missing entries", () => {
    expect(getClientIp(headers({ "x-forwarded-for": "not-an-ip" }), { TRUSTED_PROXY_HOPS: "1" })).toBe("unknown");
    expect(getClientIp(headers({}), { TRUSTED_PROXY_HOPS: "1" })).toBe("unknown");
    expect(getClientIp(headers({ "x-forwarded-for": "203.0.113.9" }), { TRUSTED_PROXY_HOPS: "3" })).toBe("unknown");
    expect(getClientIp(headers({ "x-forwarded-for": "2001:db8::1" }), { TRUSTED_PROXY_HOPS: "1" })).toBe("2001:db8::1");
  });
});

describe("upload rate limit", () => {
  it("allows ten uploads per ten minutes and then reports when to retry", async () => {
    resetLocalRateLimitsForTests();
    const policy = getApiRateLimitPolicy("/api/uploads/customer-file");
    expect(policy).toEqual({ limit: 10, windowMs: 10 * 60_000 });

    const results = [];
    for (let attempt = 0; attempt < 12; attempt++) {
      results.push(await applyRateLimit("kubikart:api:/api/uploads/customer-file:203.0.113.9", policy));
    }
    expect(results.slice(0, 10).every((result) => result.allowed)).toBe(true);
    expect(results[10].allowed).toBe(false);
    expect(results[10].retryAfterSeconds).toBeGreaterThan(0);

    const otherClient = await applyRateLimit("kubikart:api:/api/uploads/customer-file:198.51.100.1", policy);
    expect(otherClient.allowed).toBe(true);
  });

  it("explains the limit in the visitor's language", () => {
    expect(getRateLimitMessage("de", 540)).toBe("Zu viele Versuche. Bitte versuche es in etwa 9 Minuten erneut.");
    expect(getRateLimitMessage("en", 30)).toBe("Too many attempts. Please try again in about 1 minute.");
    expect(inferRequestLocale(headers({ referer: "http://localhost:3000/en/shop/x" }))).toBe("en");
    expect(inferRequestLocale(headers({ "accept-language": "en-GB,en;q=0.9" }))).toBe("en");
    expect(inferRequestLocale(headers({}))).toBe("de");
  });
});
