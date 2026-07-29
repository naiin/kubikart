import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { normalizeLocale } from "@/lib/seo";
import { getBusinessIndustries, type BusinessIndustry } from "@/lib/wordpress";

const icons = [
  "M4 3v8a3 3 0 0 0 3 3h1V3M6 3v18M14 3v7a3 3 0 0 0 3 3h2V3M17 13v8",
  "M4 8h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6zM17 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2M15 3v2",
  "m4 4 16 16M20 4 4 20M8 8l8 8M8 16l8-8",
  "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
  "M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6",
  "M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-4-4z",
] as const;

export async function IndustryLinks() {
  const [t, rawLocale] = await Promise.all([getTranslations("homeRedesign.industries"), getLocale()]);
  const locale = normalizeLocale(rawLocale);
  let industries: BusinessIndustry[] = [];

  try {
    industries = (await getBusinessIndustries(locale)).slice(0, 6);
  } catch {
    industries = [];
  }

  return (
    <section className="kk-section bg-surface-white">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="kk-eyebrow">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
        </div>

        {industries.length > 0 ? (
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map((industry, index) => (
              <li key={industry.id} className="min-w-0">
                <Link
                  href={`/businesses/${industry.slug}`}
                  className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-kubikart-md border border-transparent p-3 text-center transition-colors hover:border-border hover:bg-page"
                >
                  <svg
                    className="h-10 w-10 text-brand transition-colors group-hover:text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={icons[index % icons.length]} />
                  </svg>
                  <span className="text-sm font-semibold leading-5 text-foreground">{industry.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-muted">{t("unavailable")}</p>
        )}

        <Link href="/businesses" className="kk-link mt-7 inline-flex min-h-11 items-center gap-2 font-semibold">
          {t("allLink")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
