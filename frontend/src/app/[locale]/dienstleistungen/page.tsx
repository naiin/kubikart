import type { Metadata } from "next";
import ServicesPage from "../services/page";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Services for laser work, 3D printing and custom production | Kubikart",
          description:
            "Explore Kubikart services for laser engraving, laser cutting, 3D printing, brand kits and printed menus for businesses and custom projects.",
        }
      : {
          title: "Dienstleistungen für Lasergravur, Laserschnitt & 3D-Druck | Kubikart",
          description:
            "Entdecke die Kubikart Dienstleistungen für Lasergravur, Laserschnitt, 3D-Druck, Brand Kits und Drucklösungen für individuelle Projekte.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.services,
    title: content.title,
    description: content.description,
    index: locale === "de",
  });
}

export default ServicesPage;
