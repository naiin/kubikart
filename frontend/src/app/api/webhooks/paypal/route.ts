import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import { markWooOrderPaid } from "@/lib/payment-transition";
import { deliverWooOrderPaidEmail } from "@/lib/order-status-email";
import { requireRuntimeEnv, requireRuntimeEnvPair } from "@/lib/runtime-config";

const PAYPAL_BASE = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
async function getPayPalAccessToken(): Promise<string> {
  const [clientId, secret] = requireRuntimeEnvPair("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "PAYPAL_SECRET");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function verifyPayPalWebhook(request: NextRequest, rawBody: string): Promise<boolean> {
  let webhookId: string;
  try {
    webhookId = requireRuntimeEnv("PAYPAL_WEBHOOK_ID");
  } catch {
    console.error("[PayPal] PAYPAL_WEBHOOK_ID is not configured");
    return false;
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
        webhook_id: webhookId,
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
        const wcOrderId = Number(event.resource.custom_id);
        if (orderId && wcOrderId) {
          await markWooOrderPaid({
            orderId: wcOrderId, transactionId: orderId,
            amountCents: Math.round(Number(event.resource.amount?.value) * 100),
            currency: String(event.resource.amount?.currency_code || ""),
            paymentMethod: "ppcp-gateway", paymentMethodTitle: "PayPal",
          });
          await deliverWooOrderPaidEmail(wcOrderId);
        }
        break;
      }
      case "PAYMENT.CAPTURE.REFUNDED": {
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          await handleRefundByTransaction(
            orderId,
            Number(event.resource.amount?.value),
            String(event.resource.amount?.currency_code || ""),
          );
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
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleRefundByTransaction(transactionId: string, refundedAmount: number, currency: string) {
  const order = (await wcApi<Array<{ id: number; status: string; total: string; currency: string }>>("orders", {
    params: { search: transactionId, per_page: 1 },
    revalidate: 0,
  }))[0];
  if (!order) {
    console.warn(`No WC order found for refunded PayPal transaction: ${transactionId}`);
    return;
  }

  const orderCents = Math.round(Number(order.total) * 100);
  const refundCents = Math.round(refundedAmount * 100);
  if (Number.isSafeInteger(refundCents) && refundCents > 0 && refundCents === orderCents && currency.toUpperCase() === order.currency) {
    await updateOrderByTransaction(transactionId, "refunded", undefined, order.id);
    return;
  }

  await wcApi(`orders/${order.id}/notes`, {
    method: "POST",
    body: {
      note: "PayPal reported a partial or currency-mismatched refund. Reconcile the refund manually in WooCommerce and PayPal.",
      customer_note: false,
    },
  });
}

async function updateOrderByTransaction(transactionId: string, status: string, note?: string, boundOrderId?: number) {
  const order = Number.isInteger(boundOrderId) && Number(boundOrderId) > 0
    ? await wcApi<{ id: number; status: string }>(`orders/${boundOrderId}`, { revalidate: 0 })
    : (await wcApi<Array<{ id: number; status: string }>>("orders", { params: { search: transactionId, per_page: 1 } }))[0];
  if (!order) return console.warn(`No WC order found for transaction: ${transactionId}`);
  const previousStatus = order.status;
  if (previousStatus === status) return;
  await wcApi(`orders/${order.id}`, {
    method: "PUT",
    body: {
      status,
      transaction_id: transactionId,
      payment_method: "ppcp-gateway",
      payment_method_title: "PayPal",
      ...(status === "processing" ? { set_paid: true } : {}),
    },
  });

  if (note) {
    await wcApi(`orders/${order.id}/notes`, {
      method: "POST",
      body: { note, customer_note: false },
    });
  }

}
