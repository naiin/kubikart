import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ShopHero() {
  const t = useTranslations("shopPage");

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/hero-shop.png')",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,247,242,0.98)_0%,rgba(250,247,242,0.95)_28%,rgba(250,247,242,0.84)_46%,rgba(250,247,242,0.42)_68%,rgba(6,20,38,0.18)_100%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-[760px] rounded-[30px] border border-white/65 bg-cream-50/74 p-6 shadow-[0_22px_60px_rgba(10,29,55,0.08)] backdrop-blur-[10px] sm:p-8 lg:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent-600">{t("heroEyebrow")}</p>
          <h1 className="max-w-3xl text-[32px] font-extrabold leading-[1.08] tracking-[-0.04em] text-navy-900 sm:text-[42px] lg:text-[50px]">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-gray-700 sm:text-lg">{t("heroSubtitle")}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#products"
              className="inline-flex items-center justify-center rounded-xl bg-navy-900 px-6 py-3 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(10,29,55,0.16)] transition-colors hover:bg-navy-800"
            >
              {t("heroCta")}
            </a>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-xl border border-white/80 bg-cream-50 px-6 py-3 text-[15px] font-bold text-navy-900 shadow-[0_12px_24px_rgba(10,29,55,0.08)] transition-colors hover:bg-white"
            >
              {t("heroCtaSecondary")}
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {(["trustPersonalizable", "trustMadeInGermany", "trustCrafted", "trustShipping"] as const).map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/75 bg-white/72 px-3.5 py-2 text-sm font-medium text-navy-800 shadow-[0_10px_20px_rgba(10,29,55,0.05)] backdrop-blur-sm"
              >
                <svg className="h-4 w-4 shrink-0 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
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
      </div>
    </section>
  );
}
