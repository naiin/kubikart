import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Gift, Store, UtensilsCrossed, Sparkles } from "lucide-react";

const categories = [
  {
    key: "gifts",
    href: "/shop",
    Icon: Gift,
    gradient: "from-rose-50 to-pink-50",
  },
  {
    key: "signage",
    href: "/dienstleistungen",
    Icon: Store,
    gradient: "from-blue-50 to-indigo-50",
  },
  {
    key: "menus",
    href: "/dienstleistungen",
    Icon: UtensilsCrossed,
    gradient: "from-amber-50 to-orange-50",
  },
  {
    key: "custom",
    href: "/sonderanfertigung",
    Icon: Sparkles,
    gradient: "from-emerald-50 to-teal-50",
  },
];

export function ServiceCategories() {
  const t = useTranslations("homepage");

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <p className="text-sm font-bold text-accent-600 uppercase tracking-widest mb-3">{t("servicesLabel")}</p>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-tight tracking-[-0.03em] text-navy-900">{t("servicesTitle")}</h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500 leading-relaxed">{t("servicesIntro")}</p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={cat.href}
              className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all hover:border-navy-900/20 hover:shadow-[0_16px_40px_rgba(10,29,55,0.10)]"
            >
              {/* Gradient top area with icon */}
              <div className={`flex items-center justify-center py-10 bg-linear-to-br ${cat.gradient}`}>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                  <cat.Icon className="h-7 w-7 text-accent-600" strokeWidth={1.6} />
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6">
                <h3 className="text-base font-bold text-navy-900 group-hover:text-accent-600 transition-colors">{t(`cat_${cat.key}_title`)}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{t(`cat_${cat.key}_text`)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy-900 group-hover:text-accent-600 transition-colors">
                  {t("servicesLink")}
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
