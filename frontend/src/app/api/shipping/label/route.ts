import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import {
  createDHLShipment,
  createDHLReturnLabel,
  getDHLProductForPackage,
  DHL_PRODUCTS,
  SENDER_ADDRESS,
  type DHLAddress,
  type ShippingPackage,
} from "@/lib/shipping";

interface WCOrderForLabel {
  id: number;
  status: string;
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: {
    product_id: number;
    quantity: number;
  }[];
  meta_data: { key: string; value: unknown }[];
}

interface ProductData {
  weight: string;
  dimensions: { length: string; width: string; height: string };
}

/**
 * POST /api/shipping/label
 * Create a DHL shipping label for an order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, type = "shipment" } = body as { orderId: number; type?: "shipment" | "return" };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Fetch order from WooCommerce
    const order = await wcApi<WCOrderForLabel>(`orders/${orderId}`, { revalidate: 0 });

    if (!order || !order.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Calculate package dimensions from order items
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    for (const item of order.line_items) {
      try {
        const product = await wcApi<ProductData>(`products/${item.product_id}`, { revalidate: 600 });
        const weight = parseFloat(product.weight) || 0.5;
        const length = parseFloat(product.dimensions?.length) || 20;
        const width = parseFloat(product.dimensions?.width) || 15;
        const height = parseFloat(product.dimensions?.height) || 5;

        totalWeight += weight * item.quantity;
        maxLength = Math.max(maxLength, length);
        maxWidth = Math.max(maxWidth, width);
        totalHeight += height * item.quantity;
      } catch {
        totalWeight += 0.5 * item.quantity;
        maxLength = Math.max(maxLength, 20);
        maxWidth = Math.max(maxWidth, 15);
        totalHeight += 5 * item.quantity;
      }
    }

    const pkg: ShippingPackage = {
      weight: Math.max(totalWeight, 0.1),
      length: Math.max(maxLength, 10),
      width: Math.max(maxWidth, 7),
      height: Math.max(totalHeight, 1),
    };

    // Parse recipient address from order
    const shipping = order.shipping;
    const addressParts = parseStreetAddress(shipping.address_1);

    const recipientAddress: DHLAddress = {
      name1: `${shipping.first_name} ${shipping.last_name}`.trim(),
      streetName: addressParts.street,
      streetNumber: addressParts.number,
      postalCode: shipping.postcode,
      city: shipping.city,
      country: shipping.country || "DE",
    };

    // Determine DHL product code
    const productType = getDHLProductForPackage(pkg);
    const productCode = productType === "KLEINPAKET" ? DHL_PRODUCTS.KLEINPAKET : DHL_PRODUCTS.PAKET_NATIONAL;

    if (type === "return") {
      // Create return label
      const label = await createDHLReturnLabel({
        orderId: String(orderId),
        receiverAddress: SENDER_ADDRESS,
        senderAddress: recipientAddress,
        package: pkg,
      });

      // Store tracking number in WC order meta
      await wcApi(`orders/${orderId}`, {
        method: "PUT",
        body: {
          meta_data: [
            ...(order.meta_data || []),
            { key: "_dhl_return_tracking", value: label.shipmentNo },
            { key: "_dhl_return_label_url", value: label.labelUrl },
          ],
        },
      });

      return NextResponse.json({
        success: true,
        type: "return",
        shipmentNo: label.shipmentNo,
        labelUrl: label.labelUrl,
      });
    }

    // Create shipment label
    const label = await createDHLShipment({
      orderId: String(orderId),
      senderAddress: SENDER_ADDRESS,
      recipientAddress,
      package: pkg,
      productCode,
      reference: `KB-${orderId}`,
    });

    // Store tracking number in WC order meta
    await wcApi(`orders/${orderId}`, {
      method: "PUT",
      body: {
        meta_data: [
          ...(order.meta_data || []),
          { key: "_dhl_tracking_number", value: label.shipmentNo },
          { key: "_dhl_label_url", value: label.labelUrl },
          { key: "_dhl_product", value: productCode },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      type: "shipment",
      shipmentNo: label.shipmentNo,
      labelUrl: label.labelUrl,
      product: productType,
    });
  } catch (error) {
    console.error("DHL label creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create shipping label";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Parse a German street address into street name and number
 * e.g. "Musterstraße 12a" → { street: "Musterstraße", number: "12a" }
 */
function parseStreetAddress(address: string): { street: string; number: string } {
  const match = address.match(/^(.+?)\s+(\d+\s*\w*)$/);
  if (match) {
    return { street: match[1], number: match[2] };
  }
  return { street: address, number: "" };
}
