import Image from "next/image";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { IndustryDetailJsonLd } from "@/components/business-industries/IndustryJsonLd";
import { IndustryMedia } from "@/components/business-industries/IndustryMedia";
import { ProductCard } from "@/components/ProductCard";
import { Link } from "@/i18n/navigation";
import { getBusinessIndustryImage } from "@/lib/business-industry-images";
import { isWooCommercePlaceholderImage } from "@/lib/business-kits";
import { resolveIndustryProducts } from "@/lib/business-industries";
import { formatProductPrice } from "@/lib/product-page";
import {
  getAbsoluteUrl,
  getRobotsMetadata,
  normalizeLocale,
  NO_INDEX_ROBOTS,
} from "@/lib/seo";
import {
  getIndustryTranslationSlugs,
  resolveBusinessIndustrySlug,
  sanitizeWordPressContent,
  WordPressUnavailableError,
} from "@/lib/wordpress";
import type { WCProduct } from "@/lib/woocommerce";

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

  return (
    <main className="bg-page text-foreground">
      <section className="border-b border-border bg-surface">
        <div className="kk-container-full py-10 lg:py-14">
          <nav aria-label={t("breadcrumbLabel")} className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
            <Link href="/" className="kk-link">{t("home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/businesses" className="kk-link">{t("parent")}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{industry.title}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.48fr_0.52fr] lg:items-center lg:gap-12">
            <div>
              <p className="kk-eyebrow">{t("detail.eyebrow")}</p>
              <h1 className="kk-page-intro-heading mt-3">{industry.title}</h1>
              {industry.excerptText ? (
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  {industry.excerptText}
                </p>
              ) : null}
            </div>
            <IndustryMedia
              media={industry.featuredMedia}
              title={industry.title}
              sizes="(min-width: 1024px) 52vw, 100vw"
              priority
              fallbackSrc={imageOverride}
              fallbackAlt={industry.title}
            />
          </div>
        </div>
      </section>

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

      {products.featuredKit ? (
        <FeaturedIndustryKit product={products.featuredKit} />
      ) : null}

      {industry.relatedProductIds.length > 0 ? (
        <section aria-labelledby="industry-products-heading" className="kk-section">
          <div className="kk-container-full">
            <p className="kk-eyebrow">{t("detail.productsEyebrow")}</p>
            <h2 id="industry-products-heading" className="kk-heading-2 mt-3">{t("detail.productsHeading")}</h2>
            {products.unavailable ? (
              <p className="mt-6 rounded-kubikart-md border border-border bg-surface p-5 text-muted" role="status">
                {t("productsUnavailable")}
              </p>
            ) : products.relatedProducts.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.relatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <p className="mt-6 text-muted">{t("detail.noProducts")}</p>
            )}
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
            <Link href="/kontakt" className="kk-button kk-button-primary">{t("cta.contact")}</Link>
            <Link href="/services/brand-kit" className="kk-button border border-white/40 text-white hover:border-accent hover:text-accent">
              {t("cta.kits")}
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

function FeaturedIndustryKit({ product }: { product: WCProduct }) {
  const t = useTranslations("businessIndustries");
  const image = product.images.find((candidate) => !isWooCommercePlaceholderImage(candidate));
  const price = Number.parseFloat(product.price);

  return (
    <section aria-labelledby="featured-industry-kit-heading" className="border-y border-border bg-surface">
      <div className="kk-container-full grid gap-8 py-12 lg:grid-cols-2 lg:items-center lg:py-16">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-kubikart-lg border border-border bg-page">
          {image ? (
            <Image src={image.src} alt={image.alt || product.name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" unoptimized />
          ) : (
            <span className="text-sm text-muted" role="img" aria-label={t("missingProductImage", { title: product.name })}>
              {t("missingProductImageText")}
            </span>
          )}
        </div>
        <div>
          <p className="kk-eyebrow">{t("detail.kitEyebrow")}</p>
          <h2 id="featured-industry-kit-heading" className="kk-heading-2 mt-3">{product.name}</h2>
          {product.short_description ? (
            <div
              className="mt-4 leading-7 text-muted [&_a]:text-brand [&_a]:underline [&_p]:max-w-2xl"
              dangerouslySetInnerHTML={{ __html: sanitizeWordPressContent(product.short_description) }}
            />
          ) : null}
          {Number.isFinite(price) && product.purchasable !== false ? (
            <p className="mt-5 font-heading text-xl font-semibold text-accent">
              {formatProductPrice({ amount: price, currency: "EUR" })}
            </p>
          ) : null}
          {product.stock_status ? (
            <p className={`mt-2 text-sm font-semibold ${product.stock_status === "outofstock" ? "text-danger" : "text-muted"}`}>
              {product.stock_status === "outofstock" ? t("outOfStock") : t("available")}
            </p>
          ) : null}
          <Link href={`/shop/${product.slug}`} className="kk-button kk-button-primary mt-7">
            {t("detail.viewKit")}
          </Link>
        </div>
      </div>
    </section>
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
