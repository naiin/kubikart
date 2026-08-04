import { NextRequest, NextResponse } from "next/server";
import { markWooOrderPaid, PaymentTransitionError } from "@/lib/payment-transition";
import { sendWooOrderStatusEmail } from "@/lib/order-status-email";

const PAYPAL_BASE = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || "";

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64")}`,
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
    const { orderID } = await request.json();

    if (!orderID) {
      return NextResponse.json({ error: "Missing orderID" }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("PayPal capture error:", err);
      return NextResponse.json({ error: "Failed to capture PayPal order" }, { status: 500 });
    }

    const data = await res.json();
    const purchaseUnit = data.purchase_units?.[0];
    const wcOrderId = Number(purchaseUnit?.custom_id);
    if (data.status === "COMPLETED" && Number.isInteger(wcOrderId) && wcOrderId > 0) {
      const capture = purchaseUnit?.payments?.captures?.find((entry: { status?: string }) => entry.status === "COMPLETED");
      const paidAmount = capture?.amount || purchaseUnit?.amount;
      const transition = await markWooOrderPaid({
        orderId: wcOrderId,
        transactionId: data.id,
        amountCents: Math.round(Number(paidAmount?.value) * 100),
        currency: String(paidAmount?.currency_code || ""),
        paymentMethod: "ppcp-gateway",
        paymentMethodTitle: "PayPal",
        additionalData: {
          ...(data.payer ? {
            billing: {
              first_name: data.payer.name?.given_name || "",
              last_name: data.payer.name?.surname || "",
              email: data.payer.email_address || "",
            },
          } : {}),
          ...(purchaseUnit?.shipping ? {
            shipping: {
              first_name: purchaseUnit.shipping.name?.full_name?.split(" ")[0] || "",
              last_name: purchaseUnit.shipping.name?.full_name?.split(" ").slice(1).join(" ") || "",
              address_1: purchaseUnit.shipping.address?.address_line_1 || "",
              city: purchaseUnit.shipping.address?.admin_area_2 || "",
              postcode: purchaseUnit.shipping.address?.postal_code || "",
              country: purchaseUnit.shipping.address?.country_code || "",
            },
          } : {}),
        },
      });
      if (transition.changed) await sendWooOrderStatusEmail(wcOrderId);
    }
    return NextResponse.json({
      status: data.status,
      id: data.id,
      payer: data.payer,
    });
  } catch (error) {
    if (error instanceof PaymentTransitionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("PayPal capture error:", error);
    return NextResponse.json({ error: "Failed to capture PayPal order" }, { status: 500 });
  }
}
