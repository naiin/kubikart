import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeroBusinessVisual } from "./BusinessPrototypeVisuals";

export function HomeHero() {
  const t = useTranslations("homeRedesign.hero");

  return (
    <section className="bg-surface">
      <div className="kk-container-full grid grid-cols-1 items-center gap-10 py-12 md:py-16 lg:py-20 xl:min-h-[43rem] xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-16">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase sm:text-sm">{t("eyebrow")}</p>
          <h1 className="kk-heading-1 mt-4 max-w-[17ch] hyphens-auto">{t("title")}</h1>
          <p className="kk-body-large mt-6 max-w-[38rem] text-muted">{t("body")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/services/brand-kit" className="kk-button kk-button-primary min-h-12 px-6">
              {t("primaryCta")}
            </Link>
            <Link href="/shop" className="kk-button kk-button-secondary min-h-12 px-6">
              {t("secondaryCta")}
            </Link>
          </div>

          <Link href="/kontakt" className="kk-link mt-5 inline-flex min-h-11 items-center gap-2 py-2 font-semibold">
            {t("supportingCta")}
            <span aria-hidden="true">→</span>
          </Link>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-5 text-sm text-muted">
            {(["local", "custom", "shop"] as const).map((key) => (
              <li key={key} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                {t(`trust.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-w-0">
          <HeroBusinessVisual />
          <div className="absolute -bottom-4 left-4 max-w-[15rem] rounded-kubikart-md border border-border bg-surface-white px-4 py-3 shadow-kubikart-sm sm:left-8">
            <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">{t("visualLabel")}</p>
            <p className="mt-1 text-sm font-semibold text-brand">{t("visualText")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
