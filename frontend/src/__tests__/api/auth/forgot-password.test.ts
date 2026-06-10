import { describe, it, expect, vi, beforeEach } from "vitest";

function makeRequest(body: object, ip = "1.2.3.4") {
  return new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/auth/forgot-password", () => {
  it("always returns 200 for valid email (no enumeration)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const res = await POST(makeRequest({ email: "user@test.com" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("always returns 200 for non-existent email (no enumeration)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const res = await POST(makeRequest({ email: "nobody@test.com" }) as never);
    expect(res.status).toBe(200);
  });

  it("returns 200 even when WP endpoint fails (silent failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("WP offline")));
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const res = await POST(makeRequest({ email: "user@test.com" }) as never);
    expect(res.status).toBe(200);
  });

  it("returns 200 for invalid email format (no enumeration)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const res = await POST(makeRequest({ email: "not-an-email" }) as never);
    expect(res.status).toBe(200);
  });

  it("returns 400 for malformed JSON body", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new Request("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9" },
      body: "not-json{{",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("rate limits after 3 requests from the same IP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const ip = "5.5.5.5";
    // First 3 requests succeed
    for (let i = 0; i < 3; i++) {
      const res = await POST(makeRequest({ email: "user@test.com" }, ip) as never);
      expect(res.status).toBe(200);
    }
    // 4th request should be silently limited (still 200 — no enumeration)
    const res4 = await POST(makeRequest({ email: "user@test.com" }, ip) as never);
    expect(res4.status).toBe(200);
    // After rate limit, WP fetch should NOT be called again for new request
    const callCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    // Called at most 3 times (rate limited 4th)
    expect(callCount).toBeLessThanOrEqual(3);
  });
});
