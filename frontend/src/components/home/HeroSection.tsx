import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("homepage");

  return (
    <section className="relative overflow-hidden bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent-600 uppercase mb-4">{t("heroEyebrow")}</p>
            <h1 className="text-[38px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-[-0.04em] text-navy-900">{t("heroTitle")}</h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-xl">{t("heroSubtitle")}</p>

            {/* Dual CTAs */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-xl bg-navy-900 px-7 py-3.5 text-[15px] font-bold text-white shadow-sm hover:bg-navy-800 transition-colors"
              >
                {t("heroCtaPrimary")}
              </Link>
              <Link
                href="/dienstleistungen"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-[15px] font-bold text-navy-900 shadow-sm hover:bg-gray-50 transition-colors"
              >
                {t("heroCtaSecondary")}
              </Link>
            </div>

            {/* Trust points */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {(["trustLocal", "trustBothAudiences", "trustMadeInGermany"] as const).map((key) => (
                <span key={key} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="h-4 w-4 text-accent-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t(key)}
                </span>
              ))}
            </div>
          </div>

          {/* Hero image — CSS background so it always fills the panel */}
          <div
            className="min-h-[320px] sm:min-h-[400px] lg:min-h-[480px] overflow-hidden rounded-[28px] shadow-[0_22px_50px_rgba(10,29,55,0.10)]"
            style={{
              backgroundImage: "url('/hero.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            role="img"
            aria-label="Kubikart Produkte: QR-Bewertungsständer, Speisekarte und NFC-Stand in einem modernen Salon"
          >
            {/* Dark overlay */}
            <div className="h-full w-full min-h-[320px] sm:min-h-[400px] lg:min-h-[480px] bg-black/30 rounded-[28px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
