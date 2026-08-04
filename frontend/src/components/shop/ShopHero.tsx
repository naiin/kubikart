import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ShopHero() {
  const t = useTranslations("shopPage");

  return (
    <section className="border-b border-border bg-surface">
      <div className="kk-container-full grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:items-end lg:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase sm:text-sm">{t("heroEyebrow")}</p>
          <h1 className="kk-heading-2 mt-3">{t("heroTitle")}</h1>
          <p className="kk-body-large mt-5 max-w-2xl text-muted">{t("heroSubtitle")}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Link href="/services/brand-kit" className="kk-button kk-button-primary">
            {t("heroBusinessKits")}
          </Link>
          <Link href="/sonderanfertigung" className="kk-button kk-button-secondary">
            {t("heroCustomProduct")}
          </Link>
        </div>
      </div>
    </section>
  );
}
