"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductBenefits } from "@/components/product/ProductBenefits";
import { ProductFAQ } from "@/components/product/ProductFAQ";
import { ProductLeadCTA } from "@/components/product/ProductLeadCTA";
import { ProductHowItWorks } from "@/components/product/ProductHowItWorks";
import { readCart, writeCart } from "@/lib/cart";
import { formatProductPrice, type ProductPageProduct } from "@/lib/product-page";
import {
  buildProductCustomization,
  countProductFieldCharacters,
  createProductSubmissionLock,
  getConfiguredUnitPrice,
  getMeaningfulFieldHelperText,
  getProductFieldPresentation,
  isProductConfigurationPurchasable,
  limitProductFieldValue,
  shouldAppendOptionalMarker,
  validateProductConfiguration,
  type ProductConfigurationState,
} from "@/lib/product-configuration";
import type { WCReview } from "@/lib/woocommerce";
import PayPalExpressButton from "@/components/checkout/PayPalExpressButton";
import {
  BusinessKitCustomisation,
  BusinessKitDetails,
  BusinessKitFinalCta,
  BusinessKitProcess,
  BusinessKitSupportStrip,
  OtherBusinessKits,
} from "@/components/business-kits/BusinessKitProductSections";
import { isWooCommercePlaceholderImage } from "@/lib/business-kits";
import type { WCProduct } from "@/lib/woocommerce";

function getInitialSelections(product: ProductPageProduct) {
  const initialSelections: Record<string, string> = {};

  for (const option of product.personalizationOptions) {
    const initialValue = option.defaultValue || option.options?.[0]?.value;
    if (initialValue) {
      initialSelections[option.id] = initialValue;
    }
  }

  return {
    ...initialSelections,
    ...product.defaultOptionValues,
  };
}

function getSelectedVariation(product: ProductPageProduct, selectedOptions: Record<string, string>) {
  if (!product.variations?.length) {
    return undefined;
  }

  return product.variations.find((variation) =>
    Object.entries(variation.attributes).every(([attributeId, optionValue]) => selectedOptions[attributeId] === optionValue),
  );
}

// ─── Star Rating ────────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const t = useTranslations("productPage");
  if (count <= 0) return null;

  return (
    <div className="flex items-center gap-2" aria-label={t("ratingLabel", { rating: rating.toFixed(1), count })}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-4.5 w-4.5" viewBox="0 0 20 20" fill={i < Math.round(rating) ? "#f78801" : "#e5e7eb"} aria-hidden="true">
            <path d="M10 1.25l2.47 5.01 5.53.8-4 3.9.95 5.5L10 13.77l-4.95 2.69.95-5.5-4-3.9 5.53-.8L10 1.25z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-gray-500">({count} {count === 1 ? t("reviewSingular") : t("reviewPlural")})</span>
    </div>
  );
}

// ─── Quantity Selector ──────────────────────────────────────────────────────────

function QuantitySelector({ quantity, onChange }: { quantity: number; onChange: (q: number) => void }) {
  const t = useTranslations("productPage");
  return (
    <div className="flex h-13 w-30.5 items-center rounded-[10px] border border-gray-200">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="flex h-full w-10 items-center justify-center text-lg text-gray-700 transition-colors hover:text-navy-900 disabled:opacity-40"
        aria-label={t("quantityDecrease")}
      >
        −
      </button>
      <span className="flex-1 text-center text-[15px] font-bold text-navy-900">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, quantity + 1))}
        disabled={quantity >= 99}
        className="flex h-full w-10 items-center justify-center text-lg text-gray-700 transition-colors hover:text-navy-900 disabled:opacity-40"
        aria-label={t("quantityIncrease")}
      >
        +
      </button>
    </div>
  );
}

// ─── Product Gallery ────────────────────────────────────────────────────────────

