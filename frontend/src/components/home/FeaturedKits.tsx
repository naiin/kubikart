import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { KitPrototypeVisual } from "./BusinessPrototypeVisuals";

const kits = ["starter", "gastro", "salon"] as const;

export function FeaturedKits() {
  const t = useTranslations("homeRedesign.kits");

  return (
    <section className="kk-section-major">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {kits.map((kit) => (
            <article key={kit} className="kk-card overflow-hidden">
              <div className="relative bg-surface-white">
                <KitPrototypeVisual type={kit} />
                <span className="absolute top-4 left-4 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">
                  {t("prototype")}
                </span>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{t(`${kit}.audience`)}</p>
                <h3 className="kk-heading-3 mt-2">{t(`${kit}.title`)}</h3>
                <p className="kk-body-small mt-3 text-muted">{t(`${kit}.description`)}</p>
                <ul className="mt-5 space-y-2 text-sm text-foreground">
                  {([0, 1, 2] as const).map((index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-accent" aria-hidden="true">
                        ✓
                      </span>
                      <span>{t(`${kit}.item${index + 1}`)}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/kontakt" className="kk-button kk-button-secondary mt-6 w-full">
                  {t("cardCta")}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/services/brand-kit" className="kk-link inline-flex min-h-11 items-center gap-2 font-semibold">
            {t("allLink")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
