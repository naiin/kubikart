import { beforeEach, describe, expect, it, vi } from "vitest";

function makeRequest(body: object) {
  return new Request("http://localhost:3000/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/orders/create", () => {
  it("returns 400 when no items are provided", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/orders/create/route");
    const res = await POST(makeRequest({ items: [], payment_method: "stripe", payment_method_title: "Card" }) as never);
    expect(res.status).toBe(400);
  });

  it("creates a WooCommerce order with mapped line items and metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 321, status: "processing", total: "24.98" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/orders/create/route");
    const res = await POST(
      makeRequest({
        items: [
          {
            name: "Laser Keychain",
            product_id: 15,
            quantity: 2,
            price: "9.99",
            customizations: { engraving: "Max", material: "Oak" },
          },
        ],
        billing: { first_name: "Max", last_name: "Mustermann", email: "max@test.de" },
        shipping_lines: [{ method_id: "dhl_paket", method_title: "DHL Paket", total: "4.99" }],
        payment_method: "stripe",
        payment_method_title: "Kreditkarte",
        transaction_id: "pi_123",
        set_paid: true,
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/orders?");

    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.status).toBe("processing");
    expect(body.transaction_id).toBe("pi_123");
    expect(body.line_items).toEqual([
      {
        name: "Laser Keychain",
        product_id: 15,
        quantity: 2,
        total: "19.98",
        meta_data: [
          { key: "engraving", value: "Max" },
          { key: "material", value: "Oak" },
        ],
      },
    ]);
    expect(body.shipping_lines).toEqual([{ method_id: "dhl_paket", method_title: "DHL Paket", total: "4.99" }]);
  });

  it("returns 500 when WooCommerce order creation fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("WooCommerce unavailable")));
    const { POST } = await import("@/app/api/orders/create/route");
    const res = await POST(
      makeRequest({
        items: [{ name: "Acrylic Sign", quantity: 1, price: "12.00" }],
        payment_method: "paypal",
        payment_method_title: "PayPal",
      }) as never,
    );
    expect(res.status).toBe(500);
  });
});
