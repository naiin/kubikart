import type { Metadata } from "next";
import { BeforeAfterSection } from "@/components/home/BeforeAfterSection";
import { CustomOrderProcess } from "@/components/home/CustomOrderProcess";
import { FeaturedKits } from "@/components/home/FeaturedKits";
import { FeaturedPortfolio } from "@/components/home/FeaturedPortfolio";
import { HomeHero } from "@/components/home/HomeHero";
import { HomepageFinalCta } from "@/components/home/HomepageFinalCta";
import { HomepageTrustStrip } from "@/components/home/HomepageTrustStrip";
import { IndustryLinks } from "@/components/home/IndustryLinks";
import { KitContentsStrip } from "@/components/home/KitContentsStrip";
import { PopularProducts } from "@/components/home/PopularProducts";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Kubikart | Visibility products and personalized products",
          description:
            "Kubikart creates QR and NFC stands, stickers, menus, visibility kits and selected personalized products for local businesses and private customers.",
        }
      : {
          title: "Kubikart | Sichtbarkeitslösungen und personalisierte Produkte",
          description:
            "Kubikart gestaltet QR- und NFC-Aufsteller, Aufkleber, Menüs, Sichtbarkeits-Kits und ausgewählte personalisierte Produkte für lokale Unternehmen und Privatkunden.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.home,
    title: content.title,
    description: content.description,
  });
}

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />
      <div className="overflow-clip bg-page">
        <HomeHero />
        <BeforeAfterSection />
        <FeaturedKits />
        <KitContentsStrip />
        <PopularProducts />
        <IndustryLinks />
        <CustomOrderProcess />
        <FeaturedPortfolio />
        <HomepageTrustStrip />
        <HomepageFinalCta />
      </div>
    </>
  );
}
