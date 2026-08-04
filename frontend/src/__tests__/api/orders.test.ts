import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/auth-session";

const testUser = { id: 42, email: "customer@example.com", firstName: "Test", lastName: "Customer", username: "customer" };

function makeRequest(user: typeof testUser | null = testUser, extraHeaders: Record<string, string> = {}) {
  const headers = user
    ? { cookie: `kubikart_session=${createSessionToken(user)}`, ...extraHeaders }
    : extraHeaders;
  return new NextRequest("http://localhost:3000/api/orders", {
    method: "GET",
    headers,
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("GET /api/orders", () => {
  it("returns 401 when the signed session cookie is missing", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET(makeRequest(null) as never);
    expect(res.status).toBe(401);
  });

  it("rejects a forged session token even when it claims a customer ID", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const forgedPayload = Buffer.from(JSON.stringify({
      user: { ...testUser, id: 999999 }, issuedAt: Date.now(), expiresAt: Date.now() + 60_000,
    })).toString("base64url");
    const request = new NextRequest("http://localhost:3000/api/orders", {
      headers: { cookie: `kubikart_session=${forgedPayload}.forged-signature`, "x-customer-id": "999999" },
    });
    const { GET } = await import("@/app/api/orders/route");
    const response = await GET(request as never);
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 200 with orders array for authenticated customer", async () => {
    const mockOrders = [
      { id: 101, status: "completed", date_created: "2026-01-01", total: "29.90", currency: "EUR", line_items: [] },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => mockOrders })
    );
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].id).toBe(101);
  });

  it("ignores a spoofed customer header and uses the signed session customer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/orders/route");

    const response = await GET(makeRequest(testUser, { "x-customer-id": "999999" }) as never);

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain("customer=42");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("customer=999999");
  });

  it("returns empty orders array when customer has no orders", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET(makeRequest({ ...testUser, id: 99 }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orders).toEqual([]);
  });

  it("returns 500 when WooCommerce API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET(makeRequest({ ...testUser, id: 1 }) as never);
    expect(res.status).toBe(500);
  });
});
