import "server-only";

import { sendOrderStatusUpdate } from "@/lib/email";
import { wcApi } from "@/lib/woocommerce";

export async function sendWooOrderStatusEmail(orderId: number) {
  const order = await wcApi<{
    id: number;
    status: string;
    billing?: { email?: string; first_name?: string; last_name?: string };
    meta_data?: Array<{ key: string; value: unknown }>;
  }>(`orders/${orderId}`, { revalidate: 0 });
  const email = order.billing?.email;
  if (!email) return;
  const localeMeta = order.meta_data?.find((item) => item.key === "locale")?.value;
  const locale = String(localeMeta || "de").startsWith("en") ? "en" : "de";
  const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() || "Kunde";
  await sendOrderStatusUpdate(email, {
    orderId: order.id,
    orderNumber: `#${order.id}`,
    status: order.status,
    customerName,
  }, locale);
}
