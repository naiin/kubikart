import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Shipping information | Kubikart",
          description: "Shipping times, delivery zones and shipping notes for orders placed with Kubikart.",
        }
      : {
          title: "Versandinformationen | Kubikart",
          description: "Versandzeiten, Liefergebiete und Hinweise zum Versand für Bestellungen bei Kubikart.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.shipping,
    title: content.title,
    description: content.description,
  });
}

export default async function VersandPage() {
  const t = await getTranslations("shipping");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("title")}</h1>

      <div className="space-y-8">
        {/* Domestic */}
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🇩🇪</span>
            <h2 className="text-xl font-semibold text-gray-900">{t("domesticTitle")}</h2>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">{t("domesticTime")}</span>
          </div>
          <p className="text-gray-600">{t("domesticDesc")}</p>
        </div>

        {/* EU */}
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🇪🇺</span>
            <h2 className="text-xl font-semibold text-gray-900">{t("euTitle")}</h2>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">{t("euTime")}</span>
          </div>
          <p className="text-gray-600">{t("euDesc")}</p>
        </div>

        {/* Additional Info */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Hinweise / Notes</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>{t("freeShippingNote")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>{t("processingTime")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>{t("trackingInfo")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
