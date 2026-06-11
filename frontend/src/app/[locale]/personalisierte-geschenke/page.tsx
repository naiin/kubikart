import type { Metadata } from "next";
import ShopPage from "../shop/page";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Personalized gifts and custom-made products | Kubikart",
          description:
            "Find personalized gifts, custom-made products, engraved pieces and handmade ideas from Kubikart for private and business occasions.",
        }
      : {
          title: "Personalisierte Geschenke & individuelle Produkte | Kubikart",
          description:
            "Entdecke personalisierte Geschenke, individuelle Produkte, Gravuren und kreative Sonderanfertigungen von Kubikart für private und geschäftliche Anlässe.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.personalizedGifts,
    title: content.title,
    description: content.description,
  });
}

export default ShopPage;
