import { useTranslations } from "next-intl";
import { PortfolioTransformationVisual } from "./BusinessPrototypeVisuals";

const projects = [
  { key: "counter", visual: "counter" },
  { key: "production", visual: "window" },
  { key: "presentation", visual: "gastro" },
] as const;

export function FeaturedPortfolio() {
  const t = useTranslations("homeRedesign.portfolio");

  return (
    <section className="kk-section-major bg-surface-white">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <article key={project.key}>
              <div className="relative">
                <PortfolioTransformationVisual type={project.visual} />
                <span className="absolute top-4 left-4 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">{t("status")}</span>
              </div>
              <p className="mt-5 text-xs font-semibold tracking-[0.08em] text-muted uppercase">{t(`${project.key}.type`)}</p>
              <h3 className="kk-heading-4 mt-2">{t(`${project.key}.title`)}</h3>
              <p className="kk-body-small mt-2 text-muted">{t(`${project.key}.deliverables`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
