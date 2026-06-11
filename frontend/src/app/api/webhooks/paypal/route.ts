import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const event = JSON.parse(body);

  // Basic validation — in production, verify webhook signature with PayPal
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
}
