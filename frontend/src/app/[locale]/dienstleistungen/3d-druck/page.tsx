import type { Metadata } from "next";
import Printing3DPage from "../../services/3d-printing/page";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "3D printing service for prototypes, gifts and custom parts | Kubikart",
          description:
            "Kubikart provides 3D printing for prototypes, personalized gifts, replacement parts and custom-made pieces with careful finishing in Germany.",
        }
      : {
          title: "3D-Druck Service für Prototypen, Geschenke & Sonderteile | Kubikart",
          description:
            "Kubikart bietet 3D-Druck für Prototypen, personalisierte Geschenke, Ersatzteile und individuelle Sonderanfertigungen mit hochwertiger Umsetzung.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.printing3d,
    title: content.title,
    description: content.description,
    index: locale === "de",
  });
}

export default Printing3DPage;
