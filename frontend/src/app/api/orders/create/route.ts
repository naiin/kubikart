import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import { sendOrderConfirmation } from "@/lib/email";

interface OrderItem {
  name: string;
  product_id?: number;
  quantity: number;
  price: string;
  customizations?: Record<string, string>;
}

interface CreateOrderBody {
  items: OrderItem[];
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address_1?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  shipping_lines?: {
    method_id: string;
    method_title: string;
    total: string;
  }[];
  payment_method: string;
  payment_method_title: string;
  transaction_id?: string;
  set_paid?: boolean;
}

export async function POST(request: NextRequest) {
  // Require either a valid auth token (logged-in user) or a billing email (guest checkout).
  // If a token is present, verify it encodes the claimed customer id.
  const authToken = request.headers.get("x-auth-token") ?? "";
  const customerId = request.headers.get("x-customer-id") ?? "";

  if (authToken && customerId) {
    try {
      const decoded = Buffer.from(authToken, "base64").toString("utf8");
      const [tokenCustomerId] = decoded.split(":");
      if (tokenCustomerId !== customerId) {
        return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
    }
  }

  try {
    const body: CreateOrderBody = await request.json();
    const acceptLang = request.headers.get("accept-language") ?? "";
    const locale = acceptLang.startsWith("en") ? "en" : "de";

    // Require a billing email so every order is traceable
    if (!body.billing?.email) {
      return NextResponse.json({ error: "Billing email is required" }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const lineItems = body.items.map((item) => {
      const lineItem: Record<string, unknown> = {
        name: item.name,
        quantity: item.quantity,
        total: (parseFloat(item.price) * item.quantity).toFixed(2),
      };

      if (item.product_id) {
        lineItem.product_id = item.product_id;
      }

      if (item.customizations && Object.keys(item.customizations).length > 0) {
        lineItem.meta_data = Object.entries(item.customizations).map(([key, value]) => ({
          key,
          value,
        }));
      }

      return lineItem;
    });

    const orderData: Record<string, unknown> = {
      status: body.set_paid ? "processing" : "pending",
      payment_method: body.payment_method,
      payment_method_title: body.payment_method_title,
      set_paid: body.set_paid ?? false,
      line_items: lineItems,
      meta_data: [{ key: "locale", value: locale }],
    };

    if (body.transaction_id) {
      orderData.transaction_id = body.transaction_id;
    }

    if (body.billing) {
      orderData.billing = body.billing;
    }

    if (body.shipping) {
      orderData.shipping = body.shipping;
    }

    if (body.shipping_lines && body.shipping_lines.length > 0) {
      orderData.shipping_lines = body.shipping_lines;
    }

    const order = await wcApi<{ id: number; status: string; total: string }>("orders", {
      method: "POST",
      body: orderData,
    });

    // Send order confirmation email
    if (body.billing?.email) {
      try {
        await sendOrderConfirmation(
          body.billing.email,
          {
            orderId: order.id,
            orderNumber: `#${order.id}`,
            total: order.total,
            items: body.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            customer: {
              name: `${body.billing.first_name || ""} ${body.billing.last_name || ""}`.trim(),
            },
            shipping: {
              address: body.shipping?.address_1 || "",
              city: body.shipping?.city || "",
              postalCode: body.shipping?.postcode || "",
            },
          },
          locale,
        );

        console.log(`[Order] Confirmation email sent to ${body.billing.email}`);
      } catch (err) {
        console.error("Failed to send order confirmation email:", err);
        // Don't fail the order creation if email fails
      }
    }

    return NextResponse.json({ id: order.id, status: order.status, total: order.total });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
