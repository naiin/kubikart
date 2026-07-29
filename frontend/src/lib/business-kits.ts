import { getCategories, getProducts, type WCCategory, type WCProduct } from "@/lib/woocommerce";
import type { SiteLocale } from "@/lib/seo";

type ProductWithCategories = {
  categories: Array<{ id?: number; slug: string }>;
};

type ProductImageLike = {
  src: string;
};

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

/**
 * Selects the dedicated presentation from the real localized WooCommerce
 * category membership already present on the product response.
 */
export function isBusinessKitProduct(product: ProductWithCategories, locale: SiteLocale) {
  const canonicalSlug = BUSINESS_KITS_CATEGORY_SLUGS[locale];
  return product.categories.some((category) => category.slug === canonicalSlug);
}

export function isWooCommercePlaceholderImage(image: ProductImageLike) {
  try {
    return /\/woocommerce-placeholder(?:\.[a-z0-9]+)?$/i.test(new URL(image.src).pathname);
  } catch {
    return /(?:^|\/)woocommerce-placeholder(?:\.[a-z0-9]+)?$/i.test(image.src);
  }
}

export async function getOtherBusinessKits(
  locale: SiteLocale,
  currentProductId: number,
  preferredProductIds: number[] = [],
  limit = 4,
) {
  const { products } = await getBusinessKits(locale);
  const preferredOrder = new Map(preferredProductIds.map((id, index) => [id, index]));

  return products
    .filter((product) => product.id !== currentProductId)
    .sort((left, right) => {
      const leftOrder = preferredOrder.get(left.id);
      const rightOrder = preferredOrder.get(right.id);
      if (leftOrder !== undefined || rightOrder !== undefined) {
        return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER);
      }
      return 0;
    })
    .slice(0, limit);
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
