import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.hoisted(() => vi.fn());
const markWooOrderPaid = vi.hoisted(() => vi.fn());
const deliverWooOrderPaidEmail = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = { constructEvent };
    charges = { retrieve: vi.fn() };
  },
}));
vi.mock("@/lib/payment-transition", () => ({
  markWooOrderPaid,
  PaymentTransitionError: class PaymentTransitionError extends Error {
    constructor(message: string, readonly status = 409) {
      super(message);
    }
  },
}));
vi.mock("@/lib/order-status-email", () => ({ deliverWooOrderPaidEmail }));

function request(signature = "valid") {
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: "provider-raw-body",
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  constructEvent.mockReset();
  markWooOrderPaid.mockReset();
  deliverWooOrderPaidEmail.mockReset();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_only";
  process.env.PAYPAL_WEBHOOK_ID = "paypal-webhook-test-id";
});

describe("Stripe webhook payment and email boundaries", () => {
  it("delivers the email after a verified matching payment", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_1", amount: 5750, amount_received: 5750, currency: "eur", metadata: { wc_order_id: "321" } } },
    });
    markWooOrderPaid.mockResolvedValue({ changed: true });
    deliverWooOrderPaidEmail.mockResolvedValue({ sent: true });
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const response = await POST(request() as never);
    expect(response.status).toBe(200);
    expect(markWooOrderPaid).toHaveBeenCalledTimes(1);
    expect(deliverWooOrderPaidEmail).toHaveBeenCalledWith(321);
  });

  it("lets a verified replay retry durable email delivery without another payment update", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_1", amount: 5750, amount_received: 5750, currency: "eur", metadata: { wc_order_id: "321" } } },
    });
    markWooOrderPaid.mockResolvedValue({ changed: false });
    deliverWooOrderPaidEmail.mockResolvedValue({ sent: false, reason: "already-sent" });
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    const response = await POST(request() as never);
    expect(response.status).toBe(200);
    expect(deliverWooOrderPaidEmail).toHaveBeenCalledWith(321);
  });

  it("does not transition or email an invalid signature", async () => {
    constructEvent.mockImplementation(() => { throw new Error("bad signature"); });
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const response = await POST(request("invalid") as never);
    expect(response.status).toBe(400);
    expect(markWooOrderPaid).not.toHaveBeenCalled();
    expect(deliverWooOrderPaidEmail).not.toHaveBeenCalled();
  });

  it("fails closed when the Stripe webhook secret is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const response = await POST(request() as never);
    expect(response.status).toBe(503);
    expect(constructEvent).not.toHaveBeenCalled();
    expect(deliverWooOrderPaidEmail).not.toHaveBeenCalled();
  });

  it.each(["amount", "currency"])("does not email when the %s check fails", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_bad", amount: 1, amount_received: 1, currency: "usd", metadata: { wc_order_id: "321" } } },
    });
    markWooOrderPaid.mockRejectedValue(new Error("Confirmed payment amount does not match"));
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const response = await POST(request() as never);
    expect(response.status).toBe(500);
    expect(deliverWooOrderPaidEmail).not.toHaveBeenCalled();
  });
});

