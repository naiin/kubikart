import { describe, it, expect, vi, beforeEach } from "vitest";
const { sendNewsletterConfirmation } = vi.hoisted(() => ({ sendNewsletterConfirmation: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendNewsletterConfirmation }));

function makeRequest(body: object, ip = "2.3.4.5") {
  return new Request("http://localhost:3000/api/newsletter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  sendNewsletterConfirmation.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/newsletter", () => {
  it("returns 400 for invalid email", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "not-email", _t: Date.now() - 2000, _hp: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns fake success for honeypot-filled bot submission", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "bot@spam.com", _hp: "filled", _t: Date.now() - 2000 }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns fake success for too-fast submission (newsletter = 1500ms)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "fast@test.com", _t: Date.now() - 500, _hp: "" }) as never);
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 200 with doubleOptIn true on valid subscription", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // WP newsletter subscriber creation
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 100 }) })
        // WP mail send (optional, can fail)
        .mockResolvedValueOnce({ ok: true })
    );
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "user@kubikart.de", _t: Date.now() - 2000, _hp: "" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.doubleOptIn).toBe(true);
  });

  it("returns 500 when WP fails to save subscriber", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, text: async () => "WP Error" })
    );
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "user@kubikart.de", _t: Date.now() - 2000, _hp: "" }) as never);
    expect(res.status).toBe(500);
  });

  it("stores email normalized to lowercase", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/newsletter/route");
    await POST(makeRequest({ email: "USER@Kubikart.DE", _t: Date.now() - 2000, _hp: "" }) as never);
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.title).toContain("user@kubikart.de");
  });

  it("uses the real unprefixed confirmation endpoint and selected locale", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 100 }) }));
    const { POST } = await import("@/app/api/newsletter/route");
    await POST(makeRequest({ email: "user@kubikart.de", locale: "en", _t: Date.now() - 2000 }) as never);
    expect(sendNewsletterConfirmation).toHaveBeenCalledWith("user@kubikart.de", expect.stringContaining("/api/newsletter/confirm?"), "en");
    expect(sendNewsletterConfirmation.mock.calls[0][1]).not.toContain("/en/api/");
  });

  it("does not report email success when the provider fails", async () => {
    sendNewsletterConfirmation.mockRejectedValue(new Error("Provider unavailable"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 100 }) }));
    const { POST } = await import("@/app/api/newsletter/route");
    const response = await POST(makeRequest({ email: "user@kubikart.de", _t: Date.now() - 2000 }) as never);
    expect(response.status).toBe(503);
  });
});
