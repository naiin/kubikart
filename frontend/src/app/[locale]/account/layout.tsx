import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.account,
    title: locale === "en" ? "Account | Kubikart" : "Konto | Kubikart",
    description:
      locale === "en" ? "Private account area for Kubikart customers." : "Privater Kontobereich für Kundinnen und Kunden von Kubikart.",
    index: false,
  });
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
