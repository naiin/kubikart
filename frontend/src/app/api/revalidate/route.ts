import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { CACHE_TAGS } from "@/lib/woocommerce";
import { WORDPRESS_CACHE_TAGS } from "@/lib/wordpress";
import { SIGNATURE_TIMESTAMP_HEADER, verifySignedRequest } from "@/lib/signed-request";

const EXPIRE_IMMEDIATELY = { expire: 0 };

/**
 * On-demand revalidation endpoint.
 *
 * The kubikart-frontend-revalidation mu-plugin signs `"<unix seconds>.<raw body>"` (base64 HMAC-SHA256 with
 * REVALIDATE_SECRET) into X-WC-Webhook-Signature and sends the time in X-Kubikart-Timestamp; requests outside a
 * five-minute window are rejected, so a captured request cannot be replayed later.
 *
 * Native WooCommerce webhooks cannot add a timestamp and sign the body only. They are accepted only when
 * REVALIDATE_ALLOW_UNTIMED_WEBHOOKS=true (off by default); prefer the mu-plugin.
 */
function verifyRequest(request: NextRequest, body: string): boolean {
  return verifySignedRequest({
    secret: process.env.REVALIDATE_SECRET,
    signature: request.headers.get("x-wc-webhook-signature"),
    timestamp: request.headers.get(SIGNATURE_TIMESTAMP_HEADER),
    body,
    allowUntimed: process.env.REVALIDATE_ALLOW_UNTIMED_WEBHOOKS === "true",
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifyRequest(request, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // WooCommerce webhook topic is sent in headers
    const topic = request.headers.get("x-wc-webhook-topic") || "";
    const slug = body.slug as string | undefined;

    const revalidated: string[] = [];

    if (topic.startsWith("product.")) {
      // Polylang sends every translation; the English product has its own slug and cache tag.
      const slugs = new Set<string>();
      if (typeof slug === "string" && slug) slugs.add(slug);
      if (body.translations && typeof body.translations === "object") {
        for (const translation of Object.values(body.translations as Record<string, { slug?: unknown }>)) {
          if (typeof translation?.slug === "string" && translation.slug) slugs.add(translation.slug);
        }
      }
      for (const productSlug of slugs) {
        revalidateTag(CACHE_TAGS.product(productSlug), EXPIRE_IMMEDIATELY);
        revalidated.push(CACHE_TAGS.product(productSlug));
      }
      // Category product counts change when products are created, published or deleted.
      revalidateTag(CACHE_TAGS.products, EXPIRE_IMMEDIATELY);
      revalidateTag(CACHE_TAGS.categories, EXPIRE_IMMEDIATELY);
      revalidated.push(CACHE_TAGS.products, CACHE_TAGS.categories);
    } else if (topic.startsWith("category.") || topic.startsWith("product_cat.")) {
      // Renamed categories are embedded in product payloads as well as the category list.
      revalidateTag(CACHE_TAGS.products, EXPIRE_IMMEDIATELY);
      revalidateTag(CACHE_TAGS.categories, EXPIRE_IMMEDIATELY);
      revalidated.push(CACHE_TAGS.products, CACHE_TAGS.categories);
    } else if (topic.startsWith("industry.")) {
      const id = Number(body.id);
      const translations =
        body.translations && typeof body.translations === "object"
          ? body.translations as Record<string, { id?: number; slug?: string }>
          : {};

      revalidateTag(WORDPRESS_CACHE_TAGS.industries, EXPIRE_IMMEDIATELY);
      revalidateTag(WORDPRESS_CACHE_TAGS.sitemap, EXPIRE_IMMEDIATELY);
      revalidated.push(WORDPRESS_CACHE_TAGS.industries, WORDPRESS_CACHE_TAGS.sitemap);

      if (Number.isInteger(id) && id > 0) {
        revalidateTag(WORDPRESS_CACHE_TAGS.industry(id), EXPIRE_IMMEDIATELY);
        revalidated.push(WORDPRESS_CACHE_TAGS.industry(id));
      }

      for (const locale of ["de", "en"] as const) {
        revalidateTag(WORDPRESS_CACHE_TAGS.locale(locale), EXPIRE_IMMEDIATELY);
        revalidated.push(WORDPRESS_CACHE_TAGS.locale(locale));
        revalidatePath(`/${locale}/businesses`);

        const translation = translations[locale];
        if (translation?.id) {
          revalidateTag(WORDPRESS_CACHE_TAGS.industry(translation.id), EXPIRE_IMMEDIATELY);
          revalidated.push(WORDPRESS_CACHE_TAGS.industry(translation.id));
        }
        if (translation?.slug) {
          revalidateTag(WORDPRESS_CACHE_TAGS.slug(locale, translation.slug), EXPIRE_IMMEDIATELY);
          revalidated.push(WORDPRESS_CACHE_TAGS.slug(locale, translation.slug));
          revalidatePath(`/${locale}/businesses/${translation.slug}`);
        }
      }
      revalidatePath("/sitemap.xml");
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
