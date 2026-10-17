import { beforeEach, describe, expect, it, vi } from "vitest";

const wcApi = vi.hoisted(() => vi.fn());
const sendOrderConfirmation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/woocommerce", () => ({ wcApi }));
vi.mock("@/lib/email", () => ({ sendOrderConfirmation }));

const baseOrder = {
  id: 321,
  status: "processing",
  number: "321",
  total: "35.00",
  line_items: [{ name: "Audit product", quantity: 1, price: 35 }],
  shipping: { address_1: "Teststrasse 1", city: "Blaustein", postcode: "89134" },
  billing: { email: "buyer@example.test", first_name: "Erika", last_name: "Muster" },
  meta_data: [{ id: 1, key: "locale", value: "de" }],
};

beforeEach(() => {
  vi.resetModules();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  wcApi.mockReset();
  sendOrderConfirmation.mockReset();
});

describe("durable paid-order email delivery", () => {
  it("records sending only after submission succeeds", async () => {
    wcApi.mockResolvedValueOnce(baseOrder).mockResolvedValue({ id: 321 });
    sendOrderConfirmation.mockResolvedValue(undefined);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).resolves.toEqual({ sent: true });
    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(sendOrderConfirmation).toHaveBeenCalledWith("buyer@example.test", expect.objectContaining({
      orderId: 321,
      total: "35.00",
      items: [{ name: "Audit product", quantity: 1, price: "35" }],
      shipping: { address: "Teststrasse 1", city: "Blaustein", postalCode: "89134" },
    }), "de");
    expect(wcApi).toHaveBeenCalledTimes(3);
    expect(wcApi.mock.calls[1][1].body.meta_data).toContainEqual(expect.objectContaining({ key: "_kubikart_payment_email_status", value: "sending" }));
    expect(wcApi.mock.calls[2][1].body.meta_data).toContainEqual(expect.objectContaining({ key: "_kubikart_payment_email_status", value: "sent" }));
  });

  it("records a failed attempt and remains eligible for retry", async () => {
    wcApi.mockResolvedValueOnce(baseOrder).mockResolvedValue({ id: 321 });
    sendOrderConfirmation.mockRejectedValueOnce(new Error("Mailtrap unavailable"));
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).rejects.toThrow("Mailtrap unavailable");
    expect(wcApi.mock.calls[2][1].body.meta_data).toContainEqual(expect.objectContaining({ key: "_kubikart_payment_email_status", value: "failed" }));
  });

  it("retries a failed delivery for an already-paid order", async () => {
    const failedOrder = { ...baseOrder, meta_data: [...baseOrder.meta_data, { id: 2, key: "_kubikart_payment_email_status", value: "failed" }] };
    wcApi.mockResolvedValueOnce(failedOrder).mockResolvedValue({ id: 321 });
    sendOrderConfirmation.mockResolvedValue(undefined);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).resolves.toEqual({ sent: true });
    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  it("does not resend after durable success", async () => {
    const sentOrder = { ...baseOrder, meta_data: [...baseOrder.meta_data, { id: 2, key: "_kubikart_payment_email_status", value: "sent" }] };
    wcApi.mockResolvedValueOnce(sentOrder);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).resolves.toEqual({ sent: false, reason: "already-sent" });
    expect(sendOrderConfirmation).not.toHaveBeenCalled();
    expect(wcApi).toHaveBeenCalledTimes(1);
  });

  it("sends one email when the same paid event is delivered concurrently", async () => {
    let state = "pending";
    wcApi.mockImplementation(async (_path: string, options?: { method?: string; body?: { meta_data?: Array<{ key: string; value: string }> } }) => {
      if (options?.method === "PUT") {
        const next = options.body?.meta_data?.find((item) => item.key === "_kubikart_payment_email_status")?.value;
        if (next) state = next;
        return { ...baseOrder, meta_data: [...baseOrder.meta_data, { key: "_kubikart_payment_email_status", value: state }] };
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { ...baseOrder, meta_data: [...baseOrder.meta_data, { key: "_kubikart_payment_email_status", value: state }] };
    });
    sendOrderConfirmation.mockResolvedValue(undefined);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    const results = await Promise.all(Array.from({ length: 6 }, () => deliverWooOrderPaidEmail(321)));

    expect(sendOrderConfirmation).toHaveBeenCalledTimes(1);
    expect(results.filter((result) => result.sent)).toHaveLength(1);
  });

  it("releases the claim after a failed send so a retry can deliver", async () => {
    wcApi.mockResolvedValue({ ...baseOrder });
    sendOrderConfirmation.mockRejectedValueOnce(new Error("Mailtrap unavailable")).mockResolvedValueOnce(undefined);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).rejects.toThrow("Mailtrap unavailable");
    await expect(deliverWooOrderPaidEmail(321)).resolves.toEqual({ sent: true });
  });
});
