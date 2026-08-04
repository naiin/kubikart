import { beforeEach, describe, expect, it, vi } from "vitest";

const wcApi = vi.hoisted(() => vi.fn());
const sendOrderStatusUpdate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/woocommerce", () => ({ wcApi }));
vi.mock("@/lib/email", () => ({ sendOrderStatusUpdate }));

const baseOrder = {
  id: 321,
  status: "processing",
  billing: { email: "buyer@example.test", first_name: "Erika", last_name: "Muster" },
  meta_data: [{ id: 1, key: "locale", value: "de" }],
};

beforeEach(() => {
  vi.resetModules();
  wcApi.mockReset();
  sendOrderStatusUpdate.mockReset();
});

describe("durable paid-order email delivery", () => {
  it("records sending only after submission succeeds", async () => {
    wcApi.mockResolvedValueOnce(baseOrder).mockResolvedValue({ id: 321 });
    sendOrderStatusUpdate.mockResolvedValue(undefined);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).resolves.toEqual({ sent: true });
    expect(sendOrderStatusUpdate).toHaveBeenCalledTimes(1);
    expect(wcApi).toHaveBeenCalledTimes(3);
    expect(wcApi.mock.calls[1][1].body.meta_data).toContainEqual(expect.objectContaining({ key: "_kubikart_payment_email_status", value: "sending" }));
    expect(wcApi.mock.calls[2][1].body.meta_data).toContainEqual(expect.objectContaining({ key: "_kubikart_payment_email_status", value: "sent" }));
  });

  it("records a failed attempt and remains eligible for retry", async () => {
    wcApi.mockResolvedValueOnce(baseOrder).mockResolvedValue({ id: 321 });
    sendOrderStatusUpdate.mockRejectedValueOnce(new Error("Mailtrap unavailable"));
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).rejects.toThrow("Mailtrap unavailable");
    expect(wcApi.mock.calls[2][1].body.meta_data).toContainEqual(expect.objectContaining({ key: "_kubikart_payment_email_status", value: "failed" }));
  });

  it("retries a failed delivery for an already-paid order", async () => {
    const failedOrder = { ...baseOrder, meta_data: [...baseOrder.meta_data, { id: 2, key: "_kubikart_payment_email_status", value: "failed" }] };
    wcApi.mockResolvedValueOnce(failedOrder).mockResolvedValue({ id: 321 });
    sendOrderStatusUpdate.mockResolvedValue(undefined);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).resolves.toEqual({ sent: true });
    expect(sendOrderStatusUpdate).toHaveBeenCalledTimes(1);
  });

  it("does not resend after durable success", async () => {
    const sentOrder = { ...baseOrder, meta_data: [...baseOrder.meta_data, { id: 2, key: "_kubikart_payment_email_status", value: "sent" }] };
    wcApi.mockResolvedValueOnce(sentOrder);
    const { deliverWooOrderPaidEmail } = await import("@/lib/order-status-email");

    await expect(deliverWooOrderPaidEmail(321)).resolves.toEqual({ sent: false, reason: "already-sent" });
    expect(sendOrderStatusUpdate).not.toHaveBeenCalled();
    expect(wcApi).toHaveBeenCalledTimes(1);
  });
});
