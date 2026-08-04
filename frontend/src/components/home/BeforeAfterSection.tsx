import Image from "next/image";
import { useTranslations } from "next-intl";

const images = {
  before: "/images/home/business-visibility-before.png",
  after: "/images/home/business-visibility-after.png",
} as const;

export function BeforeAfterSection() {
  const t = useTranslations("homeRedesign.beforeAfter");

  return (
    <section className="kk-section-major bg-surface-white">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-kubikart-xl border border-border bg-surface shadow-kubikart-sm md:grid-cols-2">
          {(["before", "after"] as const).map((key, index) => (
            <figure key={key} className={index === 1 ? "border-t border-border md:border-t-0 md:border-l" : ""}>
              <div className="relative aspect-[3/2] overflow-hidden bg-surface">
                <Image
                  src={images[key]}
                  alt={t(`${key}.imageAlt`)}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="p-5 sm:p-6">
                <span className="kk-badge">{t("status")}</span>
                <h3 className="kk-heading-3 mt-3">{t(`${key}.title`)}</h3>
                <p className="kk-body-small mt-2 max-w-xl text-muted">{t(`${key}.text`)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
