import { describe, it, expect, vi, beforeEach } from "vitest";

const SITE_ORIGIN = "http://localhost:3000";

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.2.3.4",
      origin: SITE_ORIGIN,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Max Mustermann",
  email: "max@test.de",
  message: "Ich hätte gerne ein Angebot.",
  _t: Date.now() - 6000, // 6 seconds ago — passes timing check
  _hp: "", // empty honeypot
};

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/contact", () => {
  it("returns fake success for honeypot-filled request (bot)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ ...validBody, _hp: "bot@spam.com" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // WP should NOT have been called
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns fake success for too-fast submission (bot)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ ...validBody, _t: Date.now() - 100 }) as never);
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns fake success for invalid origin", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest(validBody, { origin: "https://evil-bot.com" }) as never);
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for missing required fields", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ email: "max@test.de", _t: Date.now() - 6000, _hp: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ ...validBody, email: "not-an-email" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful WP post creation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) })
    );
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("still returns 200 if WP post creation fails (graceful degradation)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, text: async () => "Server Error" })
    );
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest(validBody) as never);
    // Form still succeeds for the user — data stored best-effort
    expect(res.status).toBe(200);
  });
});
