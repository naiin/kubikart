import { useTranslations } from "next-intl";

const industries = [
  { key: "restaurants", icon: "M4 3v8a3 3 0 0 0 3 3h1V3M6 3v18M14 3v7a3 3 0 0 0 3 3h2V3M17 13v8" },
  { key: "cafes", icon: "M4 8h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6zM17 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2M15 3v2" },
  { key: "salons", icon: "m4 4 16 16M20 4 4 20M8 8l8 8M8 16l8-8" },
  { key: "clinics", icon: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" },
  { key: "shops", icon: "M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6" },
  { key: "services", icon: "M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-4-4z" },
] as const;

export function IndustryLinks() {
  const t = useTranslations("homeRedesign.industries");

  return (
    <section className="kk-section bg-surface-white">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {industries.map((industry) => (
            <li key={industry.key} className="flex min-w-0 flex-col items-center gap-3 text-center">
              <svg
                className="h-10 w-10 text-brand"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={industry.icon} />
              </svg>
              <span className="text-sm font-semibold leading-5 text-foreground">{t(industry.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
