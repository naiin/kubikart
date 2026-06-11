import type { Metadata } from "next";
import LaserPage from "../../services/laser/page";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const isGermanLocale = locale === "de";

  return buildPageMetadata({
    locale,
    routeSegments: isGermanLocale ? SEO_ROUTE_SEGMENTS.laserCutting : SEO_ROUTE_SEGMENTS.laserService,
    title:
      locale === "en"
        ? "Laser cutting service | Kubikart"
        : "Laserschnitt für Acryl, Holz und individuelle Projekte | Kubikart",
    description:
      locale === "en"
        ? "Kubikart supports laser-cut projects for acrylic, wood, signs and custom-made pieces with precise clean edges."
        : "Laserschnitt von Kubikart für Acryl, Holz, Schilder und individuelle Projekte mit präzisen Kanten und hochwertiger Verarbeitung.",
    index: isGermanLocale,
  });
}

export default LaserPage;
