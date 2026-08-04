import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import { getRequestSession } from "@/lib/auth-session";
import { calculateServerCart, serverCartErrorResponse } from "@/lib/server-cart";
import type { ServerCartItemInput } from "@/lib/cart-contract";

interface CreateOrderBody {
  items: ServerCartItemInput[];
  shippingMethodId?: string;
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
  payment_method: string;
  payment_method_title: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    const body: CreateOrderBody = await request.json();
    const acceptLang = request.headers.get("accept-language") ?? "";
    const locale = acceptLang.startsWith("en") ? "en" : "de";

    // PayPal Express supplies the customer address after approval.
    if (!body.billing?.email && body.payment_method !== "paypal-express") {
      return NextResponse.json({ error: "Billing email is required" }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const cart = await calculateServerCart({
      items: body.items,
      country: body.shipping?.country || body.billing?.country || "DE",
      shippingMethodId: body.shippingMethodId,
    });

    const lineItems = cart.lines.map((item) => {
      const lineItem: Record<string, unknown> = {
        product_id: item.productId,
        quantity: item.quantity,
        subtotal: (item.lineTotalCents / 100).toFixed(2),
        total: (item.lineTotalCents / 100).toFixed(2),
      };

      if (item.variationId) lineItem.variation_id = item.variationId;

      if (item.customizations && Object.keys(item.customizations).length > 0) {
        lineItem.meta_data = Object.entries(item.customizations).map(([key, value]) => ({
          key,
          value,
        }));
      }

      return lineItem;
    });

    const orderData: Record<string, unknown> = {
      status: "pending",
      payment_method: body.payment_method,
      payment_method_title: body.payment_method_title,
      set_paid: false,
      line_items: lineItems,
      meta_data: [{ key: "locale", value: locale }],
    };

    if (session) {
      orderData.customer_id = session.user.id;
    }

    if (body.billing) {
      orderData.billing = body.billing;
    }

    if (body.shipping) {
      orderData.shipping = body.shipping;
    }

    orderData.shipping_lines = [{
      method_id: cart.selectedRate.id,
      method_title: cart.selectedRate.name,
      total: (cart.shippingCents / 100).toFixed(2),
    }];

    const order = await wcApi<{ id: number; order_key: string; status: string; total: string }>("orders", {
      method: "POST",
      body: orderData,
    });

    return NextResponse.json({ id: order.id, orderKey: order.order_key, status: order.status, total: order.total });
  } catch (error) {
    const response = serverCartErrorResponse(error);
    if (response.status !== 500) return NextResponse.json({ error: response.message }, { status: response.status });
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
