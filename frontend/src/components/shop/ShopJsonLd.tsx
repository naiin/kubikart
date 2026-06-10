import type { WCProduct } from "@/lib/woocommerce";

interface ShopJsonLdProps {
  products: WCProduct[];
  locale: string;
}

export function ShopJsonLd({ products, locale }: ShopJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kubikart.de";
  const shopUrl = `${baseUrl}/${locale}/shop`;

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Startseite",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: shopUrl,
      },
    ],
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shop für personalisierte Geschenke, Lasergravur & 3D-Druck | Kubikart",
    description: "Entdecke personalisierte Produkte, Lasergravuren, Holz- und Acrylgeschenke, 3D-Druck und Sonderanfertigungen von Kubikart.",
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
      {products.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />}
    </>
  );
}
