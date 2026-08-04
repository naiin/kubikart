import "server-only";

import { ServerCartError } from "@/lib/server-cart";
import { wcApi } from "@/lib/woocommerce";

interface PendingOrderReference {
  orderId?: number;
  orderKey?: string;
}

interface WCPaymentOrder {
  id: number;
  order_key: string;
  status: string;
  total: string;
  currency: string;
}

export async function verifyPendingPaymentOrder(reference: PendingOrderReference) {
  if (!Number.isInteger(reference.orderId) || Number(reference.orderId) <= 0 || !reference.orderKey) {
    throw new ServerCartError("Missing pending order reference");
  }

  const order = await wcApi<WCPaymentOrder>(`orders/${reference.orderId}`, { revalidate: 0 });
  if (order.order_key !== reference.orderKey) throw new ServerCartError("Invalid pending order reference", 403);
  if (order.status !== "pending") throw new ServerCartError("Order is no longer awaiting payment", 409);
  const totalCents = Math.round(Number(order.total) * 100);
  if (!/^[A-Z]{3}$/.test(order.currency) || !Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new ServerCartError("WooCommerce order has an invalid total or currency", 409);
  }
  return { ...order, totalCents };
}
