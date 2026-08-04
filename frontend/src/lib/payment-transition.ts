import "server-only";

import { wcApi } from "@/lib/woocommerce";

export class PaymentTransitionError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
    this.name = "PaymentTransitionError";
  }
}

interface PaymentOrder {
  id: number;
  status: string;
  total: string;
  currency: string;
  transaction_id?: string;
}

export async function markWooOrderPaid(input: {
  orderId: number;
  transactionId: string;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  paymentMethodTitle: string;
  additionalData?: Record<string, unknown>;
}) {
  if (!Number.isInteger(input.orderId) || input.orderId <= 0 || !input.transactionId) {
    throw new PaymentTransitionError("Payment is not bound to a valid WooCommerce order", 400);
  }
  const order = await wcApi<PaymentOrder>(`orders/${input.orderId}`, { revalidate: 0 });
  const expectedCents = Math.round(Number(order.total) * 100);
  if (!Number.isSafeInteger(expectedCents) || expectedCents !== input.amountCents || order.currency !== input.currency.toUpperCase()) {
    throw new PaymentTransitionError("Confirmed payment amount does not match the WooCommerce order");
  }
  if (["processing", "completed"].includes(order.status)) {
    if (order.transaction_id === input.transactionId) return { order, changed: false };
    throw new PaymentTransitionError("WooCommerce order is already paid by another transaction");
  }
  if (order.status !== "pending" && order.status !== "failed") {
    throw new PaymentTransitionError(`WooCommerce order cannot be paid from status ${order.status}`);
  }
  const updated = await wcApi<PaymentOrder>(`orders/${order.id}`, {
    method: "PUT",
    body: {
      status: "processing",
      set_paid: true,
      transaction_id: input.transactionId,
      payment_method: input.paymentMethod,
      payment_method_title: input.paymentMethodTitle,
      ...(input.additionalData || {}),
    },
  });
  return { order: updated, changed: true };
}
