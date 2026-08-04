import { NextRequest, NextResponse } from "next/server";
import { serverCartErrorResponse } from "@/lib/server-cart";
import { verifyPendingPaymentOrder } from "@/lib/payment-order";
import { requireRuntimeEnvPair } from "@/lib/runtime-config";

const PAYPAL_BASE = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const [clientId, secret] = requireRuntimeEnvPair("NEXT_PUBLIC_PAYPAL_CLIENT_ID", "PAYPAL_SECRET");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pendingOrder = await verifyPendingPaymentOrder(body);

    const accessToken = await getAccessToken();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: String(pendingOrder.id),
          invoice_id: `WC-${pendingOrder.id}`,
          amount: {
            currency_code: pendingOrder.currency,
            value: (pendingOrder.totalCents / 100).toFixed(2),
          },
          description: `Kubikart order ${pendingOrder.id}`,
        },
      ],
    };

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `wc-order-${pendingOrder.id}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("PayPal create order error:", err);
      return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
    }

    const order = await res.json();
    return NextResponse.json({ id: order.id });
  } catch (error) {
    const response = serverCartErrorResponse(error);
    if (response.status !== 500) return NextResponse.json({ error: response.message }, { status: response.status });
    console.error("PayPal create order error:", error);
    return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
  }
}
