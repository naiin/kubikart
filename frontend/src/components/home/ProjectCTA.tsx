import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ProjectCTA() {
  const t = useTranslations("homepage");

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] bg-navy-900 px-8 py-16 sm:px-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white">{t("ctaTitle")}</h2>
          <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">{t("ctaText")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/sonderanfertigung"
              className="inline-flex items-center justify-center rounded-xl bg-accent-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-sm hover:bg-accent-500 transition-colors"
            >
              {t("ctaButton")}
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-[15px] font-bold text-white hover:bg-white/10 transition-colors"
            >
              {t("ctaButtonShop")}
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">{t("ctaNote")}</p>
        </div>
      </div>
    </section>
  );
}
