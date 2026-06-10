import { describe, it, expect, vi, beforeEach } from "vitest";

function makeRequest(body: object) {
  return new Request("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/auth/reset-password", () => {
  it("returns 400 when fields are missing", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(makeRequest({ key: "abc123", login: "user" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short (< 8 chars)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(makeRequest({ key: "abc", login: "user", password: "short" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when WP reports invalid/expired key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: "Dieser Link ist ungültig oder abgelaufen." }) })
    );
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(makeRequest({ key: "expired-key", login: "user", password: "newpassword123" }) as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 200 on successful password reset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    );
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(makeRequest({ key: "valid-key-123", login: "user@test.com", password: "newsecurepass" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("sends WP auth header with Application Password", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/auth/reset-password/route");
    await POST(makeRequest({ key: "k", login: "u", password: "newpassword123" }) as never);
    const [, options] = fetchMock.mock.calls[0];
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: expect.stringMatching(/^Basic /),
    });
  });
});
