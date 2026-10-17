import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { IndustryDetailJsonLd } from "@/components/business-industries/IndustryJsonLd";
import { IndustryMedia } from "@/components/business-industries/IndustryMedia";
import { ProductCard } from "@/components/ProductCard";
import { PageHero } from "@/components/layout/PageHero";
import { BusinessKitCard } from "@/components/business-kits/BusinessKitCard";
import { Link } from "@/i18n/navigation";
import { getBusinessIndustryImage } from "@/lib/business-industry-images";
import { resolveIndustryProducts } from "@/lib/business-industries";
import {
  getAbsoluteUrl,
  getRobotsMetadata,
  normalizeLocale,
  NO_INDEX_ROBOTS,
} from "@/lib/seo";
import {
  getIndustryTranslationSlugs,
  resolveBusinessIndustrySlug,
  WordPressUnavailableError,
} from "@/lib/wordpress";

type IndustryDetailPageProps = {
  params: Promise<{ locale: string; industrySlug: string }>;
};

async function loadIndustry(locale: "de" | "en", slug: string) {
  return resolveBusinessIndustrySlug(slug, locale);
}

export async function generateMetadata({ params }: IndustryDetailPageProps): Promise<Metadata> {
  const { locale: rawLocale, industrySlug } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations("businessIndustries");
  let result;

  try {
    result = await loadIndustry(locale, industrySlug);
  } catch (error) {
    if (error instanceof WordPressUnavailableError) {
      return {
        title: t("unavailable.metadataTitle"),
        description: t("unavailable.text"),
        robots: NO_INDEX_ROBOTS,
      };
    }
    throw error;
  }
  if (!result) {
    notFound();
  }
  if (result.redirected || result.industry.slug !== industrySlug) {
    redirect(`/${locale}/businesses/${result.industry.slug}`);
  }

  const industry = result.industry;
  const imageOverride = getBusinessIndustryImage(industry.slug);
  const socialImage = industry.featuredMedia?.source_url
    || (imageOverride ? getAbsoluteUrl(imageOverride) : undefined);
  const socialImageAlt = industry.featuredMedia?.alt_text || industry.title;
  const slugs = await getIndustryTranslationSlugs(industry);
  const canonical = getAbsoluteUrl(`/${locale}/businesses/${industry.slug}`);
  const languages: Record<string, string> = Object.fromEntries(
    Object.entries(slugs).map(([language, slug]) => [
      language,
      getAbsoluteUrl(`/${language}/businesses/${slug}`),
    ]),
  );
  if (languages.de) {
    languages["x-default"] = languages.de;
  }

  return {
    title: t("detail.metadataTitle", { title: industry.title }),
    description: industry.excerptText || t("detail.metadataFallback", { title: industry.title }),
    alternates: { canonical, languages },
    robots: getRobotsMetadata(),
    openGraph: {
      title: industry.title,
      description: industry.excerptText,
      url: canonical,
      siteName: "Kubikart",
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
      images: socialImage
        ? [{ url: socialImage, alt: socialImageAlt }]
        : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title: industry.title,
      description: industry.excerptText || t("detail.metadataFallback", { title: industry.title }),
      images: socialImage ? [socialImage] : undefined,
    },
  };
}

