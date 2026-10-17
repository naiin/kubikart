import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.hoisted(() => vi.fn());
const wcApi = vi.hoisted(() => vi.fn());
const markWooOrderPaid = vi.hoisted(() => vi.fn());
const deliverWooOrderPaidEmail = vi.hoisted(() => vi.fn());
const chargesRetrieve = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = { constructEvent };
    charges = { retrieve: chargesRetrieve };
  },
}));
vi.mock("@/lib/woocommerce", () => ({ wcApi }));
vi.mock("@/lib/payment-transition", () => ({ markWooOrderPaid }));
vi.mock("@/lib/order-status-email", () => ({ deliverWooOrderPaidEmail }));

function request() {
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "valid" },
    body: "raw",
  });
}

const failedEvent = { type: "payment_intent.payment_failed", data: { object: { id: "pi_1", metadata: { wc_order_id: "321" } } } };
const putCalls = () => wcApi.mock.calls.filter(([, options]) => options?.method === "PUT");

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  constructEvent.mockReset();
  wcApi.mockReset();
  chargesRetrieve.mockReset();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_only";
});

describe("Stripe webhook status transitions", () => {
  it("marks a pending order failed when the payment fails", async () => {
    constructEvent.mockReturnValue(failedEvent);
    wcApi.mockResolvedValueOnce({ id: 321, status: "pending" }).mockResolvedValue({});
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    expect((await POST(request() as never)).status).toBe(200);
    expect(putCalls()).toHaveLength(1);
    expect(putCalls()[0][1].body).toMatchObject({ status: "failed", transaction_id: "pi_1" });
  });

  it.each(["processing", "completed", "refunded"])("does not let a late failure event undo a %s order", async (status) => {
    constructEvent.mockReturnValue(failedEvent);
    wcApi.mockResolvedValueOnce({ id: 321, status });
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    expect((await POST(request() as never)).status).toBe(200);
    expect(putCalls()).toHaveLength(0);
  });

  it("refunds a paid order found by its transaction id", async () => {
    constructEvent.mockReturnValue({ type: "charge.refunded", data: { object: { payment_intent: "pi_1", amount: 500, amount_refunded: 500 } } });
    wcApi.mockResolvedValueOnce([{ id: 321, status: "processing", transaction_id: "pi_1" }]).mockResolvedValue({});
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    expect((await POST(request() as never)).status).toBe(200);
    expect(putCalls()[0][1].body).toMatchObject({ status: "refunded" });
  });

  it("ignores a refund when the fuzzy order search returns a different transaction", async () => {
    constructEvent.mockReturnValue({ type: "charge.refunded", data: { object: { payment_intent: "pi_1", amount: 500, amount_refunded: 500 } } });
    wcApi.mockResolvedValueOnce([{ id: 999, status: "processing", transaction_id: "pi_other" }]);
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    expect((await POST(request() as never)).status).toBe(200);
    expect(putCalls()).toHaveLength(0);
  });

  it("does not refund or hold an order that was never paid", async () => {
    constructEvent.mockReturnValue({ type: "charge.refunded", data: { object: { payment_intent: "pi_1", amount: 500, amount_refunded: 500 } } });
    wcApi.mockResolvedValueOnce([{ id: 321, status: "pending", transaction_id: "pi_1" }]);
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    expect((await POST(request() as never)).status).toBe(200);
    expect(putCalls()).toHaveLength(0);
  });

  it("puts a paid order on hold for a dispute and records a note", async () => {
    constructEvent.mockReturnValue({ type: "charge.dispute.created", data: { object: { charge: "ch_1" } } });
    chargesRetrieve.mockResolvedValue({ payment_intent: "pi_1" });
    wcApi.mockResolvedValueOnce([{ id: 321, status: "processing", transaction_id: "pi_1" }]).mockResolvedValue({});
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    expect((await POST(request() as never)).status).toBe(200);
    expect(putCalls()[0][1].body).toMatchObject({ status: "on-hold" });
    expect(wcApi.mock.calls.some(([path]) => String(path).endsWith("/notes"))).toBe(true);
  });

  it("does not write the signed payload to the logs when verification fails", async () => {
    const error = Object.assign(new Error("No signatures found matching the expected signature for payload"), { payload: "sk_secret_payload_marker" });
    constructEvent.mockImplementation(() => { throw error; });
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { POST } = await import("@/app/api/webhooks/stripe/route");

    expect((await POST(request() as never)).status).toBe(400);
    expect(JSON.stringify(logged.mock.calls)).not.toContain("sk_secret_payload_marker");
  });
});
