import "server-only";

import { sendOrderStatusUpdate } from "@/lib/email";
import { wcApi } from "@/lib/woocommerce";

const EMAIL_STATUS_KEY = "_kubikart_payment_email_status";
const EMAIL_ATTEMPTED_AT_KEY = "_kubikart_payment_email_attempted_at";
const EMAIL_SENT_AT_KEY = "_kubikart_payment_email_sent_at";
const EMAIL_ERROR_KEY = "_kubikart_payment_email_last_error";
const SENDING_LEASE_MS = 5 * 60_000;

type OrderMeta = { id?: number; key: string; value: unknown };
type PaymentEmailOrder = {
  id: number;
  status: string;
  billing?: { email?: string; first_name?: string; last_name?: string };
  meta_data?: OrderMeta[];
};

function metaValue(meta: OrderMeta[], key: string): string {
  return String(meta.find((item) => item.key === key)?.value || "");
}

function metaUpdate(meta: OrderMeta[], key: string, value: unknown): OrderMeta {
  const existing = meta.find((item) => item.key === key);
  return { ...(existing?.id ? { id: existing.id } : {}), key, value };
}

async function updateEmailState(order: PaymentEmailOrder, values: Record<string, unknown>) {
  const meta = order.meta_data || [];
  return wcApi<PaymentEmailOrder>(`orders/${order.id}`, {
    method: "PUT",
    body: { meta_data: Object.entries(values).map(([key, value]) => metaUpdate(meta, key, value)) },
  });
}

/**
 * Delivers the paid-order customer email independently from the payment state.
 * WooCommerce metadata is the durable retry marker. The short `sending` lease
 * reduces normal duplicate delivery while allowing recovery after a crashed request.
 */
export async function deliverWooOrderPaidEmail(orderId: number): Promise<{ sent: boolean; reason?: string }> {
  const order = await wcApi<PaymentEmailOrder>(`orders/${orderId}`, { revalidate: 0 });
  const meta = order.meta_data || [];
  const state = metaValue(meta, EMAIL_STATUS_KEY);
  if (state === "sent") return { sent: false, reason: "already-sent" };

  const attemptedAt = Date.parse(metaValue(meta, EMAIL_ATTEMPTED_AT_KEY));
  if (state === "sending" && Number.isFinite(attemptedAt) && Date.now() - attemptedAt < SENDING_LEASE_MS) {
    return { sent: false, reason: "delivery-in-progress" };
  }

  const attemptedAtIso = new Date().toISOString();
  const stateOrder = await updateEmailState(order, {
    [EMAIL_STATUS_KEY]: "sending",
    [EMAIL_ATTEMPTED_AT_KEY]: attemptedAtIso,
    [EMAIL_ERROR_KEY]: "",
  });

  try {
    const email = order.billing?.email;
    if (!email) throw new Error("Paid order has no billing email");
    const localeMeta = meta.find((item) => item.key === "locale")?.value;
    const locale = String(localeMeta || "de").startsWith("en") ? "en" : "de";
    const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() || "Kunde";

    await sendOrderStatusUpdate(email, {
      orderId: order.id,
      orderNumber: `#${order.id}`,
      status: order.status,
      customerName,
    }, locale);

    await updateEmailState(stateOrder, {
      [EMAIL_STATUS_KEY]: "sent",
      [EMAIL_SENT_AT_KEY]: new Date().toISOString(),
      [EMAIL_ERROR_KEY]: "",
    });
    return { sent: true };
  } catch (error) {
    try {
      await updateEmailState(stateOrder, {
        [EMAIL_STATUS_KEY]: "failed",
        [EMAIL_ERROR_KEY]: error instanceof Error ? error.name : "EmailDeliveryError",
      });
    } catch {
      console.error("Failed to persist paid-order email failure state", { orderId });
    }
    throw error;
  }
}

export const PAYMENT_EMAIL_META_KEYS = {
  status: EMAIL_STATUS_KEY,
  attemptedAt: EMAIL_ATTEMPTED_AT_KEY,
  sentAt: EMAIL_SENT_AT_KEY,
  lastError: EMAIL_ERROR_KEY,
} as const;