export default async function IndustryDetailPage({ params }: IndustryDetailPageProps) {
  const { locale: rawLocale, industrySlug } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations("businessIndustries");
  let result;

  try {
    result = await loadIndustry(locale, industrySlug);
  } catch (error) {
    if (error instanceof WordPressUnavailableError) {
      return <IndustryUnavailable />;
    }
    throw error;
  }
  if (!result) {
    notFound();
  }
  if (result.redirected || result.industry.slug !== industrySlug) {
    redirect(`/${locale}/businesses/${result.industry.slug}`);
  }

  const industry = result.industry;
  const imageOverride = getBusinessIndustryImage(industry.slug);
  const products = await resolveIndustryProducts(industry, locale);
  // German nouns stay capitalised; English headings read "… for cafés & bakeries".
  const industryLabel = locale === "en" ? industry.title.toLocaleLowerCase("en") : industry.title;

  return (
    <main className="bg-page text-foreground">
      <PageHero
        breadcrumbs={[{ label: t("parent"), href: "/businesses" }, { label: industry.title }]}
        eyebrow={t("detail.eyebrow")}
        title={industry.title}
        intro={industry.excerptText || undefined}
        media={
          <figure>
            <IndustryMedia
              media={industry.featuredMedia}
              title={industry.title}
              sizes="(min-width: 1024px) 52vw, 100vw"
              priority
              fallbackSrc={imageOverride}
              fallbackAlt={industry.title}
            />
            {industry.featuredMedia?.source_url || imageOverride ? (
              <figcaption className="mt-2 text-xs text-muted">{t("detail.imageNote")}</figcaption>
            ) : null}
          </figure>
        }
      />

      {products.bundles.length > 0 ? (
        <section aria-labelledby="industry-bundles-heading" className="kk-section border-b border-border bg-surface">
          <div className="kk-container-full">
            <h2 id="industry-bundles-heading" className="kk-heading-2">{t("detail.bundlesHeading", { industry: industryLabel })}</h2>
            <p className="kk-body-large mt-4 max-w-3xl text-muted">{t("detail.bundlesIntro")}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.bundles.map((product) => <BusinessKitCard key={product.id} product={product} locale={locale} />)}
            </div>
          </div>
        </section>
      ) : null}

      {products.unavailable || products.relatedProducts.length > 0 ? (
        <section aria-labelledby="industry-products-heading" className="kk-section">
          <div className="kk-container-full">
            <h2 id="industry-products-heading" className="kk-heading-2">{t("detail.productsHeading", { industry: industryLabel })}</h2>
            <p className="kk-body-large mt-4 max-w-3xl text-muted">{t("detail.productsIntro")}</p>
            {products.unavailable ? (
              <p className="mt-6 rounded-kubikart-md border border-border bg-surface p-5 text-muted" role="status">
                {t("productsUnavailable")}
              </p>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.relatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {industry.contentHtml ? (
        <section aria-labelledby="industry-content-heading" className="kk-section">
          <div className="kk-container-full grid gap-8 lg:grid-cols-[0.3fr_0.7fr] lg:gap-14">
            <div>
              <p className="kk-eyebrow">{t("detail.contentEyebrow")}</p>
              <h2 id="industry-content-heading" className="kk-heading-2 mt-3">{t("detail.contentHeading")}</h2>
            </div>
            <div
              className="min-w-0 space-y-5 leading-7 text-muted [&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:decoration-accent [&_a]:underline-offset-4 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-5 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-brand [&_h3]:mt-7 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-brand [&_h4]:mt-6 [&_h4]:font-heading [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-brand [&_img]:h-auto [&_img]:max-w-full [&_li]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:max-w-3xl [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border-b [&_td]:border-border [&_td]:p-3 [&_th]:border-b [&_th]:border-border [&_th]:p-3 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: industry.contentHtml }}
            />
          </div>
        </section>
      ) : null}

      <section className="kk-container-full pb-20 lg:pb-24">
        <div className="rounded-kubikart-xl bg-brand px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <h2 className="kk-heading-2 text-white">{t("cta.title")}</h2>
            <p className="mt-4 leading-7 text-white/75">{t("cta.text")}</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <Link href={`/sonderanfertigung?industry=${encodeURIComponent(industry.slug)}`} className="kk-button kk-button-primary">{t("cta.contact")}</Link>
            <Link href="/shop" className="kk-button border border-white/40 text-white hover:border-accent hover:text-accent">
              {t("cta.shop")}
            </Link>
          </div>
        </div>
      </section>

      <IndustryDetailJsonLd
        industry={industry}
        locale={locale}
        parentLabel={t("parent")}
        homeLabel={t("home")}
      />
    </main>
  );
}

function IndustryUnavailable() {
  const t = useTranslations("businessIndustries");
  return (
    <main className="bg-page">
      <section className="kk-container-full py-16 lg:py-24">
        <div className="rounded-kubikart-lg border border-border bg-surface p-6 sm:p-8" role="status">
          <h1 className="kk-heading-1">{t("unavailable.title")}</h1>
          <p className="mt-4 max-w-2xl text-muted">{t("unavailable.text")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/businesses" className="kk-button kk-button-secondary">{t("actions.back")}</Link>
            <Link href="/kontakt" className="kk-button kk-button-primary">{t("actions.contact")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
