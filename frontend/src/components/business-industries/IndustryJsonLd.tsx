import { getAbsoluteUrl, serializeJsonLd } from "@/lib/seo";
import type { BusinessIndustry } from "@/lib/wordpress";

export function IndustryOverviewJsonLd({
  locale,
  industries,
  labels,
}: {
  locale: string;
  industries: BusinessIndustry[];
  labels: { home: string; current: string; description: string };
}) {
  const pageUrl = getAbsoluteUrl(`/${locale}/businesses`);
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: labels.home, item: getAbsoluteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: labels.current, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: labels.current,
      description: labels.description,
      url: pageUrl,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: industries.length,
        itemListElement: industries.map((industry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: industry.title,
          url: getAbsoluteUrl(`/${locale}/businesses/${industry.slug}`),
        })),
      },
    },
  ];
  return schemas.map((schema, index) => (
    <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
  ));
}

export function IndustryDetailJsonLd({
  industry,
  locale,
  parentLabel,
  homeLabel,
}: {
  industry: BusinessIndustry;
  locale: string;
  parentLabel: string;
  homeLabel: string;
}) {
  const pageUrl = getAbsoluteUrl(`/${locale}/businesses/${industry.slug}`);
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: getAbsoluteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: parentLabel, item: getAbsoluteUrl(`/${locale}/businesses`) },
        { "@type": "ListItem", position: 3, name: industry.title, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: industry.title,
      description: industry.excerptText,
      url: pageUrl,
      dateModified: industry.modified,
      primaryImageOfPage: industry.featuredMedia?.source_url
        ? { "@type": "ImageObject", url: industry.featuredMedia.source_url }
        : undefined,
    },
  ];
  return schemas.map((schema, index) => (
    <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
  ));
}
