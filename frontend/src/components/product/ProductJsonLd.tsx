import { useTranslations } from "next-intl";
import { getAvailabilitySchema, getProductAbsoluteUrl, getProductImageAbsoluteUrl, getSiteUrl, type ProductPageProduct } from "@/lib/product-page";

export function ProductJsonLd({ product, locale }: { product: ProductPageProduct; locale: string }) {
  const t = useTranslations("productPage");
  const siteUrl = getSiteUrl();
  const productUrl = getProductAbsoluteUrl(locale, product.slug);
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
        name: t("jsonLdShop"),
        item: `${siteUrl}/${locale}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${siteUrl}/${locale}/shop`,
      },
      {
        "@type": "ListItem",
        position: 4,
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
    image: product.images.map((image) => getProductImageAbsoluteUrl(image.src)),
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "Kubikart",
    },
    offers: {
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
    },
  };

  if (product.reviewCount && product.averageRating) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating.toFixed(1),
      reviewCount: String(product.reviewCount),
    };
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
    </>
  );
}
