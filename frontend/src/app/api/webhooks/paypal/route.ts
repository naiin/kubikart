import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import { sendOrderStatusUpdate } from "@/lib/email";

const PAYPAL_BASE = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || "";
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "";

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function verifyPayPalWebhook(request: NextRequest, rawBody: string): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn("[PayPal] PAYPAL_WEBHOOK_ID not set — skipping signature verification");
    return true;
  }

  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionTime = request.headers.get("paypal-transmission-time");
  const certUrl = request.headers.get("paypal-cert-url");
  const transmissionSig = request.headers.get("paypal-transmission-sig");
  const authAlgo = request.headers.get("paypal-auth-algo");

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
    console.error("[PayPal] Missing webhook verification headers");
    return false;
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const verifyRes = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBody),
      }),
    });

    if (!verifyRes.ok) return false;
    const result = await verifyRes.json();
    return result.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[PayPal] Webhook verification failed:", err);
    return false;
  }
}

function extractTrackingUrl(metaData?: Array<{ key: string; value: unknown }>): string | undefined {
  if (!metaData || metaData.length === 0) {
    return undefined;
  }

  for (const item of metaData) {
    const key = item.key.toLowerCase();
    const value = item.value;

    if (typeof value === "string") {
      if (value.startsWith("http") && key.includes("tracking")) {
        return value;
      }

      if (key.includes("tracking_url") && value.startsWith("http")) {
        return value;
      }
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry && typeof entry === "object") {
          const trackingLink = (entry as Record<string, unknown>).tracking_link;
          if (typeof trackingLink === "string" && trackingLink.startsWith("http")) {
            return trackingLink;
          }
        }
      }
    }
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const isValid = await verifyPayPalWebhook(request, body);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  if (!event.event_type || !event.resource) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          await updateOrderByTransaction(orderId, "processing");
        }
        break;
      }
      case "PAYMENT.CAPTURE.REFUNDED": {
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          await updateOrderByTransaction(orderId, "refunded");
        }
        break;
      }
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED": {
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          await updateOrderByTransaction(orderId, "failed");
        }
        break;
      }
      case "CUSTOMER.DISPUTE.CREATED": {
        const transactionId = event.resource.disputed_transactions?.[0]?.seller_transaction_id;
        if (transactionId) {
          await updateOrderByTransaction(transactionId, "on-hold", "PayPal Dispute eröffnet");
        }
        break;
      }
    }
  } catch (err) {
    console.error("PayPal webhook processing error:", err);
  }

  return NextResponse.json({ received: true });
}

async function updateOrderByTransaction(transactionId: string, status: string, note?: string) {
  const orders = await wcApi<Array<{ id: number; status: string }>>("orders", {
    params: { search: transactionId, per_page: 1 },
  });

  if (!orders.length) {
    console.warn(`No WC order found for transaction: ${transactionId}`);
    return;
  }

  const order = orders[0];
  const previousStatus = order.status;
  await wcApi(`orders/${order.id}`, {
    method: "PUT",
    body: { status },
  });

  if (note) {
    await wcApi(`orders/${order.id}/notes`, {
      method: "POST",
      body: { note, customer_note: false },
    });
  }

  if (previousStatus === status) {
    return;
  }

  try {
    const fullOrder = await wcApi<{
      id: number;
      status: string;
      billing?: { email?: string; first_name?: string; last_name?: string };
      meta_data?: Array<{ key: string; value: unknown }>;
    }>(`orders/${order.id}`);

    const email = fullOrder.billing?.email;
    if (!email) {
      return;
    }

    const localeMeta = fullOrder.meta_data?.find((m) => m.key === "locale")?.value;
    const locale = String(localeMeta || "de").startsWith("en") ? "en" : "de";
    const customerName = `${fullOrder.billing?.first_name || ""} ${fullOrder.billing?.last_name || ""}`.trim() || "Kunde";
    const trackingUrl = extractTrackingUrl(fullOrder.meta_data);

    await sendOrderStatusUpdate(
      email,
      {
        orderId: fullOrder.id,
        orderNumber: `#${fullOrder.id}`,
        status: fullOrder.status,
        customerName,
        trackingUrl,
      },
      locale,
    );
  } catch (err) {
    console.error("Failed to send PayPal status update email:", err);
  }
}
