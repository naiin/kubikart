import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function IndustryNotFound() {
  const t = useTranslations("businessIndustries");

  return (
    <main className="bg-page">
      <section className="kk-container-full py-16 lg:py-24">
        <div className="rounded-kubikart-lg border border-border bg-surface p-6 sm:p-8">
          <h1 className="kk-heading-1">{t("notFound.title")}</h1>
          <p className="mt-4 max-w-2xl text-muted">{t("notFound.text")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/businesses" className="kk-button kk-button-primary">{t("actions.back")}</Link>
            <Link href="/kontakt" className="kk-button kk-button-secondary">{t("actions.contact")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
