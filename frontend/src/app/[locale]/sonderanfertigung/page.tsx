import type { Metadata } from "next";
import ContactPage from "../kontakt/page";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Custom requests and bespoke production | Kubikart",
          description:
            "Request a custom-made product from Kubikart for laser engraving, acrylic signs, 3D printing and bespoke business or gift projects.",
        }
      : {
          title: "Sonderanfertigung anfragen | Kubikart",
          description:
            "Frage deine Sonderanfertigung bei Kubikart an. Individuelle Projekte für Lasergravur, Acrylschilder, personalisierte Geschenke und 3D-Druck.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.customRequest,
    title: content.title,
    description: content.description,
  });
}

export default ContactPage;