function ProductGallery({
  images,
  activeIndex,
  onSelect,
  aspect = "portrait",
}: {
  images: { src: string; alt: string }[];
  activeIndex: number;
  onSelect: (i: number) => void;
  aspect?: "portrait" | "landscape";
}) {
  const t = useTranslations("productPage");
  const active = images[activeIndex] || images[0];
  const [zoomed, setZoomed] = useState(false);
  const aspectClass = aspect === "landscape" ? "aspect-[4/3]" : "aspect-[4/5]";

  useEffect(() => {
    if (!zoomed) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(false);
      if (e.key === "ArrowLeft") onSelect((activeIndex - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onSelect((activeIndex + 1) % images.length);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zoomed, activeIndex, images.length, onSelect]);

  return (
    <>
      {!active ? (
        <div className={`flex ${aspectClass} items-center justify-center rounded-kubikart-lg border border-border bg-surface text-center text-sm text-muted`}>
          <div>
            <svg className="mx-auto mb-3 h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
            </svg>
            {t("imageUnavailable")}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[96px_1fr] md:gap-6">
        {/* Thumbnails – vertical on desktop, horizontal on mobile */}
        <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={`relative shrink-0 overflow-hidden rounded-xl transition-all ${
                i === activeIndex ? "border-2 border-accent ring-2 ring-accent/20" : "border border-border hover:border-border-strong"
              }`}
              style={{ width: 84, height: 112 }}
              aria-label={t("galleryViewImage", { index: i + 1 })}
              aria-pressed={i === activeIndex}
            >
              <Image src={img.src} alt={img.alt} fill sizes="84px" className="object-cover" unoptimized />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className={`relative order-1 ${aspectClass} overflow-hidden rounded-kubikart-lg border border-border bg-surface md:order-2`}>
          <Image src={active.src} alt={active.alt} fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="absolute bottom-4 right-4 flex h-10.5 w-10.5 items-center justify-center rounded-full bg-white shadow-md transition-shadow hover:shadow-lg"
            aria-label={t("galleryZoom")}
          >
            <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              <path strokeLinecap="round" d="M11 8v6M8 11h6" />
            </svg>
          </button>
        </div>
      </div>
      )}

      {/* Lightbox overlay */}
      {zoomed && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-label={t("galleryPreview")}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={t("galleryClose")}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[85vh] w-[85vw] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={active.src} alt={active.alt} fill sizes="85vw" className="object-contain" unoptimized />
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect((activeIndex - 1 + images.length) % images.length);
                }}
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label={t("galleryPrevious")}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect((activeIndex + 1) % images.length);
                }}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label={t("galleryNext")}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── Personalization Form ───────────────────────────────────────────────────────

function PersonalizationForm({
  canAddToCart,
  product,
  purchaseProductId,
  quantity,
  displayedPrice,
  shippingRate,
  selectedOptions,
  textInputs,
  checkboxValues,
  customizations,
  validationErrors,
  addedToCart,
  setQuantity,
  setCheckboxValue,
  onOptionSelect,
  onTextInput,
  onAddToCart,
}: {
  canAddToCart: boolean;
  product: ProductPageProduct;
  purchaseProductId: number;
  quantity: number;
  displayedPrice: number;
  shippingRate: { id: string; name: string; price: number };
  selectedOptions: Record<string, string>;
  textInputs: Record<string, string>;
  checkboxValues: Record<string, boolean>;
  customizations: Record<string, string>;
  validationErrors: Record<string, string>;
  addedToCart: boolean;
  setQuantity: (q: number) => void;
  setCheckboxValue: (optionId: string, checked: boolean) => void;
  onOptionSelect: (optionId: string, value: string) => void;
  onTextInput: (optionId: string, value: string) => void;
  onAddToCart: () => void;
}) {
  const t = useTranslations("productPage");
  const locale = useLocale();
  const options = product.personalizationOptions;

  return (
    <>
      <div className="mt-7 space-y-5">
        {options.map((option) => {
          const presentation = getProductFieldPresentation(
            option,
            t("fieldOptional"),
            locale === "de" ? "de" : "en",
            product.price.currency,
          );

          if (option.type === "select" && option.options && option.options.length <= 5) {
            return (
              <div key={option.id}>
                <label className="text-[14px] font-bold text-navy-900">
                  {option.label}{" "}
                  {shouldAppendOptionalMarker(option) ? <span className="font-normal text-gray-500">{t("fieldOptional")}</span> : null}
                </label>
                <div className="mt-2.5 flex flex-wrap gap-3">
                  {option.options?.map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      onClick={() => onOptionSelect(option.id, choice.value)}
                      aria-pressed={selectedOptions[option.id] === choice.value}
                      className={`h-11 min-w-25 rounded-[10px] border px-4 text-[14px] font-medium transition-all ${
                        selectedOptions[option.id] === choice.value
                          ? "border-navy-900 bg-cream-50 text-navy-900"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          if (option.type === "text") {
            const value = textInputs[option.id] || "";
            const error = validationErrors[option.id];
            return (
              <div key={option.id}>
                <label htmlFor={option.id} className="text-[14px] font-bold text-navy-900">
                  {option.label}{" "}
                  {shouldAppendOptionalMarker(option) ? <span className="font-normal text-gray-500">{t("fieldOptional")}</span> : null}
                </label>
                <div className="relative mt-2">
                  <input
                    id={option.id}
                    type="text"
                    value={value}
                    onChange={(event) => onTextInput(option.id, limitProductFieldValue(event.target.value, option.maxLength))}
                    placeholder={option.placeholder}
                    maxLength={option.maxLength}
                    aria-required={option.required}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${option.id}-error` : undefined}
                    className={`h-12 w-full rounded-[10px] border px-3.5 pr-14 text-[14px] text-gray-800 outline-none transition-colors focus:ring-1 ${
                      error ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-navy-900 focus:ring-navy-900"
                    }`}
                  />
                  {option.maxLength && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                      {countProductFieldCharacters(value)}/{option.maxLength}
                    </span>
                  )}
                </div>
                {getMeaningfulFieldHelperText(option.helperText) && !error ? (
                  <p className="mt-1.5 text-[12px] text-gray-500">{getMeaningfulFieldHelperText(option.helperText)}</p>
                ) : null}
                {error && <p id={`${option.id}-error`} role="alert" className="mt-1.5 text-[12px] text-red-500">{error}</p>}
              </div>
            );
          }

          if (option.type === "textarea") {
            const value = textInputs[option.id] || "";
            const error = validationErrors[option.id];
            return (
              <div key={option.id}>
                <label htmlFor={option.id} className="text-[14px] font-bold text-navy-900">
                  {option.label}{" "}
                  {shouldAppendOptionalMarker(option) ? <span className="font-normal text-gray-500">{t("fieldOptional")}</span> : null}
                </label>
                <textarea
                  id={option.id}
                  value={value}
                  onChange={(event) => onTextInput(option.id, limitProductFieldValue(event.target.value, option.maxLength))}
                  placeholder={option.placeholder}
                  maxLength={option.maxLength}
                  aria-required={option.required}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${option.id}-error` : undefined}
                  rows={3}
                  className={`mt-2 w-full rounded-[10px] border px-3.5 py-3 text-[14px] text-gray-800 outline-none transition-colors focus:ring-1 ${
                    error ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-navy-900 focus:ring-navy-900"
                  }`}
                />
                {option.maxLength ? (
                  <p className="mt-1.5 text-right text-[12px] text-gray-400">
                    {countProductFieldCharacters(value)}/{option.maxLength}
                  </p>
                ) : null}
                {getMeaningfulFieldHelperText(option.helperText) && !error ? (
                  <p className="mt-1.5 text-[12px] text-gray-500">{getMeaningfulFieldHelperText(option.helperText)}</p>
                ) : null}
                {error && <p id={`${option.id}-error`} role="alert" className="mt-1.5 text-[12px] text-red-500">{error}</p>}
              </div>
            );
          }

          if (option.type === "select") {
            return (
              <div key={option.id}>
                <label htmlFor={option.id} className="text-[14px] font-bold text-navy-900">
                  {option.label}{" "}
                  {shouldAppendOptionalMarker(option) ? <span className="font-normal text-gray-500">{t("fieldOptional")}</span> : null}
                </label>
                <select
                  id={option.id}
                  value={selectedOptions[option.id] || option.options?.[0]?.value || ""}
                  onChange={(event) => onOptionSelect(option.id, event.target.value)}
                  className="mt-2 h-12 w-full rounded-[10px] border border-gray-300 px-3.5 text-[14px] text-gray-800 outline-none transition-colors focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  {option.options?.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (option.type === "checkbox") {
            return (
              <div key={option.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checkboxValues[option.id] || false}
                    onChange={(event) => setCheckboxValue(option.id, event.target.checked)}
                    aria-required={option.required}
                    aria-invalid={Boolean(validationErrors[option.id])}
                    aria-describedby={validationErrors[option.id] ? `${option.id}-error` : undefined}
                    className="h-4 w-4 rounded border-gray-300 text-navy-900 focus:ring-navy-900"
                  />
                  <span className="text-[13px] text-gray-600">
                    {option.label}
                    {presentation.extraPriceLabel ? ` ${presentation.extraPriceLabel}` : ""}
                  </span>
                </label>
                {getMeaningfulFieldHelperText(option.helperText) ? (
                  <p className="ml-6.5 text-[12px] text-gray-500">{getMeaningfulFieldHelperText(option.helperText)}</p>
                ) : null}
                {validationErrors[option.id] ? <p id={`${option.id}-error`} role="alert" className="ml-6.5 text-[12px] text-red-500">{validationErrors[option.id]}</p> : null}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Quantity + Add to cart */}
      <div className="mt-6 flex items-center gap-3">
        <QuantitySelector quantity={quantity} onChange={setQuantity} />
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canAddToCart}
          className={`flex h-13 flex-1 items-center justify-center gap-2.5 rounded-[10px] text-[15px] font-bold text-white transition-colors ${
            canAddToCart ? "bg-navy-900 hover:bg-navy-800" : "cursor-not-allowed bg-gray-300"
          }`}
        >
          {addedToCart ? (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t("added")}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {t("addToCart")}
            </>
          )}
        </button>
      </div>

      {/* PayPal Express Checkout */}
      <div className="mt-3.5">
        {canAddToCart ? (
          <PayPalExpressButton
          amount={displayedPrice * quantity}
          shippingAmount={shippingRate.price}
          itemName={product.name}
          onSuccess={async (details) => {
            // Create WooCommerce order with payer + shipping info from PayPal
            try {
              const billing = details.payer
                ? {
                    first_name: details.payer.firstName || "",
                    last_name: details.payer.lastName || "",
                    email: details.payer.email || "",
                    address_1: details.shipping?.address?.line1 || "",
                    city: details.shipping?.address?.city || "",
                    postcode: details.shipping?.address?.postalCode || "",
                    country: details.shipping?.address?.country || "",
                  }
                : undefined;

              const shipping = details.shipping
                ? {
                    first_name: details.shipping.name?.split(" ")[0] || details.payer?.firstName || "",
                    last_name: details.shipping.name?.split(" ").slice(1).join(" ") || details.payer?.lastName || "",
                    address_1: details.shipping.address?.line1 || "",
                    city: details.shipping.address?.city || "",
                    postcode: details.shipping.address?.postalCode || "",
                    country: details.shipping.address?.country || "",
                  }
                : undefined;

              await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: [
                    {
                      name: product.name,
                      product_id: purchaseProductId,
                      quantity,
                      price: String(displayedPrice),
                      customizations,
                    },
                  ],
                  billing,
                  shipping,
                  shipping_lines:
                    shippingRate.price > 0 ? [{ method_id: shippingRate.id, method_title: shippingRate.name, total: shippingRate.price.toFixed(2) }] : [],
                  payment_method: "ppcp-gateway",
                  payment_method_title: "PayPal",
                  transaction_id: details.id,
                  set_paid: true,
                }),
              });
            } catch (err) {
              console.error("Failed to create WC order:", err);
            }
            window.location.href = "/checkout/success";
          }}
          onError={(msg) => {
            console.error("PayPal express error:", msg);
          }}
          />
        ) : (
          <p className="rounded-[10px] border border-gray-200 bg-cream-50 px-4 py-3 text-[13px] text-gray-600">
            {t("paypalConfigurationRequired")}
          </p>
        )}
      </div>
    </>
  );
}

// ─── Product Tabs ───────────────────────────────────────────────────────────────

function ProductTabs({ product, reviews }: { product: ProductPageProduct; reviews: WCReview[] }) {
  const t = useTranslations("productPage");
  const descSection = product.detailSections.find((s) => s.id === "beschreibung") || product.detailSections[0];
  const shippingSection = product.detailSections.find((s) => s.id === "versand-und-fertigung");
  const reviewCount = reviews.length || product.reviewCount || 0;

  const tabList = [
    { id: "description", label: t("detailDescription") },
    { id: "details", label: t("detailsLabel") },
    { id: "shipping", label: t("shippingTab") },
    { id: "reviews", label: `${t("reviewsTitle")} (${reviewCount})` },
  ];
  const [activeTab, setActiveTab] = useState("description");

  return (
    <section className="kk-container-full mt-20">
      {/* Tab headers */}
      <div className="flex gap-0 overflow-x-auto border-b border-gray-200">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3.5 text-[14px] font-bold transition-colors ${
              activeTab === tab.id ? "text-navy-900" : "text-gray-500 hover:text-gray-700"
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
            {activeTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-600" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-10" role="tabpanel">
        {activeTab === "description" && descSection && (
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">{product.name}</h2>
            <div className="mt-4 w-full space-y-4 text-[15px] leading-7 text-gray-600">
              {descSection.content.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {product.quickFacts.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0 text-accent-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[15px] text-gray-700">
                    {f.label}: {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-4">
            {product.quickFacts.map((d) => (
              <div key={d.label} className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0">
                <span className="w-40 shrink-0 text-[14px] font-semibold text-navy-900">{d.label}</span>
                <span className="text-[14px] text-gray-600">{d.value}</span>
              </div>
            ))}
            {product.detailSections
              .filter((s) => s.id !== "beschreibung" && s.id !== "versand-und-fertigung")
              .map((section) => (
                <div key={section.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <span className="w-40 shrink-0 text-[14px] font-semibold text-navy-900">{section.title}</span>
                  <div className="mt-1 space-y-1">
                    {section.content.map((p) => (
                      <p key={p} className="text-[14px] text-gray-600">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === "shipping" && (
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <svg className="h-4 w-4 shrink-0 text-accent-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[15px] text-gray-600">{product.productionTime}</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="h-4 w-4 shrink-0 text-accent-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[15px] text-gray-600">{product.shippingNote}</span>
            </li>
            {shippingSection?.content.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0 text-accent-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[15px] text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "reviews" &&
          (reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 20 20" fill={i < review.rating ? "#f78801" : "#e5e7eb"} aria-hidden="true">
                          <path d="M10 1.25l2.47 5.01 5.53.8-4 3.9.95 5.5L10 13.77l-4.95 2.69.95-5.5-4-3.9 5.53-.8L10 1.25z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-navy-900">{review.reviewer}</span>
                    {review.verified && <span className="text-xs text-green-600">✓ {t("reviewVerified")}</span>}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: review.review }} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-gray-500">{t("reviewsEmpty")}</p>
          ))}
      </div>
    </section>
  );
}

// ─── Related Products ───────────────────────────────────────────────────────────

function RelatedProductsSection({ products }: { products: ProductPageProduct[] }) {
  const t = useTranslations("productPage");
  if (products.length === 0) return null;

  return (
    <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8 lg:px-8">
      <h2 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{t("relatedTitle")}</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/shop/${p.slug}`}
            className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-4/3 bg-cream-50">
              <Image
                src={p.images[0]!.src}
                alt={p.images[0]?.alt || p.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
            </div>
            <div className="p-4">
              <h3 className="text-[15px] font-semibold text-navy-900 line-clamp-2">{p.name}</h3>
              <p className="mt-1 text-lg font-extrabold text-navy-900">{formatProductPrice(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductHeading({
  eyebrow,
  name,
  reviewRating,
  reviewCount,
}: {
  eyebrow: string;
  name: string;
  reviewRating: number;
  reviewCount: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">{eyebrow}</p>
      <h1 className="mt-3 font-heading text-[34px] leading-[1.1] font-bold tracking-[-0.035em] text-brand sm:text-[44px]">
        {name}
      </h1>
      <div className="mt-3">
        <StarRating rating={reviewRating} count={reviewCount} />
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────────

type ProductPageClientProps = {
  product: ProductPageProduct;
  reviews: WCReview[];
  relatedProducts: ProductPageProduct[];
  presentation?: "standard" | "business-kit";
  otherBusinessKits?: WCProduct[];
};

function ProductPageClientContent({
  product,
  reviews,
  relatedProducts,
  presentation = "standard",
  otherBusinessKits = [],
}: ProductPageClientProps) {
  const t = useTranslations("productPage");
  const kitT = useTranslations("businessKitProduct");
  const isBusinessKit = presentation === "business-kit";
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialSelections(product));
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const addToCartLock = useRef(createProductSubmissionLock());

  const selectedVariation = getSelectedVariation(product, selectedOptions);
  const baseImages = product.images;
  const images = selectedVariation?.image
    ? [selectedVariation.image, ...baseImages.filter((image) => image.src !== selectedVariation.image?.src)]
    : baseImages;
  const visibleImages = isBusinessKit
    ? images.filter((image) => !isWooCommercePlaceholderImage(image))
    : images;
  const displayedPrice = selectedVariation?.price || product.price;
  const isOutOfStock = (selectedVariation?.availability || product.availability) === "out_of_stock";
  const configurationState: ProductConfigurationState = { selectedOptions, textInputs, checkboxValues };
  const currentValidationErrors = validateProductConfiguration(
    product.personalizationOptions,
    configurationState,
    (label) => t("fieldRequired", { label }),
    (label, maxLength) => t("fieldTooLong", { label, maxLength }),
  );
  const hasCompleteVariation = !product.variations?.length || Boolean(selectedVariation);
  const canAddToCart = isProductConfigurationPurchasable({
    isOutOfStock,
    hasCompleteVariation,
    validationErrors: currentValidationErrors,
  });
  const totalUnitPrice = getConfiguredUnitPrice(displayedPrice.amount, product.personalizationOptions, checkboxValues);
  const { customizations, customizationSummary } = buildProductCustomization(
    product.personalizationOptions,
    configurationState,
    t("selectedYes"),
  );

  // Fetch shipping cost for express checkout
  const [expressShippingRate, setExpressShippingRate] = useState<{ id: string; name: string; price: number }>({
    id: "dhl_paket",
    name: "DHL Paket",
    price: 5.49,
  });
  useEffect(() => {
    fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ product_id: selectedVariation?.id || product.id, quantity, price: String(totalUnitPrice) }],
        country: "DE",
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.rates?.length) {
          const rate = data.rates[0];
          setExpressShippingRate({ id: rate.id, name: rate.name, price: rate.price });
        }
      })
      .catch(() => {
        // keep default
      });
  }, [product.id, quantity, selectedVariation?.id, totalUnitPrice]);

  function handleAddToCart() {
    if (Object.keys(currentValidationErrors).length > 0) {
      setValidationErrors(currentValidationErrors);
      return;
    }
    if (!addToCartLock.current.acquire()) return;
    setValidationErrors({});

    const lineId = `${product.id}-${JSON.stringify(customizations)}`;
    const cart = readCart();
    const existingIndex = cart.findIndex((item) => item.lineId === lineId);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        lineId,
        id: selectedVariation?.id || product.id,
        name: product.name,
        price: `${totalUnitPrice.toFixed(2)} €`,
        image: product.images[0]?.src || "",
        quantity,
        slug: product.slug,
        customizationSummary,
        customizations,
      });
    }

    writeCart(cart);
    setAddedToCart(true);
    setTimeout(() => {
      addToCartLock.current.release();
      setAddedToCart(false);
    }, 3000);
  }

  const reviewCount = reviews.length || product.reviewCount || 0;
  const reviewRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : product.averageRating || 0;

  return (
    <div className="bg-page text-foreground">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="kk-container-full pt-7 pb-7">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          <li>
            <Link href="/" className="hover:text-navy-900 transition-colors">
              {t("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2l4 4-4 4" />
            </svg>
          </li>
          <li>
            <Link href={isBusinessKit ? "/services/brand-kit" : "/shop"} className="hover:text-brand transition-colors">
              {isBusinessKit ? kitT("breadcrumbBusinessKits") : t("breadcrumbShop")}
            </Link>
          </li>
          {!isBusinessKit ? (
            <>
              <li aria-hidden="true">
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 2l4 4-4 4" />
                </svg>
              </li>
              <li>
                <Link href={product.category.id ? `/shop?category=${product.category.id}` : "/shop"} className="transition-colors hover:text-brand">
                  {product.category.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2l4 4-4 4" />
            </svg>
          </li>
          <li className="font-medium text-foreground" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main product section */}
      <section className={`kk-container-full pb-16 lg:pb-20 ${isBusinessKit ? "lg:pb-24" : ""}`}>
        <div className={`grid grid-cols-1 items-start gap-10 ${isBusinessKit ? "lg:grid-cols-[1.2fr_0.9fr] lg:gap-x-14 lg:gap-y-6" : "lg:grid-cols-[1.15fr_0.85fr] lg:gap-14"}`}>
          {isBusinessKit ? (
            <div className="order-1 lg:col-start-2 lg:row-start-1">
              <ProductHeading
                eyebrow={kitT("eyebrow")}
                name={product.name}
                reviewRating={reviewRating}
                reviewCount={reviewCount}
              />
            </div>
          ) : null}

          {/* Left – Gallery */}
          <div className={isBusinessKit ? "order-2 lg:col-start-1 lg:row-start-1 lg:row-span-2" : ""}>
            <ProductGallery
              images={visibleImages}
              activeIndex={selectedImage}
              onSelect={setSelectedImage}
              aspect={isBusinessKit ? "landscape" : "portrait"}
            />
          </div>

          {/* Right – Product Info & Purchase */}
          <div className={isBusinessKit ? "order-3 lg:col-start-2 lg:row-start-2" : ""}>
            {!isBusinessKit ? (
              <ProductHeading
                eyebrow={product.category.name}
                name={product.name}
                reviewRating={reviewRating}
                reviewCount={reviewCount}
              />
            ) : null}

            {/* Price */}
            <div className={isBusinessKit ? "" : "mt-5"}>
              <p className="font-heading text-[30px] font-bold tracking-[-0.03em] text-accent sm:text-[34px]">
                {formatProductPrice({ ...displayedPrice, amount: totalUnitPrice })}
              </p>
              <p className="mt-1 text-[13px] text-muted">{isBusinessKit ? kitT("priceNote") : product.priceNote}</p>
              {isBusinessKit ? (
                <p className={`mt-2 text-sm font-semibold ${isOutOfStock ? "text-danger" : "text-brand"}`} role="status">
                  {isOutOfStock ? t("availabilityOutOfStock") : t("availabilityInStock")}
                </p>
              ) : null}
              <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">
                {t("taxNoticePrefix")}{" "}
                <Link href="/legal/agb" className="underline hover:text-gray-700">
                  § 19 UStG
                </Link>{" "}
                ohne Ausweis der MwSt.
                {" · "}
                <Link href="/legal/versand" className="underline hover:text-gray-700">
                  {t("shippingCosts")}
                </Link>
              </p>
            </div>

            {/* Short description */}
            {product.shortDescription ? <p className="mt-6 max-w-130 text-[15px] leading-7 text-muted">{product.shortDescription}</p> : null}

            {/* Personalization */}
            <PersonalizationForm
              canAddToCart={canAddToCart}
              product={product}
              purchaseProductId={selectedVariation?.id || product.id}
              quantity={quantity}
              displayedPrice={totalUnitPrice}
              shippingRate={expressShippingRate}
              selectedOptions={selectedOptions}
              textInputs={textInputs}
              checkboxValues={checkboxValues}
              customizations={customizations}
              validationErrors={validationErrors}
              addedToCart={addedToCart}
              setQuantity={setQuantity}
              setCheckboxValue={(optionId, checked) =>
                setCheckboxValues((current) => ({
                  ...current,
                  [optionId]: checked,
                }))
              }
              onOptionSelect={(optionId, value) => {
                setSelectedImage(0);
                setSelectedOptions((currentSelections) => ({
                  ...currentSelections,
                  [optionId]: value,
                }));
              }}
              onTextInput={(optionId, value) => {
                setTextInputs((current) => ({
                  ...current,
                  [optionId]: value,
                }));
                if (validationErrors[optionId]) {
                  setValidationErrors((current) => {
                    const next = { ...current };
                    delete next[optionId];
                    return next;
                  });
                }
              }}
              onAddToCart={handleAddToCart}
            />

          </div>
        </div>
      </section>

      {isBusinessKit ? <BusinessKitSupportStrip /> : (
      <section aria-label={t("supportTitle")} className="border-y border-border bg-brand text-white">
        <div className="kk-container-full grid gap-3 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {[t("supportCustomisable"), t("supportSecurePayment"), t("supportEnquiry"), t("supportLocal")].map((item) => (
            <p key={item} className="flex min-h-11 items-center gap-3 text-sm font-semibold">
              <span className="text-accent" aria-hidden="true">✓</span>{item}
            </p>
          ))}
        </div>
      </section>
      )}

      {isBusinessKit ? (
        <>
          <BusinessKitDetails product={product} reviews={reviews} />
          <BusinessKitCustomisation product={product} />
          <BusinessKitProcess />
          <OtherBusinessKits products={otherBusinessKits} />
          <BusinessKitFinalCta />
        </>
      ) : (
        <>
          <ProductTabs product={product} reviews={reviews} />

          {/* Additional product sections */}
          <div className="kk-container-full space-y-16 py-16 lg:space-y-20 lg:py-20">
            <ProductHowItWorks />
            {product.benefits.length ? <ProductBenefits benefits={product.benefits} /> : null}
            <ProductLeadCTA product={product} />
            {product.faqs.length ? <ProductFAQ faqs={product.faqs} /> : null}
          </div>

          {/* Related products */}
          <RelatedProductsSection products={relatedProducts} />
        </>
      )}

      {/* Bottom spacing */}
      <div className="h-24" />
    </div>
  );
}

export function ProductPageClient(props: ProductPageClientProps) {
  return <ProductPageClientContent key={props.product.id} {...props} />;
}
