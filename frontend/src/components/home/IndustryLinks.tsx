import { getLocale, getTranslations } from "next-intl/server";
import { IndustryMedia } from "@/components/business-industries/IndustryMedia";
import { Link } from "@/i18n/navigation";
import { getHomeIndustryImage } from "@/lib/home-industry-images";
import { normalizeLocale } from "@/lib/seo";
import { getBusinessIndustries, type BusinessIndustry } from "@/lib/wordpress";

export async function IndustryLinks() {
  const [t, rawLocale] = await Promise.all([getTranslations("homeRedesign.industries"), getLocale()]);
  const locale = normalizeLocale(rawLocale);
  let industries: BusinessIndustry[] = [];
  let unavailable = false;

  try {
    industries = (await getBusinessIndustries(locale)).slice(0, 8);
  } catch {
    unavailable = true;
  }

  return (
    <section className="kk-section bg-surface-white">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="kk-eyebrow">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
          <p className="mt-2 text-sm text-muted">{t("imageNote")}</p>
        </div>

        {industries.length > 0 ? (
          <ul className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4">
            {industries.map((industry) => {
              const localImage = getHomeIndustryImage(industry.slug);
              return (
                <li key={industry.id} className="min-w-0">
                  <Link
                    href={`/businesses/${industry.slug}`}
                    aria-label={t("viewAria", { title: industry.title })}
                    className="group flex h-full flex-col overflow-hidden rounded-kubikart-lg border border-border bg-surface transition-colors hover:border-accent"
                  >
                    <IndustryMedia
                      media={localImage ? undefined : industry.featuredMedia}
                      title={industry.title}
                      fallbackSrc={localImage?.src}
                      fallbackAlt={localImage ? t(`imageAlts.${localImage.altKey}`) : t("fallbackImageAlt", { title: industry.title })}
                      sizes="(max-width: 767px) 44vw, 22vw"
                      compact
                    />
                    <span className="flex flex-1 items-center justify-between gap-2 px-4 py-3 font-heading text-sm leading-5 font-bold text-brand group-hover:text-accent sm:text-base">
                      <span className="min-w-0 break-words">{industry.title}</span>
                      <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-8 text-muted">{t(unavailable ? "unavailable" : "empty")}</p>
        )}

        <Link href="/businesses" className="kk-link mt-7 inline-flex min-h-11 items-center gap-2 font-semibold">
          {t("allLink")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
