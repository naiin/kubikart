"use client";

import Image from "next/image";
import { MessageCircleQuestion, PackageCheck, Search, ShieldCheck, Star, Truck } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatProductPrice, type ProductPageProduct } from "@/lib/product-page";
import type { WCReview } from "@/lib/woocommerce";
import { ProductPurchaseForm } from "./ProductPurchaseForm";
import { StickyMobileCTA } from "./StickyMobileCTA";

type ProductShowcaseLayoutProps = {
  product: ProductPageProduct;
  formId: string;
  reviews: WCReview[];
  locale: string;
};

function ProductRatingSummary({
  rating,
  count,
  compact = false,
}: {
  rating: number;
  count: number;
  compact?: boolean;
}) {
  const t = useTranslations("productPage");

  if (count <= 0 || rating <= 0) {
    return <p className={compact ? "text-sm text-gray-500" : "text-[15px] text-gray-500"}>{t("reviewsEmpty")}</p>;
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4.5 w-4.5 ${index < Math.round(rating) ? "fill-accent-600 text-accent-600" : "fill-gray-200 text-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-navy-900">{rating.toFixed(1)} / 5</span>
      <span className="text-sm text-gray-500">
        ({count} {count === 1 ? t("reviewSingular") : t("reviewPlural")})
      </span>
    </div>
  );
}

function ProductMediaGallery({ product }: { product: ProductPageProduct }) {
  const t = useTranslations("productPage");
  const galleryImages = product.images.length ? product.images : [{ src: "/placeholders/product-detail-cream.svg", alt: `${product.name} von Kubikart` }];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const activeImage = galleryImages[activeIndex] || galleryImages[0];

  return (
    <>
      <section aria-label={t("galleryLabel")} className="grid grid-cols-1 gap-4 md:grid-cols-[96px_1fr] md:gap-6">
        <div className="order-2 flex gap-3 overflow-x-auto pb-1 md:order-1 md:flex-col md:overflow-visible md:pb-0">
          {galleryImages.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${product.slug}-${image.src}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-[112px] w-[84px] shrink-0 overflow-hidden rounded-2xl border transition-all ${
                  isActive ? "border-accent-600 ring-2 ring-accent-600" : "border-gray-200 hover:border-gray-300"
                }`}
                aria-label={t("galleryViewImage", { index: index + 1 })}
                aria-pressed={isActive}
              >
                <Image src={image.src} alt={image.alt} fill sizes="84px" className="object-cover" unoptimized />
              </button>
            );
          })}
        </div>

        <div className="relative order-1 overflow-hidden rounded-[28px] border border-gray-200 bg-linear-to-br from-white via-cream-50 to-accent-100/50 shadow-[0_28px_80px_rgba(6,20,38,0.09)] md:order-2">
          <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-r from-white via-white/80 to-accent-100/45" aria-hidden="true" />
          <div className="relative aspect-[4/5]">
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-contain p-6 sm:p-8"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="absolute right-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900 shadow-md transition-shadow hover:shadow-lg"
            aria-label={t("galleryViewImage", { index: activeIndex + 1 })}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </section>

      {zoomed ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setZoomed(false)} role="dialog">
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
          <div className="relative h-[85vh] w-[85vw] max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <Image src={activeImage.src} alt={activeImage.alt} fill sizes="85vw" className="object-contain" unoptimized />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProductTrustPanel({ product }: { product: ProductPageProduct }) {
  const t = useTranslations("productPage");
  const items = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: product.trustItems[0] || t("trustSecurePayment"),
      text: product.paymentHints[0] || t("paymentHint1"),
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: product.trustItems[1] || t("trustFastProduction"),
      text: product.productionTime,
    },
    {
      icon: <PackageCheck className="h-5 w-5" />,
      title: product.trustItems[3] || t("trustCarefullyPackaged"),
      text: product.shippingNote,
    },
    {
      icon: <MessageCircleQuestion className="h-5 w-5" />,
      title: product.trustItems[2] || t("trustPersonalSupport"),
      text: t("askQuestion"),
    },
  ];

  return (
    <div className="mt-8 rounded-[28px] border border-gray-200 bg-linear-to-br from-white to-cream-50 p-6 shadow-[0_18px_50px_rgba(6,20,38,0.05)]">
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3.5">
            <span className="mt-0.5 text-navy-900">{item.icon}</span>
            <div>
              <p className="text-sm font-bold text-navy-900">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDetailTabs({
  product,
  reviews,
  locale,
}: {
  product: ProductPageProduct;
  reviews: WCReview[];
  locale: string;
}) {
  const t = useTranslations("productPage");
  const descriptionSection = product.detailSections.find((section) => section.id === "beschreibung") || product.detailSections[0];
  const personalizationSection = product.detailSections.find((section) => section.id === "personalisierung");
  const materialSection = product.detailSections.find((section) => section.id === "material-und-masse");
  const shippingSection = product.detailSections.find((section) => section.id === "versand-und-fertigung");
  const careSection = product.detailSections.find((section) => section.id === "pflegehinweise");
  const [activeTab, setActiveTab] = useState<"description" | "details" | "shipping" | "reviews">("description");
  const reviewCount = reviews.length || product.reviewCount || 0;
  const dateLocale = locale === "de" ? "de-DE" : "en-US";

  const tabs = [
    { id: "description" as const, label: descriptionSection?.title || t("detailDescription") },
    { id: "details" as const, label: t("detailsLabel") },
    { id: "shipping" as const, label: shippingSection?.title || t("detailShipping") },
    { id: "reviews" as const, label: `${t("reviewsTitle")} (${reviewCount})` },
  ];

  return (
    <section className="mx-auto mt-20 max-w-5xl px-5 sm:px-8 lg:px-0">
      <div className="flex flex-wrap gap-0 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3.5 text-sm font-bold transition-colors ${
              activeTab === tab.id ? "text-navy-900" : "text-gray-500 hover:text-gray-700"
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
            {activeTab === tab.id ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-600" /> : null}
          </button>
        ))}
      </div>

      <div className="py-10" role="tabpanel">
        {activeTab === "description" && descriptionSection ? (
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">{product.name}</h2>
            <div className="mt-4 max-w-3xl space-y-4 text-[15px] leading-7 text-gray-600">
              {descriptionSection.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "details" ? (
          <div className="space-y-8">
            <div className="space-y-4">
              {product.quickFacts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-2 border-b border-gray-100 pb-4 last:border-0 sm:flex-row sm:items-start">
                  <span className="w-44 shrink-0 text-sm font-semibold text-navy-900">{fact.label}</span>
                  <span className="text-sm leading-7 text-gray-600">{fact.value}</span>
                </div>
              ))}
            </div>

            {[personalizationSection, materialSection, careSection]
              .filter((section): section is NonNullable<typeof section> => Boolean(section))
              .map((section) => (
                <div key={section.id}>
                  <h3 className="text-lg font-bold text-navy-900">{section.title}</h3>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600">
                    {section.content.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : null}

        {activeTab === "shipping" ? (
          <div className="space-y-3">
            {[product.productionTime, product.shippingNote, ...(shippingSection?.content || [])].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-600" aria-hidden="true" />
                <span className="text-[15px] leading-7 text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "reviews" ? (
          reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-3.5 w-3.5 ${index < review.rating ? "fill-accent-600 text-accent-600" : "fill-gray-200 text-gray-200"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-navy-900">{review.reviewer}</span>
                      {review.verified ? <span className="text-xs font-medium text-green-600">✓ {t("reviewVerified")}</span> : null}
                    </div>
                    <time className="text-xs text-gray-400">
                      {new Date(review.date_created).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: review.review }} />
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-gray-500">{t("reviewsEmpty")}</p>
          )
        ) : null}
      </div>
    </section>
  );
}

export function ProductShowcaseLayout({ product, formId, reviews, locale }: ProductShowcaseLayoutProps) {
  const reviewCount = reviews.length || product.reviewCount || 0;
  const reviewRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : product.averageRating || 0;

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          <ProductMediaGallery product={product} />

          <div>
            {product.badges[0] ? (
              <span className="inline-block rounded-md border border-accent-600 bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-600">
                {product.badges[0]}
              </span>
            ) : null}

            <h1 className="mt-4 text-[31px] font-extrabold leading-[1.08] tracking-[-0.035em] text-navy-900 sm:text-[42px]">{product.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-500">{product.subtitle}</p>

            <div className="mt-4">
              <ProductRatingSummary rating={reviewRating} count={reviewCount} />
            </div>

            <div className="mt-5">
              <p className="text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[34px]">{formatProductPrice(product.price)}</p>
              <p className="mt-1 text-sm text-gray-500">{product.priceNote}</p>
            </div>

            <p className="mt-6 max-w-[42rem] text-[15px] leading-7 text-gray-600">{product.shortDescription}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              {product.badges.slice(1).map((badge) => (
                <span key={badge} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-navy-900">
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {product.quickFacts.map((fact) => (
                <div key={fact.label} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_12px_36px_rgba(6,20,38,0.04)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{fact.label}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-950">{fact.value}</p>
                </div>
              ))}
            </div>

            <div id="personalisierung" className="mt-8 scroll-mt-28">
              <ProductPurchaseForm product={product} formId={formId} showHeaderPrice={false} />
            </div>

            <ProductTrustPanel product={product} />
          </div>
        </div>
      </section>

      <ProductDetailTabs product={product} reviews={reviews} locale={locale} />
      <StickyMobileCTA product={product} formId={formId} />
    </>
  );
}
