import { NextRequest, NextResponse } from "next/server";
import { calculateServerCart, serverCartErrorResponse } from "@/lib/server-cart";

export async function POST(request: NextRequest) {
  try {
    const cart = await calculateServerCart(await request.json());
    return NextResponse.json({
      rates: cart.rates,
      package: cart.package,
      subtotal: cart.subtotalCents / 100,
      total: cart.totalCents / 100,
      currency: cart.currency,
      lines: cart.lines,
      freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 50),
    });
  } catch (error) {
    const response = serverCartErrorResponse(error);
    if (response.status === 500) console.error("Shipping calculation error:", error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
