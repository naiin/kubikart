import type { Metadata } from "next";
import LaserPage from "../../services/laser/page";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Laser engraving and laser cutting services | Kubikart",
          description:
            "Kubikart offers laser engraving and laser cutting for signs, gifts, acrylic, wood and custom business or personalized projects.",
        }
      : {
          title: "Lasergravur für Schilder, Geschenke & Sonderanfertigungen | Kubikart",
          description:
            "Lasergravur von Kubikart für Acryl, Holz, personalisierte Geschenke, Schilder und individuelle Sonderanfertigungen mit sauberer Premium-Optik.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.laserService,
    title: content.title,
    description: content.description,
    index: locale === "de",
  });
}

export default LaserPage;
