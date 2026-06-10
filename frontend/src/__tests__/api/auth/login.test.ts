import { describe, it, expect, vi, beforeEach } from "vitest";

function makeLoginRequest(body: object, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/auth/login", () => {
  it("returns 400 when email or password is missing", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeLoginRequest({ email: "test@example.com" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 401 when no WC customer found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeLoginRequest({ email: "unknown@example.com", password: "pass123" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 when WP password check fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // WC customer lookup → found
        .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, email: "user@test.com", first_name: "Max", last_name: "M", username: "max" }] })
        // WP auth check → fails
        .mockResolvedValueOnce({ ok: false })
    );
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeLoginRequest({ email: "user@test.com", password: "wrongpass" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 200 with user and token on valid credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 5, email: "user@test.com", first_name: "Max", last_name: "M", username: "max" }] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    );
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeLoginRequest({ email: "user@test.com", password: "correct" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe("user@test.com");
    expect(data.user.id).toBe(5);
    expect(typeof data.token).toBe("string");
    expect(data.token.length).toBeGreaterThan(0);
  });

  it("returns 500 on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(makeLoginRequest({ email: "user@test.com", password: "pass" }) as never);
    expect(res.status).toBe(500);
  });
});
