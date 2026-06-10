import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { wcApi } from "@/lib/woocommerce";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await updateOrderStatus(pi.id, "processing");
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await updateOrderStatus(pi.id, "failed");
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
  }

  return NextResponse.json({ received: true });
}

async function updateOrderStatus(transactionId: string, status: string, note?: string) {
  // Search for order by transaction ID
  const orders = await wcApi<Array<{ id: number; status: string }>>("orders", {
    params: { search: transactionId, per_page: 1 },
  });

  if (!orders.length) {
    console.warn(`No WC order found for transaction: ${transactionId}`);
    return;
  }

  const order = orders[0];
  const updateData: Record<string, unknown> = { status };

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
