import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/email", () => ({ sendNewsletterWelcome: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/distributed-lock", () => ({ acquireLock: vi.fn().mockResolvedValue(async () => {}) }));

function makeRequest(query = "") {
  return {
    nextUrl: new URL(`http://localhost:3000/api/newsletter/confirm${query}`),
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("GET /api/newsletter/confirm", () => {
  it("returns 400 when token or id is missing", async () => {
    const { GET } = await import("@/app/api/newsletter/confirm/route");
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Ungültiger Bestätigungslink");
  });

  it("confirms the subscription and updates WordPress data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: {
            rendered:
              '<p>{"email":"user@kubikart.de","token":"abc123","status":"pending","subscribed_at":"2026-01-01T00:00:00.000Z"}</p>',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 987 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 55 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 55 }) });

    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/newsletter/confirm/route");
    const res = await GET(makeRequest("?token=abc123&id=55") as never);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    const html = await res.text();
    expect(html).toContain("Newsletter-Anmeldung ist bestätigt");

    const [couponUrl] = fetchMock.mock.calls[1];
    expect(String(couponUrl)).toContain("/coupons");
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toMatchObject({
      Authorization: expect.stringMatching(/^Basic /),
    });

    const [, updateOptions] = fetchMock.mock.calls[2];
    const updateBody = JSON.parse((updateOptions as RequestInit).body as string);
    expect(updateBody.title).toContain("Newsletter ✓: user@kubikart.de");
    expect(updateBody.content).toContain('"status":"confirmed"');
  });

  it("does not create coupons or send mail again for a confirmed-token replay", async () => {
    const { sendNewsletterWelcome } = await import("@/lib/email");
    vi.mocked(sendNewsletterWelcome).mockClear();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: { raw: JSON.stringify({ email: "user@kubikart.de", token: "abc123", locale: "en", status: "confirmed", email_status: "accepted" }) } }) });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/newsletter/confirm/route");
    const response = await GET(makeRequest("?token=abc123&id=55&locale=de") as never);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('lang="en"');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendNewsletterWelcome).not.toHaveBeenCalled();
  });

  it("rejects an invalid token before any coupon, state change or email", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: { raw: '{"email":"user@kubikart.de","token":"different","status":"pending"}' } }) });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/newsletter/confirm/route");
    const response = await GET(makeRequest("?token=abc123&id=55") as never);
    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not reactivate an unsubscribed reader through an old confirmation link", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: { raw: JSON.stringify({ email: "qa@example.com", token: "abc123", status: "unsubscribed" }) } }) });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/newsletter/confirm/route");
    expect((await GET(makeRequest("?token=abc123&id=55") as never)).status).toBe(409);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retains an existing coupon and records a retryable welcome-email failure", async () => {
    const { sendNewsletterWelcome } = await import("@/lib/email");
    vi.mocked(sendNewsletterWelcome).mockRejectedValueOnce(new Error("Mail provider unavailable"));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: { raw: JSON.stringify({ email: "user@kubikart.de", token: "abc123", status: "confirmed", email_status: "failed", coupon_code: "WILLKOMMEN-1234ABCD" }) } }) })
      .mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/newsletter/confirm/route");
    const response = await GET(makeRequest("?token=abc123&id=55") as never);
    expect(response.status).toBe(503);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/coupons"))).toBe(false);
    expect(JSON.parse(fetchMock.mock.calls.at(-1)![1].body as string).content).toContain('"email_status":"failed"');
  });
});
