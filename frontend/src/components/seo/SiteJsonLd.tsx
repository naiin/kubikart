import { getAbsoluteUrl, serializeJsonLd } from "@/lib/seo";

export function SiteJsonLd() {
  const organizationId = getAbsoluteUrl("/#organization");
  const websiteId = getAbsoluteUrl("/#website");
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": organizationId,
        name: "Kubikart",
        url: getAbsoluteUrl("/"),
        email: "info@kubikart.de",
        logo: {
          "@type": "ImageObject",
          url: getAbsoluteUrl("/web-app-manifest-512x512.png"),
          width: 512,
          height: 512,
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: "Franz-Lehar-Str. 08",
          postalCode: "89134",
          addressLocality: "Blaustein",
          addressCountry: "DE",
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: getAbsoluteUrl("/"),
        name: "Kubikart",
        publisher: { "@id": organizationId },
        inLanguage: ["de-DE", "en"],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }} />;
}
