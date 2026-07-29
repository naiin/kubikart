import { getCategories, getProducts, type WCCategory, type WCProduct } from "@/lib/woocommerce";
import type { SiteLocale } from "@/lib/seo";

/**
 * Canonical localized WooCommerce category slugs, verified against the live
 * Polylang catalogue. IDs are intentionally resolved at runtime.
 */
export const BUSINESS_KITS_CATEGORY_SLUGS: Record<SiteLocale, string> = {
  de: "business-kits-de",
  en: "business-kits",
};

export function resolveBusinessKitsCategory(categories: WCCategory[], locale: SiteLocale) {
  const canonicalSlug = BUSINESS_KITS_CATEGORY_SLUGS[locale];
  return categories.find((category) => category.slug === canonicalSlug);
}

export async function getBusinessKits(locale: SiteLocale): Promise<{
  category: WCCategory;
  products: WCProduct[];
}> {
  const categories = await getCategories(locale);
  const category = resolveBusinessKitsCategory(categories, locale);

  if (!category) {
    throw new Error(`Canonical Business Kits category is unavailable for locale "${locale}".`);
  }

  const products = await getProducts(
    {
      category: category.id,
      status: "publish",
      per_page: 50,
      orderby: "menu_order",
      order: "asc",
    },
    locale,
  );

  return {
    category,
    products: products.filter(
      (product) =>
        product.status === "publish" &&
        product.categories.some((productCategory) => productCategory.id === category.id),
    ),
  };
}
