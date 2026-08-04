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
          id: 11,
          name: "Woo product",
          type: "simple",
          status: "publish",
          price: "19.90",
          stock_status: "instock",
          meta_data: [],
          weight: "0.4",
          dimensions: { length: "20", width: "10", height: "3" },
        }),
      }),
    );

    const { POST } = await import("@/app/api/shipping/calculate/route");
    const res = await POST(
      makeRequest({
        items: [{ productId: 11, quantity: 1, price: "0.01" }],
        country: "DE",
      }) as never,
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.package).toEqual({ weight: 0.4, length: 20, width: 10, height: 3 });
    expect(data.subtotal).toBe(19.9);
    expect(data.rates).toHaveLength(1);
    expect(data.rates[0]).toMatchObject({
      id: "dhl_kleinpaket",
      price: 3.99,
      dhlProduct: "V62WP",
    });
    expect(data.freeShippingThreshold).toBe(50);
  });

  it("uses the selected WooCommerce variation price", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        id: 20, name: "Variable sign", type: "variable", status: "publish", price: "10.00",
        variations: [21], stock_status: "instock", meta_data: [], weight: "0.2",
        dimensions: { length: "10", width: "10", height: "2" },
      }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        id: 21, price: "27.50", stock_status: "instock", weight: "0.3",
        dimensions: { length: "12", width: "10", height: "2" }, attributes: [],
      }) });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/shipping/calculate/route");
    const res = await POST(makeRequest({ items: [{ productId: 20, variationId: 21, quantity: 2, price: "0.01" }], country: "DE" }) as never);
    expect(res.status).toBe(200);
    expect((await res.json()).subtotal).toBe(55);
  });

  it("adds active text and checkbox personalization prices on the server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 30, name: "Personalized product", type: "simple", status: "publish", price: "50.00",
        stock_status: "instock", weight: "0.2", dimensions: { length: "10", width: "10", height: "2" },
        meta_data: [{
          key: "_kubikart_custom_fields",
          value: { fields: [
            { id: "motif", label: "Motif", type: "text", price: "5.00" },
            { id: "packaging", label: "Packaging", type: "checkbox", price: "2.50" },
          ] },
        }],
      }),
    }));
    const { POST } = await import("@/app/api/shipping/calculate/route");
    const res = await POST(makeRequest({
      items: [{ productId: 30, quantity: 1, customizations: { motif: "Mountain", packaging: "true" } }],
      country: "DE",
    }) as never);
    expect(res.status).toBe(200);
    expect((await res.json()).subtotal).toBe(57.5);
  });

  it("authoritatively totals the cutting-board configuration at EUR 74.90", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 83, name: "Graviertes Holz-Schneidebrett", type: "simple", status: "publish", price: "44.90",
        stock_status: "instock", weight: "0.5", dimensions: { length: "30", width: "20", height: "2" },
        meta_data: [{ key: "_kubikart_custom_fields", value: { fields: [
          { id: "engraving_text", label: "Gravurtext", type: "text", required: true, price: 10 },
          { id: "font", label: "Schriftart", type: "select", required: true, price: 10, options: [{ label: "Modern", value: "modern" }] },
          { id: "motif", label: "Motiv", type: "select", required: true, price: 10, options: [{ label: "Stern", value: "star" }] },
        ] } }],
      }),
    }));
    const { POST } = await import("@/app/api/shipping/calculate/route");
    const response = await POST(makeRequest({
      items: [{ productId: 83, quantity: 1, customizations: { engraving_text: "Raza", font: "modern", motif: "star" } }],
      country: "DE",
    }) as never);
    expect(response.status).toBe(200);
    expect((await response.json()).subtotal).toBe(74.9);
  });

  it("fails closed when WooCommerce product lookup fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const { POST } = await import("@/app/api/shipping/calculate/route");
    const res = await POST(
      makeRequest({
        items: [{ productId: 99, quantity: 2 }],
        country: "AT",
      }) as never,
    );

    expect(res.status).toBe(500);
  });
});
