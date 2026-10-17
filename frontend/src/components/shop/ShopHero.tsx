import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/layout/PageHero";

export function ShopHero() {
  const t = useTranslations("shopPage");

  return (
    <PageHero
      breadcrumbs={[{ label: t("breadcrumbShop") }]}
      eyebrow={t("heroEyebrow")}
      title={t("heroTitle")}
      intro={t("heroSubtitle")}
      actions={
        <>
          <Link href="/services/brand-kit" className="kk-button kk-button-primary">
            {t("heroBusinessKits")}
          </Link>
          <Link href="/sonderanfertigung" className="kk-button kk-button-secondary">
            {t("heroCustomProduct")}
          </Link>
        </>
      }
    />
  );
}
