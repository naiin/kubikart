import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { serverCartErrorResponse } from "@/lib/server-cart";
import { verifyPendingPaymentOrder } from "@/lib/payment-order";
import { requireRuntimeEnv } from "@/lib/runtime-config";

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(requireRuntimeEnv("STRIPE_SECRET_KEY"), { apiVersion: "2026-05-27.dahlia" });
    const body = await request.json();
    const order = await verifyPendingPaymentOrder(body);
    if (order.totalCents < 50) {
      return NextResponse.json({ error: "Invalid amount (minimum 50 cents)" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: order.totalCents,
        currency: order.currency.toLowerCase(),
        payment_method_types: ["card", "klarna"],
        metadata: { pricing_source: "woocommerce_order", wc_order_id: String(order.id) },
      },
      { idempotencyKey: `wc-order-${order.id}` },
    );

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    const response = serverCartErrorResponse(error);
    if (response.status !== 500) return NextResponse.json({ error: response.message }, { status: response.status });
    console.error("Stripe PaymentIntent error:", error);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
