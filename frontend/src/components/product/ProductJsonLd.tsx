import { useTranslations } from "next-intl";
import { isWooCommercePlaceholderImage } from "@/lib/business-kits";
import { getAvailabilitySchema, getProductAbsoluteUrl, getProductImageAbsoluteUrl, getSiteUrl, type ProductPageProduct } from "@/lib/product-page";
import { serializeJsonLd } from "@/lib/seo";

export function ProductJsonLd({
  product,
  locale,
  businessKit = false,
}: {
  product: ProductPageProduct;
  locale: string;
  businessKit?: boolean;
}) {
  const t = useTranslations("productPage");
  const siteUrl = getSiteUrl();
  const productUrl = getProductAbsoluteUrl(locale, product.slug);
  const standardCategoryBreadcrumb = {
    "@type": "ListItem",
    position: 3,
    name: product.category.name,
    item: product.category.id
      ? `${siteUrl}/${locale}/shop?category=${product.category.id}`
      : `${siteUrl}/${locale}/shop`,
  };
  const schemaImages = product.images
    .filter((image) => !businessKit || !isWooCommercePlaceholderImage(image))
    .map((image) => getProductImageAbsoluteUrl(image.src));
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("jsonLdHome"),
        item: `${siteUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: businessKit ? t("jsonLdBusinessKits") : t("jsonLdShop"),
        item: businessKit
          ? `${siteUrl}/${locale}/services/brand-kit`
          : `${siteUrl}/${locale}/shop`,
      },
      ...(businessKit ? [] : [standardCategoryBreadcrumb]),
      {
        "@type": "ListItem",
        position: businessKit ? 3 : 4,
        name: product.name,
        item: productUrl,
      },
    ],
  };
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "Kubikart",
    },
  };

  if (product.sku) {
    productSchema.sku = product.sku;
  }

  if (product.purchasable === true && product.price.amount > 0) {
    productSchema.offers = {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.price.currency,
      price: product.price.amount.toFixed(2),
      availability: getAvailabilitySchema(product.availability),
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Kubikart",
      },
    };
  }

  if (schemaImages.length > 0) {
    productSchema.image = schemaImages;
  }

  if (product.reviewCount && product.averageRating) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating.toFixed(1),
      reviewCount: String(product.reviewCount),
    };
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbList) }} />
    </>
  );
}
