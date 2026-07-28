import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ShopCustomCTA() {
  const t = useTranslations("shopPage");

  return (
    <section className="kk-section bg-page">
      <div className="kk-container-full">
        <div className="grid gap-6 rounded-kubikart-xl border border-border bg-surface px-6 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-10 md:py-10">
          <div className="max-w-2xl">
            <h2 className="kk-heading-3">{t("ctaTitle")}</h2>
            <p className="kk-body mt-3 text-muted">{t("ctaText")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/sonderanfertigung" className="kk-button kk-button-primary">
              {t("ctaButton")}
            </Link>
            <Link href="/kontakt" className="kk-button kk-button-secondary">
              {t("ctaContact")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
