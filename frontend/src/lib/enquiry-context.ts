import "server-only";

import { getPurchaseMode } from "@/lib/purchase-mode";
import type { SiteLocale } from "@/lib/seo";
import { getProduct } from "@/lib/woocommerce";
import { getBusinessIndustryBySlug } from "@/lib/wordpress";

export type EnquiryContext =
  | { kind: "product"; id: number; slug: string; name: string }
  | { kind: "industry"; slug: string; name: string };

export type EnquiryProduct = { id: number; slug: string; name: string; sku: string; mode: "purchase" | "enquiry"; url: string };

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kubikart.de").replace(/\/$/, "");

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase() ?? "";
}

/**
 * Looks a product up by slug in the customer's language and accepts it only if
 * it is published. The name, id and URL always come from WooCommerce, never
 * from what the browser sent.
 */
export async function resolveEnquiryProduct(slug: string, locale: SiteLocale): Promise<EnquiryProduct | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  try {
    const product = await getProduct(slug, locale);
    if (product.status !== "publish") return null;
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: typeof product.sku === "string" ? product.sku.trim().slice(0, 64) : "",
      mode: getPurchaseMode(product),
      url: `${SITE_URL}/${locale}/shop/${product.slug}`,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves `?product=` (alias `?kit=`) and `?industry=` against real published
 * records. Unknown or unavailable references are ignored so the form never
 * carries invented context.
 */
export async function resolveEnquiryContext(
  searchParams: Record<string, string | string[] | undefined>,
  locale: SiteLocale,
): Promise<EnquiryContext | null> {
  const productSlug = firstValue(searchParams.product) || firstValue(searchParams.kit);
  const industrySlug = firstValue(searchParams.industry);

  try {
    if (productSlug) {
      const product = await resolveEnquiryProduct(productSlug, locale);
      if (product) return { kind: "product", id: product.id, slug: product.slug, name: product.name };
    }

    if (SLUG_PATTERN.test(industrySlug)) {
      const industry = await getBusinessIndustryBySlug(industrySlug, locale);
      if (industry) return { kind: "industry", slug: industry.slug, name: industry.title };
    }
  } catch {
    return null;
  }

  return null;
}
