import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ShopEmptyState() {
  const t = useTranslations("shopPage");

  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-6">
        <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-2">{t("emptyTitle")}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{t("emptyText")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 hover:bg-gray-100 transition-colors"
        >
          {t("filterReset")}
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center justify-center rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-500 transition-colors"
        >
          {t("emptyCtaCustom")}
        </Link>
      </div>
    </div>
  );
}
