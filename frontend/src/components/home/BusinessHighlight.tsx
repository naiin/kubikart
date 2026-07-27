import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const offerings = [
  { key: "qr", paths: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M17 14h.01", "M14 14h.01", "M20 14h.01", "M14 17h.01", "M17 17h.01", "M20 17h.01", "M14 20h.01", "M17 20h.01", "M20 20h.01"] },
  { key: "stickers", paths: ["M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z", "M15 3v6h6"] },
  { key: "menus", paths: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"] },
  { key: "starter", paths: ["M16.5 9.4l-9-5.19", "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.27 6.96L12 12.01l8.73-5.05", "M12 22.08V12"] },
];

export function BusinessHighlight() {
  const t = useTranslations("homepage");

  return (
    <section className="py-20 sm:py-28 bg-navy-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <p className="text-sm font-bold text-accent-600 uppercase tracking-widest mb-3">{t("bizLabel")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white">{t("bizTitle")}</h2>
            <p className="mt-4 text-base sm:text-lg text-gray-300 leading-relaxed max-w-lg">{t("bizText")}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dienstleistungen"
                className="inline-flex items-center justify-center rounded-xl bg-accent-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-sm hover:bg-accent-500 transition-colors"
              >
                {t("bizCta")}
              </Link>
              <Link
                href="/sonderanfertigung"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-[15px] font-bold text-white hover:bg-white/10 transition-colors"
              >
                {t("bizCtaSecondary")}
              </Link>
            </div>
          </div>

          {/* Right: Offering grid */}
          <div className="grid grid-cols-2 gap-4">
            {offerings.map((item) => (
              <div key={item.key} className="flex flex-col items-center text-center rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100/10 mb-3">
                  <svg className="h-6 w-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.paths.map((d: string, i: number) => <path key={i} d={d} />)}</svg>
                </div>
                <h3 className="text-sm font-bold text-white">{t(`biz_${item.key}_title`)}</h3>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">{t(`biz_${item.key}_text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
