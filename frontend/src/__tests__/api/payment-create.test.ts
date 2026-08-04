import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeCreate = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: class StripeMock {
    paymentIntents = { create: stripeCreate };
  },
}));

function request(path: string) {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: 321, orderKey: "wc_order_secret", amount: 1, currency: "USD" }),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  stripeCreate.mockReset();
});

describe("payment creation from WooCommerce order totals", () => {
  it("uses the stored WooCommerce total for Stripe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 321, order_key: "wc_order_secret", status: "pending", total: "57.50", currency: "EUR" }),
    }));
    stripeCreate.mockResolvedValue({ client_secret: "pi_secret" });

    const { POST } = await import("@/app/api/stripe/create-payment-intent/route");
    const response = await POST(request("/api/stripe/create-payment-intent") as never);

    expect(response.status).toBe(200);
    expect(stripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5750, currency: "eur" }),
      { idempotencyKey: "wc-order-321" },
    );
  });

  it("uses the stored WooCommerce total for PayPal", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 321, order_key: "wc_order_secret", status: "pending", total: "57.50", currency: "EUR" }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "paypal-token" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "PAYPAL-ORDER" }) });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/paypal/create-order/route");
    const response = await POST(request("/api/paypal/create-order") as never);

    expect(response.status).toBe(200);
    const paypalBody = JSON.parse(fetchMock.mock.calls[2][1].body as string);
    expect(paypalBody.purchase_units[0].amount).toEqual({ currency_code: "EUR", value: "57.50" });
  });
});
