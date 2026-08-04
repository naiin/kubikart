"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isWooCommercePlaceholderImage } from "@/lib/business-kits";
import { formatProductPrice, type ProductPageProduct } from "@/lib/product-page";
import type { WCProduct, WCReview } from "@/lib/woocommerce";

export function BusinessKitSupportStrip() {
  const t = useTranslations("businessKitProduct");
  const items = [t("supportCoordinated"), t("supportConfiguration"), t("supportPayment"), t("supportEnquiry")];

  return (
    <section aria-label={t("supportLabel")} className="border-y border-border bg-brand text-white">
      <div className="kk-container-full grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <p key={item} className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <span className="text-accent" aria-hidden="true">✓</span>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} className="h-4 w-4" viewBox="0 0 20 20" fill={index < rating ? "currentColor" : "none"}>
          <path d="M10 1.25l2.47 5.01 5.53.8-4 3.9.95 5.5L10 13.77l-4.95 2.69.95-5.5-4-3.9 5.53-.8L10 1.25z" stroke="currentColor" />
        </svg>
      ))}
    </span>
  );
}

export function BusinessKitDetails({ product, reviews }: { product: ProductPageProduct; reviews: WCReview[] }) {
  const t = useTranslations("businessKitProduct");
  const locale = useLocale();
  const hasSpecifications = Boolean(product.attributes?.length || product.weight || product.dimensions);

  return (
    <div className="kk-container-full space-y-16 py-16 lg:space-y-20 lg:py-20">
      {product.descriptionHtml ? (
        <section aria-labelledby="kit-details-heading" className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr] lg:gap-12 xl:grid-cols-[0.32fr_0.68fr] xl:gap-16">
          <div>
            <p className="kk-eyebrow">{t("detailsEyebrow")}</p>
            <h2 id="kit-details-heading" className="kk-heading-2 mt-3">{t("detailsTitle")}</h2>
          </div>
          <div
            className="min-w-0 space-y-4 leading-7 text-muted [&_a]:text-brand [&_a]:underline [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-brand [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-brand [&_li]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:max-w-3xl [&_table]:w-full [&_table]:min-w-[34rem] [&_td]:border-b [&_td]:border-border [&_td]:p-3 [&_th]:border-b [&_th]:border-border [&_th]:p-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </section>
      ) : null}

      {hasSpecifications ? (
        <section aria-labelledby="kit-specifications-heading" className="rounded-kubikart-xl border border-border bg-surface p-6 sm:p-8">
          <h2 id="kit-specifications-heading" className="kk-heading-3">{t("specificationsTitle")}</h2>
          <dl className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {product.attributes?.map((attribute) => (
              <div key={attribute.name} className="grid grid-cols-[minmax(7rem,0.4fr)_1fr] gap-4 border-b border-border py-4">
                <dt className="font-semibold text-brand">{attribute.name}</dt>
                <dd className="text-muted">{attribute.values.join(", ")}</dd>
              </div>
            ))}
            {product.weight ? (
              <div className="grid grid-cols-[minmax(7rem,0.4fr)_1fr] gap-4 border-b border-border py-4">
                <dt className="font-semibold text-brand">{t("weight")}</dt>
                <dd className="text-muted">{product.weight} kg</dd>
              </div>
            ) : null}
            {product.dimensions ? (
              <div className="grid grid-cols-[minmax(7rem,0.4fr)_1fr] gap-4 border-b border-border py-4">
                <dt className="font-semibold text-brand">{t("dimensions")}</dt>
                <dd className="text-muted">
                  {[product.dimensions.length, product.dimensions.width, product.dimensions.height].join(" × ")} cm
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {reviews.length > 0 ? (
        <section aria-labelledby="kit-reviews-heading">
          <p className="kk-eyebrow">{t("reviewsEyebrow")}</p>
          <h2 id="kit-reviews-heading" className="kk-heading-2 mt-3">{t("reviewsTitle")}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-kubikart-lg border border-border bg-surface-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-accent">
                    <ReviewStars rating={review.rating} />
                    <span className="font-semibold text-brand">{review.reviewer}</span>
                  </div>
                  <time className="text-xs text-muted" dateTime={review.date_created}>
                    {new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { dateStyle: "medium" }).format(new Date(review.date_created))}
                  </time>
                </div>
                <div className="mt-4 text-sm leading-6 text-muted" dangerouslySetInnerHTML={{ __html: review.review }} />
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function BusinessKitCustomisation({ product }: { product: ProductPageProduct }) {
  const t = useTranslations("businessKitProduct");
  const choices = [
    ...product.personalizationOptions.map((option) => option.label),
    ...(product.attributes || []).map((attribute) => attribute.name),
  ].filter((value, index, all) => all.indexOf(value) === index);

  if (choices.length === 0) return null;

  return (
    <section aria-labelledby="kit-customisation-heading" className="kk-container-full pb-16 lg:pb-20">
      <div className="grid gap-8 rounded-kubikart-xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-[0.42fr_0.58fr] lg:p-10">
        <div>
          <p className="kk-eyebrow">{t("customisationEyebrow")}</p>
          <h2 id="kit-customisation-heading" className="kk-heading-2 mt-3">{t("customisationTitle")}</h2>
          <p className="mt-4 leading-7 text-muted">{t("customisationText")}</p>
        </div>
        <ul className="grid content-start gap-3 sm:grid-cols-2">
          {choices.map((choice) => (
            <li key={choice} className="flex min-h-12 items-center gap-3 rounded-kubikart-md border border-border bg-surface-white px-4 py-3 font-semibold text-brand">
              <span className="text-accent" aria-hidden="true">✓</span>
              {choice}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function BusinessKitProcess() {
  const t = useTranslations("businessKitProduct");
  const steps = [1, 2, 3, 4, 5].map((number) => ({
    number,
    title: t(`process${number}Title`),
    text: t(`process${number}Text`),
  }));

  return (
    <section aria-labelledby="kit-process-heading" className="bg-surface">
      <div className="kk-container-full py-16 lg:py-20">
        <p className="kk-eyebrow">{t("processEyebrow")}</p>
        <h2 id="kit-process-heading" className="kk-heading-2 mt-3">{t("processTitle")}</h2>
        <ol className="mt-9 grid gap-6 md:grid-cols-5">
          {steps.map((step) => (
            <li key={step.number} className="relative border-l border-border pl-5 md:border-l-0 md:border-t md:pt-6 md:pl-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-heading text-sm font-bold text-white">
                {step.number}
              </span>
              <h3 className="mt-4 font-heading text-base font-bold text-brand">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function getKitImage(product: WCProduct) {
  const image = product.images[0];
  return image && !isWooCommercePlaceholderImage(image) ? image : undefined;
}

export function OtherBusinessKits({ products }: { products: WCProduct[] }) {
  const t = useTranslations("businessKitProduct");
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="other-kits-heading" className="kk-container-full py-16 lg:py-20">
      <p className="kk-eyebrow">{t("otherEyebrow")}</p>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 id="other-kits-heading" className="kk-heading-2 mt-3">{t("otherTitle")}</h2>
        <Link href="/services/brand-kit" className="kk-link min-h-11">{t("allKits")}</Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const image = getKitImage(product);
          const price = Number.parseFloat(product.price);
          return (
            <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-kubikart-lg border border-border bg-surface-white">
              <Link href={`/shop/${product.slug}`} className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface">
                {image ? (
                  <Image src={image.src} alt={image.alt || product.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform group-hover:scale-[1.025]" unoptimized />
                ) : (
                  <span className="flex flex-col items-center gap-3 px-5 text-center text-sm text-muted" role="img" aria-label={t("missingImage", { name: product.name })}>
                    <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                    </svg>
                    {t("imagePending")}
                  </span>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-heading text-lg font-bold text-brand">
                  <Link href={`/shop/${product.slug}`} className="hover:text-accent">{product.name}</Link>
                </h3>
                {Number.isFinite(price) && product.purchasable !== false ? (
                  <p className="mt-3 font-heading text-lg font-bold text-accent">
                    {formatProductPrice({ amount: price, currency: "EUR" })}
                  </p>
                ) : null}
                {product.stock_status ? (
                  <p className={`mt-1 text-xs font-semibold ${product.stock_status === "outofstock" ? "text-danger" : "text-muted"}`}>
                    {product.stock_status === "outofstock" ? t("outOfStock") : t("available")}
                  </p>
                ) : null}
                <Link href={`/shop/${product.slug}`} className="kk-button kk-button-secondary mt-5 w-full">
                  {t("viewKit", { name: product.name })}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function BusinessKitFinalCta() {
  const t = useTranslations("businessKitProduct");
  return (
    <section className="kk-container-full pb-20 lg:pb-24">
      <div className="rounded-kubikart-xl bg-brand px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <p className="kk-eyebrow text-accent">{t("ctaEyebrow")}</p>
          <h2 className="kk-heading-2 mt-3 text-white">{t("ctaTitle")}</h2>
          <p className="mt-4 leading-7 text-white/75">{t("ctaText")}</p>
        </div>
        <div className="mt-7 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
          <Link href="/sonderanfertigung" className="kk-button kk-button-primary">{t("ctaRequest")}</Link>
          <Link href="/kontakt" className="kk-button border border-white/40 text-white hover:border-accent hover:text-accent">{t("ctaContact")}</Link>
        </div>
      </div>
    </section>
  );
}
