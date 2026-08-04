import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ShopEmptyState({ unavailable = false }: { unavailable?: boolean }) {
  const t = useTranslations("shopPage");

  return (
    <div className="rounded-kubikart-lg border border-border bg-surface-white px-5 py-12 text-center sm:px-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-page text-brand">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          {unavailable ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
          ) : (
            <><circle cx="11" cy="11" r="6.5" /><path strokeLinecap="round" d="m16 16 4 4" /></>
          )}
        </svg>
      </div>
      <h2 className="kk-heading-3 mt-5">{t(unavailable ? "unavailableTitle" : "emptyTitle")}</h2>
      <p className="kk-body-small mx-auto mt-3 max-w-xl text-muted">{t(unavailable ? "unavailableText" : "emptyText")}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/shop" className="kk-button kk-button-secondary">
          {unavailable ? t("tryAgain") : t("filterReset")}
        </Link>
        <Link href="/sonderanfertigung" className="kk-button kk-button-primary">
          {t("emptyCtaCustom")}
        </Link>
      </div>
    </div>
  );
}
