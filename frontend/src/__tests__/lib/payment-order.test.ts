import { beforeEach, describe, expect, it, vi } from "vitest";
beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("verifyPendingPaymentOrder", () => {
  it("accepts the matching unpaid WooCommerce order", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 321, order_key: "wc_order_secret", status: "pending", total: "23.97", currency: "EUR" }),
    }));
    const { verifyPendingPaymentOrder } = await import("@/lib/payment-order");
    await expect(verifyPendingPaymentOrder({ orderId: 321, orderKey: "wc_order_secret" })).resolves.toMatchObject({ id: 321, totalCents: 2397 });
  });

  it("rejects an incorrect order key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 321, order_key: "wc_order_secret", status: "pending", total: "23.97", currency: "EUR" }),
    }));
    const { verifyPendingPaymentOrder } = await import("@/lib/payment-order");
    await expect(verifyPendingPaymentOrder({ orderId: 321, orderKey: "wrong" })).rejects.toMatchObject({ status: 403 });
  });

  it("rejects an invalid stored total", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 321, order_key: "wc_order_secret", status: "pending", total: "not-a-price", currency: "EUR" }),
    }));
    const { verifyPendingPaymentOrder } = await import("@/lib/payment-order");
    await expect(verifyPendingPaymentOrder({ orderId: 321, orderKey: "wc_order_secret" })).rejects.toMatchObject({ status: 409 });
  });
});