describe("PayPal webhook configuration", () => {
  it("fails closed when PAYPAL_WEBHOOK_ID is missing", async () => {
    delete process.env.PAYPAL_WEBHOOK_ID;
    const { POST } = await import("@/app/api/webhooks/paypal/route");
    const response = await POST(new Request("http://localhost:3000/api/webhooks/paypal", { method: "POST", body: "{}" }) as never);
    expect(response.status).toBe(401);
    expect(markWooOrderPaid).not.toHaveBeenCalled();
    expect(deliverWooOrderPaidEmail).not.toHaveBeenCalled();
  });

  it("rejects a webhook when PayPal verification fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "sandbox-token" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ verification_status: "FAILURE" }) });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/webhooks/paypal/route");
    const response = await POST(new Request("http://localhost:3000/api/webhooks/paypal", {
      method: "POST",
      headers: {
        "paypal-transmission-id": "transmission-id",
        "paypal-transmission-time": "2026-08-04T10:00:00Z",
        "paypal-cert-url": "https://api-m.sandbox.paypal.com/cert",
        "paypal-transmission-sig": "invalid",
        "paypal-auth-algo": "SHA256withRSA",
      },
      body: JSON.stringify({ event_type: "PAYMENT.CAPTURE.COMPLETED", resource: {} }),
    }) as never);
    expect(response.status).toBe(401);
    expect(markWooOrderPaid).not.toHaveBeenCalled();
    expect(deliverWooOrderPaidEmail).not.toHaveBeenCalled();
  });

  it("updates and checks durable email state for a verified completed capture", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "sandbox-token" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ verification_status: "SUCCESS" }) }));
    markWooOrderPaid.mockResolvedValue({ changed: false });
    deliverWooOrderPaidEmail.mockResolvedValue({ sent: false, reason: "already-sent" });
    const { POST } = await import("@/app/api/webhooks/paypal/route");
    const response = await POST(new Request("http://localhost:3000/api/webhooks/paypal", {
      method: "POST",
      headers: {
        "paypal-transmission-id": "transmission-id",
        "paypal-transmission-time": "2026-08-04T10:00:00Z",
        "paypal-cert-url": "https://api-m.sandbox.paypal.com/cert",
        "paypal-transmission-sig": "signature",
        "paypal-auth-algo": "SHA256withRSA",
      },
      body: JSON.stringify({
        event_type: "PAYMENT.CAPTURE.COMPLETED",
        resource: {
          custom_id: "321",
          amount: { value: "57.50", currency_code: "EUR" },
          supplementary_data: { related_ids: { order_id: "PAYPAL-ORDER-1" } },
        },
      }),
    }) as never);
    expect(response.status).toBe(200);
    expect(markWooOrderPaid).toHaveBeenCalledWith(expect.objectContaining({ orderId: 321, amountCents: 5750, currency: "EUR" }));
    expect(deliverWooOrderPaidEmail).toHaveBeenCalledWith(321);
  });
});

describe("PayPal confirmed capture", () => {
  it("marks a matching capture paid and delivers the durable email", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "sandbox-token" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "PAYPAL-ORDER-1",
          status: "COMPLETED",
          purchase_units: [{ custom_id: "321", payments: { captures: [{ status: "COMPLETED", amount: { value: "57.50", currency_code: "EUR" } }] } }],
        }),
      }));
    markWooOrderPaid.mockResolvedValue({ changed: true });
    deliverWooOrderPaidEmail.mockResolvedValue({ sent: true });
    const { POST } = await import("@/app/api/paypal/capture-order/route");
    const response = await POST(new Request("http://localhost:3000/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderID: "PAYPAL-ORDER-1" }),
    }) as never);
    expect(response.status).toBe(200);
    expect(markWooOrderPaid).toHaveBeenCalledWith(expect.objectContaining({ orderId: 321, amountCents: 5750, currency: "EUR" }));
    expect(deliverWooOrderPaidEmail).toHaveBeenCalledWith(321);
  });

  it("does not send email when capture amount or currency validation fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "sandbox-token" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "PAYPAL-ORDER-1",
          status: "COMPLETED",
          purchase_units: [{ custom_id: "321", payments: { captures: [{ status: "COMPLETED", amount: { value: "1.00", currency_code: "USD" } }] } }],
        }),
      }));
    markWooOrderPaid.mockRejectedValue(new Error("Confirmed payment amount does not match"));
    const { POST } = await import("@/app/api/paypal/capture-order/route");
    const response = await POST(new Request("http://localhost:3000/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderID: "PAYPAL-ORDER-1" }),
    }) as never);
    expect(response.status).toBe(500);
    expect(deliverWooOrderPaidEmail).not.toHaveBeenCalled();
  });
});
