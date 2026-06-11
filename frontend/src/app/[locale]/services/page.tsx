import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
    index: locale === "en",
  });
}

export default async function ServicesPage() {
  const t = await getTranslations();

  const services = [
    {
      key: "printing3d" as const,
      href: "/services/3d-printing",
      icon: "🖨️",
    },
    {
      key: "laser" as const,
      href: "/services/laser",
      icon: "⚡",
    },
    {
      key: "brandKit" as const,
      href: "/services/brand-kit",
      icon: "🎨",
    },
    {
      key: "printingMenus" as const,
      href: "/services/printing-menus",
      icon: "📋",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{t("common.services")}</h1>
      <p className="text-lg text-gray-600 mb-12 max-w-2xl">{t("home.heroSubtitle")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service) => (
          <Link
            key={service.key}
            href={service.href}
            className="group flex flex-col rounded-2xl border border-gray-200 p-8 hover:border-[royalblue] hover:shadow-xl transition-all"
          >
            <span className="text-4xl mb-4">{service.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[royalblue] transition-colors">{t(`services.${service.key}.title`)}</h2>
            <p className="mt-3 text-gray-600 flex-1">{t(`services.${service.key}.description`)}</p>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-[royalblue]">{t(`services.${service.key}.cta`)} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
