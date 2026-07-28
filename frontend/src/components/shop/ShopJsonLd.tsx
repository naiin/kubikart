import { useTranslations } from "next-intl";
import type { WCProduct } from "@/lib/woocommerce";

export function ShopJsonLd({ products, locale }: { products: WCProduct[]; locale: string }) {
  const t = useTranslations("shopPage");
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://kubikart.de").replace(/\/$/, "");
  const shopUrl = `${baseUrl}/${locale}/shop`;

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("jsonLdHome"),
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("jsonLdShop"),
        item: shopUrl,
      },
    ],
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("metadataTitle"),
    description: t("metadataDescription"),
    url: shopUrl,
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.slice(0, 20).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: `${shopUrl}/${product.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }} />
      {products.length > 0 ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} /> : null}
    </>
  );
}
