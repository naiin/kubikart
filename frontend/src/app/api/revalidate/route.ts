import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { CACHE_TAGS } from "@/lib/woocommerce";
import { createHmac } from "crypto";

const EXPIRE_IMMEDIATELY = { expire: 0 };

/**
 * On-demand revalidation endpoint for WooCommerce webhooks.
 *
 * WooCommerce sends an HMAC-SHA256 signature in the X-WC-Webhook-Signature header.
 * The signature is a base64-encoded hash of the raw request body using the webhook secret.
 *
 * WooCommerce webhook setup:
 *   Topic: Product created / Product updated / Product deleted
 *   Delivery URL: https://your-domain.com/api/revalidate
 *   Secret: same as REVALIDATE_SECRET env var
 *   API Version: WP REST API Integration v3
 */

async function verifyWooCommerceSignature(request: NextRequest, body: string): Promise<boolean> {
  const signature = request.headers.get("x-wc-webhook-signature");
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret || !signature) return false;

  const expectedSignature = createHmac("sha256", secret).update(body).digest("base64");

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const isValid = await verifyWooCommerceSignature(request, rawBody);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // WooCommerce webhook topic is sent in headers
    const topic = request.headers.get("x-wc-webhook-topic") || "";
    const slug = body.slug as string | undefined;

    const revalidated: string[] = [];

    if (topic.startsWith("product.")) {
      if (slug) {
        revalidateTag(CACHE_TAGS.product(slug), EXPIRE_IMMEDIATELY);
        revalidated.push(CACHE_TAGS.product(slug));
      }
      revalidateTag(CACHE_TAGS.products, EXPIRE_IMMEDIATELY);
      revalidated.push(CACHE_TAGS.products);
    } else if (topic.startsWith("coupon.") || topic.startsWith("order.")) {
      // Orders/coupons don't need frontend cache invalidation
      return NextResponse.json({ skipped: true, topic });
    } else {
      // Unknown topic — revalidate everything
      revalidateTag(CACHE_TAGS.products, EXPIRE_IMMEDIATELY);
      revalidateTag(CACHE_TAGS.categories, EXPIRE_IMMEDIATELY);
      revalidated.push(CACHE_TAGS.products, CACHE_TAGS.categories);
    }

    return NextResponse.json({ revalidated, topic, now: Date.now() });
  } catch {
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 });
  }
}
