import { useTranslations } from "next-intl";

const steps = [
  { key: "step1", paths: ["M21 21l-4.35-4.35", "M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"] },
  { key: "step2", paths: ["M21 4H14", "M10 4H3", "M21 12H12", "M8 12H3", "M21 20H16", "M12 20H3", "M14 2v4", "M8 10v4", "M16 18v4"] },
  { key: "step3", paths: ["m15 5 4 4", "M13 7 8.7 2.7a2.41 2.41 0 0 0-3.41 0L2.7 5.3a2.41 2.41 0 0 0 0 3.41L11 17", "m15 5-3 3-4-4 3-3", "M9.4 17.6 3 21l3.4-6.4", "M18 12a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4"] },
  { key: "step4", paths: ["M16.5 9.4l-9-5.19", "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.27 6.96L12 12.01l8.73-5.05", "M12 22.08V12", "m9.5 14.5 1.5 1.5 3-3"] },
];

export function HowItWorks() {
  const t = useTranslations("homepage");

  return (
    <section className="py-20 sm:py-28 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-tight tracking-[-0.03em] text-navy-900">{t("howTitle")}</h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">{t("howSubtitle")}</p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-18 left-[12%] right-[12%] h-px border-t-2 border-dashed border-gray-300" aria-hidden="true" />

          {steps.map((step, i) => (
            <article
              key={step.key}
              className="relative flex flex-col items-center rounded-2xl bg-white border border-gray-200 px-6 pt-14 pb-8 text-center shadow-[0_6px_24px_rgba(10,29,55,0.05)] transition hover:shadow-[0_12px_36px_rgba(10,29,55,0.08)]"
            >
              {/* Icon circle - overlapping top of card */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2">
                <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-accent-100 border-4 border-white shadow-sm">
                  <svg className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{step.paths.map((d: string, i: number) => <path key={i} d={d} />)}</svg>
                  {/* Step number */}
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white ring-2 ring-white">
                    {i + 1}
                  </span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-navy-900 mb-2">{t(`${step.key}_title`)}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t(`${step.key}_text`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
