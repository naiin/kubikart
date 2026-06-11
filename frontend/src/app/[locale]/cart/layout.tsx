import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.cart,
    title: locale === "en" ? "Cart | Kubikart" : "Warenkorb | Kubikart",
    description:
      locale === "en" ? "Current cart contents for a Kubikart order." : "Aktueller Warenkorb für eine Bestellung bei Kubikart.",
    index: false,
  });
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
