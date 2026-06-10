import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import { calculateShippingRates, type ShippingPackage } from "@/lib/shipping";

interface CartItem {
  product_id: number;
  quantity: number;
  price: string;
}

interface ProductShippingData {
  weight: string;
  dimensions: { length: string; width: string; height: string };
}

/**
 * POST /api/shipping/calculate
 * Calculate shipping rates based on cart items and destination
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, country = "DE" } = body as { items: CartItem[]; country?: string };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Fetch product weight/dimensions from WooCommerce
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;
    let subtotal = 0;

    for (const item of items) {
      subtotal += parseFloat(item.price) * item.quantity;

      if (item.product_id) {
        try {
          const product = await wcApi<ProductShippingData>(`products/${item.product_id}`, {
            revalidate: 600,
          });

          const weight = parseFloat(product.weight) || 0.5; // default 0.5kg
          const length = parseFloat(product.dimensions?.length) || 20;
          const width = parseFloat(product.dimensions?.width) || 15;
          const height = parseFloat(product.dimensions?.height) || 5;

          totalWeight += weight * item.quantity;
          maxLength = Math.max(maxLength, length);
          maxWidth = Math.max(maxWidth, width);
          totalHeight += height * item.quantity;
        } catch {
          // If product fetch fails, use defaults
          totalWeight += 0.5 * item.quantity;
          maxLength = Math.max(maxLength, 20);
          maxWidth = Math.max(maxWidth, 15);
          totalHeight += 5 * item.quantity;
        }
      } else {
        // No product_id, use defaults
        totalWeight += 0.5 * item.quantity;
      }
    }

    // Ensure minimums
    if (maxLength === 0) maxLength = 20;
    if (maxWidth === 0) maxWidth = 15;
    if (totalHeight === 0) totalHeight = 5;

    const pkg: ShippingPackage = {
      weight: totalWeight,
      length: maxLength,
      width: maxWidth,
      height: totalHeight,
    };

    const rates = calculateShippingRates(pkg, subtotal, country);

    return NextResponse.json({
      rates,
      package: pkg,
      subtotal,
      freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "50"),
    });
  } catch (error) {
    console.error("Shipping calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate shipping" }, { status: 500 });
  }
}
