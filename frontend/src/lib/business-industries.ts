import type { SiteLocale } from "@/lib/seo";
import { getProduct, type WCProduct } from "@/lib/woocommerce";
import type { BusinessIndustry } from "@/lib/wordpress";

export type IndustryProducts = {
  /** Exactly the Business Bundles saved in the editor, in saved order. */
  bundles: WCProduct[];
  /** Exactly the individual products saved in the editor, in saved order. */
  relatedProducts: WCProduct[];
  unavailable: boolean;
};

async function resolveLocalizedProduct(id: number, locale: SiteLocale): Promise<WCProduct | undefined> {
  const product = await getProduct(id);
  let localized = product;

  if (product.lang && product.lang !== locale) {
    const translatedId = product.translations?.[locale];
    if (!translatedId) {
      console.error("Industry relationship omitted because no localized WooCommerce translation exists.", {
        productId: id,
        requestedLocale: locale,
      });
      return undefined;
    }
    localized = await getProduct(translatedId, locale);
  }

  if (localized.status !== "publish" || (localized.lang && localized.lang !== locale)) {
    console.error("Industry relationship omitted because the WooCommerce product is unavailable in the requested locale.", {
      productId: id,
      requestedLocale: locale,
    });
    return undefined;
  }
  return localized;
}

/**
 * Resolves the two editor-managed lists to published products in the page's
 * language. Nothing is added: no defaults, no category-derived bundles.
 */
export async function resolveIndustryProducts(
  industry: Pick<BusinessIndustry, "bundleIds" | "relatedProductIds">,
  locale: SiteLocale,
): Promise<IndustryProducts> {
  const requestedIds = [...industry.bundleIds, ...industry.relatedProductIds];
  let requestFailures = 0;
  const resolve = (id: number) =>
    resolveLocalizedProduct(id, locale).catch(() => {
      requestFailures += 1;
      return undefined;
    });

  const [bundles, relatedProducts] = await Promise.all([
    Promise.all(industry.bundleIds.map(resolve)),
    Promise.all(industry.relatedProductIds.map(resolve)),
  ]);

  return {
    bundles: bundles.filter((product): product is WCProduct => Boolean(product)),
    relatedProducts: relatedProducts.filter((product): product is WCProduct => Boolean(product)),
    unavailable: requestedIds.length > 0 && requestFailures === requestedIds.length,
  };
}
