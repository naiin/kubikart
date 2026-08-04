import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { IndustryMedia } from "@/components/business-industries/IndustryMedia";
import { IndustryOverviewJsonLd } from "@/components/business-industries/IndustryJsonLd";
import { Link } from "@/i18n/navigation";
import {
  buildPageMetadata,
  normalizeLocale,
  SEO_ROUTE_SEGMENTS,
} from "@/lib/seo";
import {
  getBusinessIndustries,
  WordPressUnavailableError,
  type BusinessIndustry,
} from "@/lib/wordpress";

type BusinessIndustriesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BusinessIndustriesPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations("businessIndustries");

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.businesses,
    title: t("overview.metadataTitle"),
    description: t("overview.metadataDescription"),
  });
}

export default async function BusinessIndustriesPage({ params }: BusinessIndustriesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations("businessIndustries");
  let unavailable = false;
  let industries: BusinessIndustry[] = [];

  try {
    industries = await getBusinessIndustries(locale);
  } catch (error) {
    if (error instanceof WordPressUnavailableError) {
      unavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <main className="bg-page text-foreground">
      <section className="border-b border-border bg-surface">
        <div className="kk-container-full py-12 lg:py-16">
          <nav aria-label={t("breadcrumbLabel")} className="text-sm text-muted">
            <Link href="/" className="kk-link">{t("home")}</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">{t("parent")}</span>
          </nav>

          <div className="mt-8 max-w-4xl">
            <p className="kk-eyebrow">{t("overview.eyebrow")}</p>
            <h1 className="kk-page-intro-heading mt-3">{t("overview.heading")}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">
              {t("overview.intro")}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="industry-list-heading" className="kk-section">
        <div className="kk-container-full">
          <h2 id="industry-list-heading" className="sr-only">{t("overview.listHeading")}</h2>
          {unavailable ? (
            <IndustryState
              title={t("unavailable.title")}
              text={t("unavailable.text")}
              actions
            />
          ) : industries.length === 0 ? (
            <IndustryState
              title={t("empty.title")}
              text={t("empty.text")}
              actions
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {industries.map((industry) => (
                <article
                  key={industry.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-kubikart-lg border border-border bg-surface-white"
                >
                  <Link href={`/businesses/${industry.slug}`} className="block rounded-kubikart-sm">
                    <IndustryMedia
                      media={industry.featuredMedia}
                      title={industry.title}
                      sizes="(min-width: 1280px) 390px, (min-width: 768px) 50vw, 100vw"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="kk-heading-3">
                      <Link
                        href={`/businesses/${industry.slug}`}
                        className="rounded-kubikart-sm transition-colors hover:text-accent"
                      >
                        {industry.title}
                      </Link>
                    </h3>
                    {industry.excerptText ? (
                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted">
                        {industry.excerptText}
                      </p>
                    ) : null}
                    <Link
                      href={`/businesses/${industry.slug}`}
                      className="kk-link mt-5 inline-flex min-h-11 items-center gap-2 self-start"
                      aria-label={t("overview.viewAria", { title: industry.title })}
                    >
                      {t("overview.view")}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="kk-container-full pb-20 lg:pb-24">
        <div className="rounded-kubikart-xl bg-brand px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <h2 className="kk-heading-2 text-white">{t("cta.title")}</h2>
            <p className="mt-4 leading-7 text-white/75">{t("cta.text")}</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <Link href="/kontakt" className="kk-button kk-button-primary">{t("cta.contact")}</Link>
            <Link href="/services/brand-kit" className="kk-button border border-white/40 text-white hover:border-accent hover:text-accent">
              {t("cta.kits")}
            </Link>
          </div>
        </div>
      </section>

      {!unavailable ? (
        <IndustryOverviewJsonLd
          locale={locale}
          industries={industries}
          labels={{
            home: t("home"),
            current: t("parent"),
            description: t("overview.metadataDescription"),
          }}
        />
      ) : null}
    </main>
  );
}

function IndustryState({ title, text, actions }: { title: string; text: string; actions?: boolean }) {
  const t = useTranslations("businessIndustries");
  return (
    <div className="rounded-kubikart-lg border border-border bg-surface p-6 sm:p-8" role="status">
      <h2 className="kk-heading-3">{title}</h2>
      <p className="mt-3 max-w-2xl text-muted">{text}</p>
      {actions ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/shop" className="kk-button kk-button-primary">{t("actions.shop")}</Link>
          <Link href="/services/brand-kit" className="kk-button kk-button-secondary">{t("actions.kits")}</Link>
          <Link href="/kontakt" className="kk-link min-h-11">{t("actions.contact")}</Link>
        </div>
      ) : null}
    </div>
  );
}
