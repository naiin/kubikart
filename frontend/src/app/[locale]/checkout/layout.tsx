import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.checkout,
    title: locale === "en" ? "Checkout | Kubikart" : "Kasse | Kubikart",
    description:
      locale === "en" ? "Secure checkout flow for Kubikart orders." : "Sicherer Checkout-Prozess für Bestellungen bei Kubikart.",
    index: false,
  });
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
