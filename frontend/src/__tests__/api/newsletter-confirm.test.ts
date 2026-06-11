import { beforeEach, describe, expect, it, vi } from "vitest";

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
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 55 }) });

    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("@/app/api/newsletter/confirm/route");
    const res = await GET(makeRequest("?token=abc123&id=55") as never);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const html = await res.text();
    expect(html).toContain("Newsletter-Anmeldung ist bestätigt");

    const [couponUrl] = fetchMock.mock.calls[1];
    expect(String(couponUrl)).toContain("/coupons?");

    const [, updateOptions] = fetchMock.mock.calls[2];
    const updateBody = JSON.parse((updateOptions as RequestInit).body as string);
    expect(updateBody.title).toContain("Newsletter ✓: user@kubikart.de");
    expect(updateBody.content).toContain('"status":"confirmed"');
  });
});
