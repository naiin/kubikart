import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const content =
    locale === "en"
      ? {
          title: "Laser engraving and laser cutting services | Kubikart",
          description:
            "Kubikart offers laser engraving and laser cutting for signs, gifts, acrylic, wood and custom business or personalized projects.",
        }
      : {
          title: "Laser Service für Gravur, Schnitt & Acrylveredelung | Kubikart",
          description:
            "Kubikart unterstützt Projekte mit Lasergravur und Laserschnitt für Schilder, Geschenke, Acryl, Holz und individuelle Anfertigungen.",
        };

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.laserService,
    title: content.title,
    description: content.description,
    index: locale === "en",
  });
}

export default async function LaserPage() {
  const t = await getTranslations("services.laser");
  const features: string[] = t.raw("features");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <span className="text-5xl mb-4 block">⚡</span>
        <h1 className="text-4xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{t("description")}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Leistungen / Features</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-700">
              <span className="shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-[royalblue]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 text-center">
        <a
          href="mailto:info@kubikart.de?subject=Laser Anfrage"
          className="inline-flex items-center rounded-lg bg-[royalblue] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          {t("cta")}
        </a>
      </div>
    </div>
  );
}
