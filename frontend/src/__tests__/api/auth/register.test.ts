import { describe, it, expect, vi, beforeEach } from "vitest";

function makeRequest(body: object) {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/auth/register", () => {
  it("returns 400 when required fields are missing", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(makeRequest({ email: "test@test.com", password: "pass123" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 1 }] })
    );
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(
      makeRequest({ email: "existing@test.com", password: "pass123", firstName: "Max", lastName: "M" }) as never
    );
    expect(res.status).toBe(409);
  });

  it("returns 200 with user and token on successful registration", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // Check existing → empty (no duplicate)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        // Create customer → success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 10, email: "new@test.com", first_name: "Anna", last_name: "B", username: "anna" }),
        })
    );
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(
      makeRequest({ email: "new@test.com", password: "securepass", firstName: "Anna", lastName: "B" }) as never
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe("new@test.com");
    expect(typeof data.token).toBe("string");
  });

  it("returns 500 when WooCommerce customer creation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: false, text: async () => "WC Error" })
    );
    const { POST } = await import("@/app/api/auth/register/route");
    const res = await POST(
      makeRequest({ email: "fail@test.com", password: "pass", firstName: "F", lastName: "L" }) as never
    );
    expect(res.status).toBe(500);
  });
});
