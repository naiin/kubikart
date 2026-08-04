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
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        id: 15, name: "Laser Keychain", type: "simple", status: "publish", price: "9.99",
        stock_status: "instock", meta_data: [], weight: "0.2", dimensions: { length: "10", width: "5", height: "2" },
      }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 321, order_key: "wc_order_test", status: "pending", total: "23.97" }) });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/orders/create/route");
    const res = await POST(
      makeRequest({
        items: [
          {
            productId: 15,
            quantity: 2,
          },
        ],
        billing: { first_name: "Max", last_name: "Mustermann", email: "max@test.de" },
        shippingMethodId: "dhl_kleinpaket",
        payment_method: "stripe",
        payment_method_title: "Kreditkarte",
      }) as never,
    );

    expect(res.status).toBe(200);
    await expect(res.clone().json()).resolves.toMatchObject({ id: 321, orderKey: "wc_order_test", status: "pending" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [url, options] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/orders");
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: expect.stringMatching(/^Basic /),
    });

    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.meta_data).toEqual(expect.arrayContaining([
      { key: "_kubikart_transactional_email_owner", value: "mailtrap" },
      { key: "_kubikart_payment_email_status", value: "pending" },
    ]));
    expect(body.status).toBe("pending");
    expect(body.set_paid).toBe(false);
    expect(body.transaction_id).toBeUndefined();
    expect(body.line_items).toEqual([
      {
        product_id: 15,
        quantity: 2,
        subtotal: "19.98",
        total: "19.98",
      },
    ]);
    expect(body.shipping_lines).toEqual([{ method_id: "dhl_kleinpaket", method_title: "DHL Kleinpaket", total: "3.99" }]);
  });

  it("returns 500 when WooCommerce order creation fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("WooCommerce unavailable")));
    const { POST } = await import("@/app/api/orders/create/route");
    const res = await POST(
      makeRequest({
        items: [{ productId: 12, quantity: 1 }],
        billing: { email: "test@example.com" },
        payment_method: "paypal",
        payment_method_title: "PayPal",
      }) as never,
    );
    expect(res.status).toBe(500);
  });
});
