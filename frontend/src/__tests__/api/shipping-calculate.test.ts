import { beforeEach, describe, expect, it, vi } from "vitest";

function makeRequest(body: object) {
  return new Request("http://localhost:3000/api/shipping/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/shipping/calculate", () => {
  it("returns 400 when no cart items are provided", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/shipping/calculate/route");
    const res = await POST(makeRequest({ items: [] }) as never);
    expect(res.status).toBe(400);
  });

  it("calculates domestic DHL rates from WooCommerce product shipping data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          weight: "0.4",
          dimensions: { length: "20", width: "10", height: "3" },
        }),
      }),
    );

    const { POST } = await import("@/app/api/shipping/calculate/route");
    const res = await POST(
      makeRequest({
        items: [{ product_id: 11, quantity: 1, price: "19.90" }],
        country: "DE",
      }) as never,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.package).toEqual({ weight: 0.4, length: 20, width: 10, height: 3 });
    expect(data.rates).toHaveLength(1);
    expect(data.rates[0]).toMatchObject({
      id: "dhl_kleinpaket",
      price: 3.99,
      dhlProduct: "V62WP",
    });
    expect(data.freeShippingThreshold).toBe(50);
  });

  it("falls back to default package values when product lookup fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const { POST } = await import("@/app/api/shipping/calculate/route");
    const res = await POST(
      makeRequest({
        items: [{ product_id: 99, quantity: 2, price: "12.50" }],
        country: "AT",
      }) as never,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.package).toEqual({ weight: 1, length: 20, width: 15, height: 10 });
    expect(data.rates[0]).toMatchObject({
      id: "dhl_international",
      price: 8.99,
      dhlProduct: "V66WPI",
    });
  });
});
