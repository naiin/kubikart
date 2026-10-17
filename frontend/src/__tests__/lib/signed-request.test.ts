import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SIGNATURE_TOLERANCE_SECONDS, signRequest, verifySignedRequest } from "@/lib/signed-request";

const secret = "test-secret";
const body = '{"post_id":1}';
const now = 1_800_000_000;

function verify(overrides: Partial<Parameters<typeof verifySignedRequest>[0]> = {}) {
  return verifySignedRequest({
    secret,
    signature: signRequest(secret, body, now),
    timestamp: String(now),
    body,
    nowSeconds: now,
    ...overrides,
  });
}

describe("verifySignedRequest", () => {
  it("accepts a fresh, correctly signed request", () => {
    expect(verify()).toBe(true);
  });

  it("rejects missing configuration, signature, wrong secret and a changed body", () => {
    expect(verify({ secret: undefined })).toBe(false);
    expect(verify({ signature: null })).toBe(false);
    expect(verify({ signature: signRequest("other", body, now) })).toBe(false);
    expect(verify({ body: '{"post_id":2}' })).toBe(false);
  });

  it("enforces the time window in both directions", () => {
    expect(verify({ nowSeconds: now + SIGNATURE_TOLERANCE_SECONDS })).toBe(true);
    expect(verify({ nowSeconds: now + SIGNATURE_TOLERANCE_SECONDS + 1 })).toBe(false);
    expect(verify({ nowSeconds: now - SIGNATURE_TOLERANCE_SECONDS - 1 })).toBe(false);
  });

  it("rejects malformed timestamps", () => {
    for (const timestamp of ["abc", "-1", "1.5", "99999999999999"]) {
      expect(verify({ timestamp })).toBe(false);
    }
  });

  it("accepts an untimed body-only signature only when explicitly allowed", () => {
    const untimed = { timestamp: null, signature: createHmac("sha256", secret).update(body).digest("base64") };

    expect(verify(untimed)).toBe(false);
    expect(verify({ ...untimed, allowUntimed: true })).toBe(true);
    expect(verify({ ...untimed, signature: "bad", allowUntimed: true })).toBe(false);
  });
});
