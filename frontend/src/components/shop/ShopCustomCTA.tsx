import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ShopCustomCTA() {
  const t = useTranslations("shopPage");

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] bg-navy-900 px-8 py-12 sm:px-14 sm:py-14 text-center">
          <h2 className="text-[24px] sm:text-[32px] font-bold leading-tight tracking-[-0.02em] text-white">{t("ctaTitle")}</h2>
          <p className="mt-3 text-base text-gray-300 max-w-xl mx-auto leading-relaxed">{t("ctaText")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-xl bg-accent-600 px-6 py-3 text-[15px] font-bold text-white hover:bg-accent-500 transition-colors"
            >
              {t("ctaButton")}
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-transparent px-6 py-3 text-[15px] font-bold text-white hover:bg-navy-800 transition-colors"
            >
              {t("ctaButtonServices")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
