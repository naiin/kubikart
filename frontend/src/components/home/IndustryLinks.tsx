import { getLocale, getTranslations } from "next-intl/server";
import { IndustryMedia } from "@/components/business-industries/IndustryMedia";
import { Link } from "@/i18n/navigation";
import { getBusinessIndustryImage } from "@/lib/business-industry-images";
import { normalizeLocale } from "@/lib/seo";
import { getBusinessIndustries, type BusinessIndustry } from "@/lib/wordpress";

const fallbackImages = [
  "/images/home/business-kit-qr-nfc.webp",
  "/images/home/business-kit-menu-display.webp",
  "/images/home/business-kit-storefront.webp",
] as const;

export async function IndustryLinks() {
  const [t, rawLocale] = await Promise.all([getTranslations("homeRedesign.industries"), getLocale()]);
  const locale = normalizeLocale(rawLocale);
  let industries: BusinessIndustry[] = [];
  let unavailable = false;

  try {
    industries = (await getBusinessIndustries(locale)).slice(0, 6);
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
        </div>

        {industries.length > 0 ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {industries.map((industry, index) => {
              const localImage = getBusinessIndustryImage(industry.slug);
              return (
              <li key={industry.id} className="min-w-0">
                <article className="flex h-full flex-col rounded-kubikart-lg border border-border bg-surface p-4 shadow-kubikart-sm">
                  <IndustryMedia
                    media={industry.featuredMedia}
                    title={industry.title}
                    fallbackSrc={localImage || fallbackImages[index % fallbackImages.length]}
                    fallbackAlt={t("fallbackImageAlt", { title: industry.title })}
                    sizes="(max-width: 639px) calc(100vw - 72px), (max-width: 1279px) 44vw, 29vw"
                  />
                  <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
                    <h3 className="kk-heading-4">
                      <Link
                        href={`/businesses/${industry.slug}`}
                        className="rounded-kubikart-sm text-brand hover:text-brand-secondary"
                      >
                        {industry.title}
                      </Link>
                    </h3>
                    {industry.excerptText ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{industry.excerptText}</p>
                    ) : null}
                    <Link
                      href={`/businesses/${industry.slug}`}
                      aria-label={t("viewAria", { title: industry.title })}
                      className="kk-link mt-5 inline-flex min-h-11 items-center gap-2 self-start font-semibold"
                    >
                      {t("view")} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
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
