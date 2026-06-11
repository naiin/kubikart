import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceCategories } from "@/components/home/ServiceCategories";
import { PopularProducts } from "@/components/home/PopularProducts";
import { BusinessHighlight } from "@/components/home/BusinessHighlight";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { AboutTrust } from "@/components/home/AboutTrust";
import { ProjectCTA } from "@/components/home/ProjectCTA";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Kubikart | Personalized products, laser engraving and 3D printing",
          description:
            "Kubikart creates personalized products, laser engraving, laser cutting and 3D printing projects with a premium made-in-Germany finish.",
        }
      : {
          title: "Kubikart | Personalisierte Produkte, Lasergravur und 3D-Druck",
          description:
            "Kubikart fertigt personalisierte Produkte, Lasergravur, Laserschnitt und 3D-Druck Projekte mit hochwertiger Umsetzung und persönlichem Service.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.home,
    title: content.title,
    description: content.description,
  });
}

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <ServiceCategories />
      <PopularProducts />
      <BusinessHighlight />
      <HowItWorks />
      <CustomerReviews />
      <AboutTrust />
      <ProjectCTA />
    </>
  );
}
