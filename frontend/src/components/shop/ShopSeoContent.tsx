import { useTranslations } from "next-intl";

export function ShopSeoContent() {
  const t = useTranslations("shopPage");

  return (
    <section className="py-12 bg-cream-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-navy-900 mb-4">{t("seoTitle")}</h2>
        <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
          <p>{t("seoText1")}</p>
          <p>{t("seoText2")}</p>
        </div>
      </div>
    </section>
  );
}
