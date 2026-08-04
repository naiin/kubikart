import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HomepageFinalCta() {
  const t = useTranslations("homeRedesign.finalCta");

  return (
    <section className="kk-section-major">
      <div className="kk-container">
        <div className="rounded-kubikart-xl bg-brand px-6 py-12 text-center sm:px-10 lg:px-16 lg:py-16">
          <h2 className="kk-heading-2 text-white">{t("title")}</h2>
          <p className="kk-body-large mx-auto mt-5 max-w-3xl text-white/75">{t("body")}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/kontakt" className="kk-button kk-button-primary">
              {t("primaryCta")}
            </Link>
            <Link
              href="/kontakt"
              className="kk-button border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
