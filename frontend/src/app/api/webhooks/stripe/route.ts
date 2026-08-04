import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { wcApi } from "@/lib/woocommerce";
import { markWooOrderPaid } from "@/lib/payment-transition";
import { deliverWooOrderPaidEmail } from "@/lib/order-status-email";
import { requireRuntimeEnv } from "@/lib/runtime-config";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  let webhookSecret: string;
  let stripe: Stripe;

  try {
    webhookSecret = requireRuntimeEnv("STRIPE_WEBHOOK_SECRET");
    stripe = new Stripe(requireRuntimeEnv("STRIPE_SECRET_KEY"));
  } catch {
    return NextResponse.json({ error: "Webhook verification is not configured" }, { status: 503 });
  }

  if (!sig) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markWooOrderPaid({
          orderId: Number(pi.metadata.wc_order_id), transactionId: pi.id,
          amountCents: pi.amount_received || pi.amount, currency: pi.currency.toUpperCase(),
          paymentMethod: "stripe", paymentMethodTitle: "Stripe",
        });
        await deliverWooOrderPaidEmail(Number(pi.metadata.wc_order_id));
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await updateOrderStatus(pi.id, "failed", undefined, Number(pi.metadata.wc_order_id));
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = charge.payment_intent as string;
        if (charge.amount_refunded === charge.amount) {
          await updateOrderStatus(piId, "refunded");
        }
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = dispute.charge as string;
        const chargeObj = await stripe.charges.retrieve(chargeId);
        const piId = chargeObj.payment_intent as string;
        await updateOrderStatus(piId, "on-hold", "Stripe Dispute eröffnet");
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function updateOrderStatus(transactionId: string, status: string, note?: string, boundOrderId?: number) {
  const order = Number.isInteger(boundOrderId) && Number(boundOrderId) > 0
    ? await wcApi<{ id: number; status: string }>(`orders/${boundOrderId}`, { revalidate: 0 })
    : (await wcApi<Array<{ id: number; status: string }>>("orders", { params: { search: transactionId, per_page: 1 } }))[0];
  if (!order) return console.warn(`No WC order found for transaction: ${transactionId}`);
  const previousStatus = order.status;
  if (previousStatus === status) return;
  const updateData: Record<string, unknown> = {
    status,
    transaction_id: transactionId,
    payment_method: "stripe",
    payment_method_title: "Stripe",
    ...(status === "processing" ? { set_paid: true } : {}),
  };

  await wcApi(`orders/${order.id}`, {
    method: "PUT",
    body: updateData,
  });

  if (note) {
    await wcApi(`orders/${order.id}/notes`, {
      method: "POST",
      body: { note, customer_note: false },
    });
  }

}
