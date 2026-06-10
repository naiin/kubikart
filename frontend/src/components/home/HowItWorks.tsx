import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, Wand2, PackageCheck } from "lucide-react";

const steps = [
  { key: "step1", Icon: Search },
  { key: "step2", Icon: SlidersHorizontal },
  { key: "step3", Icon: Wand2 },
  { key: "step4", Icon: PackageCheck },
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
                  <step.Icon className="h-8 w-8 text-accent-600" strokeWidth={1.6} />
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
