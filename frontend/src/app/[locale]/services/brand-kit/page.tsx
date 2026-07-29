import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BusinessKitCard } from "@/components/business-kits/BusinessKitCard";
import { Link } from "@/i18n/navigation";
import { getBusinessKits } from "@/lib/business-kits";
import {
  buildPageMetadata,
  getAbsoluteUrl,
  getLocalizedPath,
  normalizeLocale,
  SEO_ROUTE_SEGMENTS,
} from "@/lib/seo";

type BrandKitPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BrandKitPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations("businessKitsOverview");

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.brandKit,
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  });
}

export default async function BrandKitPage({ params }: BrandKitPageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations("businessKitsOverview");

  let kits = null;
  let unavailable = false;
  try {
    kits = await getBusinessKits(locale);
  } catch {
    unavailable = true;
  }

  const products = kits?.products || [];
  const pageUrl = getAbsoluteUrl(getLocalizedPath(locale, SEO_ROUTE_SEGMENTS.brandKit[locale]));
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("heading"),
    description: t("intro"),
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: getAbsoluteUrl(`/${locale}/shop/${product.slug}`),
      })),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: getAbsoluteUrl(`/${locale}`) },
      { "@type": "ListItem", position: 2, name: t("breadcrumbCurrent"), item: pageUrl },
    ],
  };

  return (
    <main className="bg-page text-foreground">
      <section className="border-b border-border bg-surface">
        <div className="kk-container-full py-12 lg:py-16">
          <nav aria-label={t("breadcrumbLabel")} className="text-sm text-muted">
            <Link href="/" className="kk-link">{t("breadcrumbHome")}</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">{t("breadcrumbCurrent")}</span>
          </nav>

          <div className="mt-8 max-w-4xl">
            <p className="kk-eyebrow">{t("eyebrow")}</p>
            <h1 className="kk-page-intro-heading mt-3">{t("heading")}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">{t("intro")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#business-kits" className="kk-button kk-button-primary">{t("explore")}</a>
              <Link href="/sonderanfertigung" className="kk-button kk-button-secondary">{t("customKit")}</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="business-kits" aria-labelledby="business-kits-heading" className="kk-section scroll-mt-28">
        <div className="kk-container-full">
          <div className="max-w-3xl">
            <p className="kk-eyebrow">{t("gridEyebrow")}</p>
            <h2 id="business-kits-heading" className="kk-heading-2 mt-3">{t("gridHeading")}</h2>
            <p className="mt-4 text-muted">{t("gridIntro")}</p>
          </div>

          {unavailable ? (
            <div className="mt-8 rounded-kubikart-lg border border-border bg-surface p-6 sm:p-8" role="status">
              <h3 className="kk-heading-3">{t("unavailableTitle")}</h3>
              <p className="mt-3 text-muted">{t("unavailableText")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/kontakt" className="kk-button kk-button-primary">{t("contact")}</Link>
                <Link href="/shop" className="kk-button kk-button-secondary">{t("shop")}</Link>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-kubikart-lg border border-border bg-surface p-6 sm:p-8">
              <h3 className="kk-heading-3">{t("emptyTitle")}</h3>
              <p className="mt-3 text-muted">{t("emptyText")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/kontakt" className="kk-button kk-button-primary">{t("contact")}</Link>
                <Link href="/shop" className="kk-button kk-button-secondary">{t("shop")}</Link>
              </div>
            </div>
          ) : (
            <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => <BusinessKitCard key={product.id} product={product} locale={locale} />)}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="kk-container-full grid gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-16">
          <div>
            <p className="kk-eyebrow">{t("chooseEyebrow")}</p>
            <h2 className="kk-heading-2 mt-3">{t("chooseHeading")}</h2>
            <p className="mt-4 text-muted">{t("chooseIntro")}</p>
          </div>
          <ol className="space-y-5">
            {[t("chooseStep1"), t("chooseStep2"), t("chooseStep3")].map((step, index) => (
              <li key={step} className="flex gap-4 border-b border-border pb-5 last:border-0 last:pb-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand font-heading text-sm font-bold text-white">{index + 1}</span>
                <p className="pt-1 text-sm leading-6 text-foreground sm:text-base">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="kk-section">
        <div className="kk-container-full grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="kk-eyebrow">{t("customiseEyebrow")}</p>
            <h2 className="kk-heading-2 mt-3">{t("customiseHeading")}</h2>
            <p className="mt-4 max-w-2xl text-muted">{t("customiseText")}</p>
            <p className="mt-4 font-semibold text-brand">{t("customiseCaveat")}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[t("optionBranding"), t("optionColours"), t("optionQr"), t("optionQuantity"), t("optionWording"), t("optionDimensions")].map((option) => (
              <li key={option} className="flex min-h-12 items-center gap-3 rounded-kubikart-md border border-border bg-surface px-4 py-3 text-sm font-semibold text-brand">
                <span className="text-accent" aria-hidden="true">✓</span>{option}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="kk-container-full">
          <div className="rounded-kubikart-xl bg-brand px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-3xl">
              <p className="kk-eyebrow text-accent">{t("ctaEyebrow")}</p>
              <h2 className="mt-3 font-heading text-3xl font-bold">{t("ctaHeading")}</h2>
              <p className="mt-4 text-white/80">{t("ctaText")}</p>
            </div>
            <div className="mt-7 flex shrink-0 flex-wrap gap-3 lg:mt-0">
              <Link href="/sonderanfertigung" className="kk-button kk-button-primary">{t("customKit")}</Link>
              <Link href="/kontakt" className="kk-button border border-white/30 bg-transparent text-white hover:bg-white/10">{t("contact")}</Link>
            </div>
          </div>
        </div>
      </section>

      {!unavailable ? (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        </>
      ) : null}
    </main>
  );
}
