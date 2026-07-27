import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const categories = [
  {
    key: "gifts",
    href: "/shop",
    paths: ["M20 12v10H4V12", "M2 7h20v5H2z", "M12 22V7", "M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z", "M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"],
    gradient: "from-rose-50 to-pink-50",
  },
  {
    key: "signage",
    href: "/dienstleistungen",
    paths: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
    gradient: "from-blue-50 to-indigo-50",
  },
  {
    key: "menus",
    href: "/dienstleistungen",
    paths: ["M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2", "M7 2v20", "M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"],
    gradient: "from-amber-50 to-orange-50",
  },
  {
    key: "custom",
    href: "/sonderanfertigung",
    paths: ["M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z", "M20 3v4", "M22 5h-4", "M4 17v2", "M5 18H3"],
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
                  <svg className="h-7 w-7 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{cat.paths.map((d: string, i: number) => <path key={i} d={d} />)}</svg>
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
