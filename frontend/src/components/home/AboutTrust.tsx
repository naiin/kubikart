import { useTranslations } from "next-intl";

const trustBadges = [
  { key: "handmade", paths: ["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"] },
  { key: "quality", paths: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"] },
  { key: "local", paths: ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", "M12 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"] },
  { key: "bothAudiences", paths: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"] },
];

export function AboutTrust() {
  const t = useTranslations("homepage");

  return (
    <section id="about-kubikart" className="py-20 sm:py-24 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-bold text-accent-600 uppercase tracking-widest mb-3">{t("aboutLabel")}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-[-0.03em] text-navy-900">{t("aboutTitle")}</h2>
          <p className="mt-4 text-gray-500 text-base leading-relaxed">{t("aboutText")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {trustBadges.map((badge) => (
            <div
              key={badge.key}
              className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-gray-200 shadow-[0_4px_16px_rgba(10,29,55,0.04)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{badge.paths.map((d: string, i: number) => <path key={i} d={d} />)}</svg>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-navy-900">{t(`trust_${badge.key}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
