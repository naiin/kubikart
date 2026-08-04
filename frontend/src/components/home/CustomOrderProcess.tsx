import { useTranslations } from "next-intl";

const steps = ["send", "mockup", "approve", "produce", "receive"] as const;

export function CustomOrderProcess() {
  const t = useTranslations("homeRedesign.process");

  return (
    <section className="kk-section-major">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
        </div>

        <ol className="relative mt-10 grid gap-0 lg:grid-cols-5">
          <div className="absolute top-5 right-[10%] left-[10%] hidden h-px bg-border-strong lg:block" aria-hidden="true" />
          {steps.map((step, index) => (
            <li key={step} className="relative flex gap-4 border-l border-border pb-8 pl-6 last:pb-0 lg:block lg:border-l-0 lg:px-4 lg:pb-0 lg:text-center">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white lg:mx-auto">
                {index + 1}
              </span>
              <div className="pt-1 lg:pt-4">
                <h3 className="text-base font-semibold text-brand">{t(`${step}.title`)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{t(`${step}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
