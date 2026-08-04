import { isBusinessKitProduct } from "@/lib/business-kits";
import type { SiteLocale } from "@/lib/seo";
import { getProduct, type WCProduct } from "@/lib/woocommerce";
import type { BusinessIndustry } from "@/lib/wordpress";

export type IndustryProducts = {
  featuredKit?: WCProduct;
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

export async function resolveIndustryProducts(
  industry: Pick<BusinessIndustry, "featuredKitId" | "relatedProductIds">,
  locale: SiteLocale,
): Promise<IndustryProducts> {
  const requestedIds = [
    ...(industry.featuredKitId ? [industry.featuredKitId] : []),
    ...industry.relatedProductIds,
  ];
  let requestFailures = 0;

  const featuredPromise = industry.featuredKitId
    ? resolveLocalizedProduct(industry.featuredKitId, locale).catch(() => {
        requestFailures += 1;
        return undefined;
      })
    : Promise.resolve(undefined);
  const relatedPromises = industry.relatedProductIds.map((id) =>
    resolveLocalizedProduct(id, locale).catch(() => {
      requestFailures += 1;
      return undefined;
    }),
  );
  const [candidateKit, ...relatedResults] = await Promise.all([featuredPromise, ...relatedPromises]);

  const featuredKit =
    candidateKit && isBusinessKitProduct(candidateKit, locale)
      ? candidateKit
      : undefined;
  if (candidateKit && !featuredKit) {
    console.error("Configured featured Industry product is not a localized Business Kit.", {
      productId: candidateKit.id,
      locale,
    });
  }

  return {
    featuredKit,
    relatedProducts: relatedResults.filter((product): product is WCProduct => Boolean(product)),
    unavailable: requestedIds.length > 0 && requestFailures === requestedIds.length,
  };
}

