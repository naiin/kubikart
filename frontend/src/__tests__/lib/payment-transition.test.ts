import { beforeEach, describe, expect, it, vi } from "vitest";

const payment = {
  orderId: 321,
  transactionId: "pi_verified",
  amountCents: 5750,
  currency: "EUR",
  paymentMethod: "stripe",
  paymentMethodTitle: "Stripe",
};

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("verified payment transitions", () => {
  it("marks a matching pending order paid exactly once", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 321, status: "pending", total: "57.50", currency: "EUR" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 321, status: "processing", total: "57.50", currency: "EUR", transaction_id: "pi_verified" }) });
    vi.stubGlobal("fetch", fetchMock);
    const { markWooOrderPaid } = await import("@/lib/payment-transition");
    await expect(markWooOrderPaid(payment)).resolves.toMatchObject({ changed: true });
    const update = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(update).toMatchObject({ status: "processing", set_paid: true, transaction_id: "pi_verified" });
  });

  it("treats a duplicate verified webhook as an idempotent no-op", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 321, status: "processing", total: "57.50", currency: "EUR", transaction_id: "pi_verified" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { markWooOrderPaid } = await import("@/lib/payment-transition");
    await expect(markWooOrderPaid(payment)).resolves.toMatchObject({ changed: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a verified provider payment with a mismatched amount", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 321, status: "pending", total: "57.50", currency: "EUR" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { markWooOrderPaid } = await import("@/lib/payment-transition");
    await expect(markWooOrderPaid({ ...payment, amountCents: 100 })).rejects.toMatchObject({ status: 409 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
