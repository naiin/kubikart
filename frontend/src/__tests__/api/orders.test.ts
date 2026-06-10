import { describe, it, expect, vi, beforeEach } from "vitest";

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/orders", {
    method: "GET",
    headers,
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("GET /api/orders", () => {
  it("returns 401 when x-customer-id header is missing", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
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
    const res = await GET(makeRequest({ "x-customer-id": "42" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].id).toBe(101);
  });

  it("returns empty orders array when customer has no orders", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET(makeRequest({ "x-customer-id": "99" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orders).toEqual([]);
  });

  it("returns 500 when WooCommerce API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET(makeRequest({ "x-customer-id": "1" }) as never);
    expect(res.status).toBe(500);
  });
});
