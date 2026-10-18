"use client";

import { ProductPriceText } from "./ProductPriceText";
import { useProtectedFetch } from "@/components/CaptchaProvider";
import { CustomSizeRequest } from "./CustomSizeRequest";
import { ConfiguredEnquiry } from "./ConfiguredEnquiry";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductBenefits } from "@/components/product/ProductBenefits";
import { ProductFAQ } from "@/components/product/ProductFAQ";
import { ProductLeadCTA } from "@/components/product/ProductLeadCTA";
import { ProductHowItWorks } from "@/components/product/ProductHowItWorks";
import { readCart, writeCart } from "@/lib/cart";
import { formatProductPrice, getCustomSizeKind, shouldRenderSelectAsButtons, type ProductPageProduct } from "@/lib/product-page";
import {
  buildProductCustomization,
  countProductFieldCharacters,
  createProductSubmissionLock,
  getConfiguredUnitPrice,
  getMeaningfulFieldHelperText,
  getProductFieldPresentation,
  getVariationOptionAvailability,
  getVisibleOptions,
  normalizeVariationSelections,
  isProductConfigurationPurchasable,
  limitProductFieldValue,
  shouldAppendOptionalMarker,
  validateProductConfiguration,
  type ProductConfigurationState,
} from "@/lib/product-configuration";
import type { WCReview } from "@/lib/woocommerce";
import PayPalExpressButton from "@/components/checkout/PayPalExpressButton";
import {
  BusinessKitContents,
  BusinessKitCustomisation,
  BusinessKitDetails,
  BusinessKitEnquiryProcess,
  BusinessKitFaq,
  BusinessKitEnquiryPanel,
  BusinessKitFinalCta,
  BusinessKitProcess,
  BusinessKitSupportStrip,
  OtherBusinessKits,
} from "@/components/business-kits/BusinessKitProductSections";
import { isWooCommercePlaceholderImage } from "@/lib/business-kits";
import { getSetSelection } from "@/lib/purchase-mode";
import { KitIllustration } from "@/components/business-kits/KitIllustration";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductVideos } from "@/components/product/ProductVideos";
import { CUSTOMER_FILE_MAX_BYTES } from "@/lib/customer-file-limits";
import type { WCProduct } from "@/lib/woocommerce";

function getInitialSelections(product: ProductPageProduct) {
  const initialSelections: Record<string, string> = {};

  for (const option of product.personalizationOptions) {
    const initialValue = option.defaultValue || option.options?.[0]?.value;
    if (initialValue) {
      initialSelections[option.id] = initialValue;
    }
  }

  return normalizeVariationSelections(product.variations, getVariationAttributes(product), {
    ...initialSelections,
    ...product.defaultOptionValues,
  });
}

/** The select options that are variation attributes (shape, size, ...), in display order. */
function getVariationAttributes(product: ProductPageProduct) {
  const variationAttributeIds = new Set(product.variations?.flatMap((variation) => Object.keys(variation.attributes)));
  return product.personalizationOptions.filter((option) => option.type === "select" && variationAttributeIds.has(option.id));
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

function QuantitySelector({ quantity, onChange, label }: { quantity: number; onChange: (q: number) => void; label?: string }) {
  const t = useTranslations("productPage");
  return (
    <div role="group" aria-label={label} className="flex h-13 w-30.5 items-center rounded-[10px] border border-gray-200">
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


// ─── Personalization Form ───────────────────────────────────────────────────────

function RequiredFieldMark({ required }: { required: boolean }) {
  return required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null;
}

function PersonalizationForm({
  canAddToCart,
  canAttemptAddToCart,
  product,
  purchaseProductId,
  variationId,
  quantity,
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
  fileNames,
  uploading,
  uploadErrors,
  onFileSelect,
  onFileRemove,
  setSummary,
  customSizeRequest,
}: {
  canAddToCart: boolean;
  canAttemptAddToCart: boolean;
  product: ProductPageProduct;
  purchaseProductId: number;
  variationId?: number;
  quantity: number;
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
  fileNames: Record<string, string>;
  uploading: Record<string, boolean>;
  uploadErrors: Record<string, string>;
  onFileSelect: (optionId: string, file: File | undefined) => void;
  onFileRemove: (optionId: string) => void;
  /** Live "37 mm · 4 sets · 140 stickers · €20" line for products sold in sets. */
  setSummary?: string | null;
  /** When set, replaces quantity, add-to-cart and PayPal (request-only size selected). */
  customSizeRequest?: React.ReactNode;
}) {
  const t = useTranslations("productPage");
  const setsT = useTranslations("sets");
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

          if (shouldRenderSelectAsButtons(option)) {
            return (
              <div key={option.id}>
                <label className="text-[14px] font-bold text-navy-900">
                  {option.label}<RequiredFieldMark required={option.required} />{" "}
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

          if (option.type === "text" || option.type === "url" || option.type === "email") {
            const value = textInputs[option.id] || "";
            const error = validationErrors[option.id];
            return (
              <div key={option.id}>
                <label htmlFor={option.id} className="text-[14px] font-bold text-navy-900">
                  {option.label}<RequiredFieldMark required={option.required} />{" "}
                  {shouldAppendOptionalMarker(option) ? <span className="font-normal text-gray-500">{t("fieldOptional")}</span> : null}
                </label>
                <div className="relative mt-2">
                  <input
                    id={option.id}
                    type={option.type === "url" || option.type === "email" ? option.type : "text"}
                    inputMode={option.type === "url" || option.type === "email" ? option.type : undefined}
                    autoComplete="off"
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
                  {option.label}<RequiredFieldMark required={option.required} />{" "}
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
                  {option.label}<RequiredFieldMark required={option.required} />{" "}
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

          if (option.type === "file") {
            const error = validationErrors[option.id] || uploadErrors[option.id];
            const uploadedName = textInputs[option.id] ? fileNames[option.id] || t("fileUploadedGeneric") : "";
            const describedBy = [`${option.id}-help`, error ? `${option.id}-error` : ""].filter(Boolean).join(" ");
            return (
              <div key={option.id}>
                <label htmlFor={option.id} className="text-[14px] font-bold text-navy-900">
                  {option.label}<RequiredFieldMark required={option.required} />{" "}
                  {shouldAppendOptionalMarker(option) ? <span className="font-normal text-gray-500">{t("fieldOptional")}</span> : null}
                </label>
                <input
                  id={option.id}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  aria-required={option.required}
                  aria-invalid={Boolean(error)}
                  aria-describedby={describedBy}
                  disabled={uploading[option.id]}
                  onChange={(event) => {
                    onFileSelect(option.id, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  className="mt-2 block w-full rounded-[10px] border border-gray-300 bg-white text-[14px] text-gray-800 file:mr-3 file:min-h-11 file:cursor-pointer file:border-0 file:bg-cream-50 file:px-4 file:text-[14px] file:font-semibold file:text-navy-900"
                />
                <p id={`${option.id}-help`} className="mt-1.5 text-[12px] text-gray-500">
                  {getMeaningfulFieldHelperText(option.helperText) ? `${getMeaningfulFieldHelperText(option.helperText)} ` : ""}
                  {t("fileHelp")}
                </p>
                {uploading[option.id] ? <p role="status" className="mt-1.5 text-[12px] text-gray-600">{t("fileUploading")}</p> : null}
                {uploadedName ? (
                  <p role="status" className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-navy-900">
                    <span className="break-all">{t("fileUploaded", { name: uploadedName })}</span>
                    <button type="button" onClick={() => onFileRemove(option.id)} className="min-h-11 px-2 text-[13px] font-semibold underline">
                      {t("fileRemove")}
                    </button>
                  </p>
                ) : null}
                {error ? <p id={`${option.id}-error`} role="alert" className="mt-1.5 text-[12px] text-red-500">{error}</p> : null}
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
                    {option.label}<RequiredFieldMark required={option.required} />
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

      {customSizeRequest ? (
        <div className="mt-6">{customSizeRequest}</div>
      ) : (
        <>
      {/* Quantity + Add to cart */}
      {product.setConfig ? (
        <div className="mt-6">
          <p className="text-[13px] font-semibold text-navy-900">{setsT("quantityLabel")}</p>
          <p className="mt-1 min-h-5 text-[13px] text-gray-600" role="status" aria-live="polite">
            {setSummary || setsT("chooseOption")}
          </p>
        </div>
      ) : null}
      <div className={`${product.setConfig ? "mt-2" : "mt-6"} flex items-center gap-3`}>
        <QuantitySelector quantity={quantity} onChange={setQuantity} label={product.setConfig ? setsT("quantityLabel") : undefined} />
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canAttemptAddToCart}
          className={`flex h-13 flex-1 items-center justify-center gap-2.5 rounded-[10px] text-[15px] font-bold text-white transition-colors ${
            canAttemptAddToCart ? "bg-navy-900 hover:bg-navy-800" : "cursor-not-allowed bg-gray-300"
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
          pendingOrderRequest={{
            items: [{ productId: purchaseProductId, ...(variationId ? { variationId } : {}), quantity, customizations }],
            country: "DE",
            shippingMethodId: shippingRate.id,
            payment_method: "paypal-express",
            payment_method_title: "PayPal Express",
          }}
          onSuccess={async (details) => {
            void details;
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
      )}
    </>
  );
}

// ─── Product Tabs ───────────────────────────────────────────────────────────────

function ProductTabs({ product, reviews }: { product: ProductPageProduct; reviews: WCReview[] }) {
  const t = useTranslations("productPage");
  const shippingT = useTranslations("shipping");
  const reviewCount = reviews.length || product.reviewCount || 0;
  const hasDetails = Boolean(product.sku || product.attributes?.length || product.weight || product.dimensions);
  const tabList = [
    { id: "description", label: t("detailDescription") },
    ...(hasDetails ? [{ id: "details", label: t("detailsLabel") }] : []),
    { id: "shipping", label: t("shippingTab") },
    { id: "reviews", label: `${t("reviewsTitle")} (${reviewCount})` },
  ];
  const [activeTab, setActiveTab] = useState("description");

  return (
    <section className="kk-container-full mt-20">
      <div className="flex gap-0 overflow-x-auto border-b border-gray-200" role="tablist">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative shrink-0 px-5 py-3.5 text-[14px] font-bold transition-colors ${activeTab === tab.id ? "text-navy-900" : "text-gray-500 hover:text-gray-700"}`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
            {activeTab === tab.id ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-600" /> : null}
          </button>
        ))}
      </div>

      <div className="py-10" role="tabpanel">
        {activeTab === "description" ? (
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">{product.name}</h2>
            {product.descriptionHtml?.trim() ? (
              <div
                className="mt-4 min-w-0 max-w-3xl space-y-4 text-[15px] leading-7 text-gray-600 [&_a]:text-brand [&_a]:underline [&_li]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            ) : (
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-gray-600">{product.description}</p>
            )}
          </div>
        ) : null}

        {activeTab === "details" && hasDetails ? (
          <dl className="max-w-3xl divide-y divide-border">
            {product.sku ? <ProductDetailRow label={t("skuLabel")} value={product.sku} /> : null}
            {product.attributes?.map((attribute) => (
              <ProductDetailRow key={attribute.name} label={attribute.name} value={attribute.values.join(", ")} />
            ))}
            {product.weight ? <ProductDetailRow label={t("weightLabel")} value={`${product.weight} kg`} /> : null}
            {product.dimensions ? (
              <ProductDetailRow label={t("dimensionsLabel")} value={`${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`} />
            ) : null}
          </dl>
        ) : null}

        {activeTab === "shipping" ? (
          <div className="max-w-3xl">
            <ul className="space-y-3">
              {[
                t("shippingTimeNotice", { time: shippingT("domesticTime") }),
                shippingT("domesticDesc"),
                shippingT("processingTime"),
                shippingT("trackingInfo"),
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="mt-1 h-4 w-4 shrink-0 text-accent-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[15px] text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/legal/versand" className="kk-link mt-4 inline-flex min-h-11 items-center font-semibold">
              {t("shippingDetailsLink")}
            </Link>
          </div>
        ) : null}

        {activeTab === "reviews" ? (
          reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <svg key={index} className="h-3.5 w-3.5" viewBox="0 0 20 20" fill={index < review.rating ? "#f78801" : "#e5e7eb"}>
                          <path d="M10 1.25l2.47 5.01 5.53.8-4 3.9.95 5.5L10 13.77l-4.95 2.69.95-5.5-4-3.9 5.53-.8L10 1.25z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-navy-900">{review.reviewer}</span>
                    {review.verified ? <span className="text-xs text-green-600">✓ {t("reviewVerified")}</span> : null}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: review.review }} />
                </div>
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

function ProductDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-[14px] font-semibold text-navy-900">{label}</dt>
      <dd className="text-[14px] text-gray-600">{value}</dd>
    </div>
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
  eyebrow?: string;
  name: string;
  reviewRating: number;
  reviewCount: number;
}) {
  return (
    <div>
      {eyebrow ? <p className="text-xs font-semibold tracking-[0.08em] text-accent uppercase">{eyebrow}</p> : null}
      <h1 className={`${eyebrow ? "mt-3 " : ""}font-heading text-[28px] leading-[1.15] font-bold tracking-[-0.035em] text-brand [overflow-wrap:anywhere] hyphens-auto min-[400px]:text-[34px] sm:text-[44px] lg:text-[34px] xl:text-[44px]`}>
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
  freeShippingThreshold?: number;
};

function ProductPageClientContent({
  product,
  reviews,
  relatedProducts,
  presentation = "standard",
  otherBusinessKits = [],
  freeShippingThreshold,
}: ProductPageClientProps) {
  const protectedFetch = useProtectedFetch();
  const t = useTranslations("productPage");
  const kitT = useTranslations("businessKitProduct");
  const shippingT = useTranslations("shipping");
  const isBusinessKit = presentation === "business-kit";
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialSelections(product));
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const addToCartLock = useRef(createProductSubmissionLock());

  const selectedVariation = getSelectedVariation(product, selectedOptions);
  const baseImages = product.images;
  const images = selectedVariation?.image
    ? [selectedVariation.image, ...baseImages.filter((image) => image.src !== selectedVariation.image?.src)]
    : baseImages;
  const visibleImages = isBusinessKit
    ? images.filter((image) => !isWooCommercePlaceholderImage(image))
    : images;
  const variationAttributes = getVariationAttributes(product);
  const optionAvailability = getVariationOptionAvailability(
    product.variations,
    variationAttributes.map((attribute) => attribute.id),
    selectedOptions,
  );
  // Only conditional fields that apply, and only the variation values that exist for the choices above them.
  const requestingCustomSize = Boolean(selectedVariation?.requestOnly);
  const variationAttributeIds = new Set(variationAttributes.map((attribute) => attribute.id));
  const shownProduct: ProductPageProduct = {
    ...product,
    // While the request-only size is selected, only the size choice stays: everything else is asked in the enquiry.
    personalizationOptions: getVisibleOptions(product.personalizationOptions, selectedOptions, checkboxValues)
      .filter((option) => !requestingCustomSize || (variationAttributeIds.has(option.id) && (optionAvailability[option.id]?.size ?? 2) > 1))
      .map((option) =>
        optionAvailability[option.id]
          ? { ...option, options: option.options?.filter((choice) => optionAvailability[option.id].has(choice.value)) }
          : option,
      ),
  };
  const displayedPrice = selectedVariation?.price || product.price;
  const isOutOfStock = (selectedVariation?.availability || product.availability) === "out_of_stock";
  const kitState = product.kitCommercialState;
  const kitEnquiry = kitState?.kind === "enquiry" || kitState?.kind === "unavailable";
  // An enquiry-only product with its own fields (not a Business Bundle) is configured on the page and sent as an enquiry.
  const enquiryConfigurator = kitEnquiry && !isBusinessKit && product.personalizationOptions.length > 0;
  const showKitEnquiryPanel = kitEnquiry && !enquiryConfigurator;
  const customSizeKind = getCustomSizeKind(variationAttributes.map((attribute) => attribute.id));
  const requestKind = selectedVariation?.requestKind === "quote" ? "quote" : customSizeKind;
  const requestVariationLines = variationAttributes.flatMap((attribute) => {
    const label = attribute.options?.find((choice) => choice.value === selectedOptions[attribute.id])?.label;
    return label ? [`${attribute.label}: ${label}`] : [];
  });
  const configurationState: ProductConfigurationState = { selectedOptions, textInputs, checkboxValues };
  const currentValidationErrors = validateProductConfiguration(
    product.personalizationOptions,
    configurationState,
    (label) => t("fieldRequired", { label }),
    (label, maxLength) => t("fieldTooLong", { label, maxLength }),
    (label) => t("fieldInvalidUrl", { label }),
    (label) => t("fieldInvalidEmail", { label }),
  );
  const hasCompleteVariation = !product.variations?.length || Boolean(selectedVariation);
  const isUploading = Object.values(uploading).some(Boolean);
  const canAttemptAddToCart = !isUploading && !isOutOfStock && hasCompleteVariation;
  const canAddToCart =
    !isUploading &&
    isProductConfigurationPurchasable({
      isOutOfStock,
      hasCompleteVariation,
      validationErrors: currentValidationErrors,
    });
  const totalUnitPrice = getConfiguredUnitPrice(displayedPrice.amount, product.personalizationOptions, configurationState);
  const setsT = useTranslations("sets");
  const setSelection = product.setConfig ? getSetSelection(product.setConfig, selectedOptions[product.setConfig.fieldId], quantity) : null;
  const setSummary =
    product.setConfig && setSelection
      ? setsT("summary", {
          option: product.personalizationOptions.find((option) => option.id === product.setConfig?.fieldId)?.options?.find((option) => option.value === selectedOptions[product.setConfig?.fieldId ?? ""])?.label?.split(" – ")[0] ?? selectedOptions[product.setConfig.fieldId],
          sets: setSelection.sets,
          total: setSelection.totalUnits,
          unit: product.setConfig.unitLabel,
          price: formatProductPrice({ ...displayedPrice, amount: totalUnitPrice * quantity }),
        })
      : null;
  const kitFreeShipping = isBusinessKit && typeof freeShippingThreshold === "number" && totalUnitPrice * quantity >= freeShippingThreshold;
  const { customizations, customizationSummary } = useMemo(
    () => buildProductCustomization(product.personalizationOptions, { selectedOptions, textInputs, checkboxValues }, t("selectedYes"), fileNames),
    [product.personalizationOptions, selectedOptions, textInputs, checkboxValues, t, fileNames],
  );
  // Files uploaded before switching to a request-only variation travel with the enquiry (the server verifies each token).
  const uploadedFiles = product.personalizationOptions.filter((option) => option.type === "file" && customizations[option.id]);

  async function handleFileSelect(optionId: string, file: File | undefined) {
    if (!file) return;
    setUploadErrors((current) => ({ ...current, [optionId]: "" }));

    if (file.size > CUSTOMER_FILE_MAX_BYTES) {
      setUploadErrors((current) => ({ ...current, [optionId]: t("fileTooLarge") }));
      return;
    }

    setUploading((current) => ({ ...current, [optionId]: true }));
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("field_id", optionId);
      const response = await protectedFetch("/api/uploads/customer-file", { method: "POST", body });
      const result = (await response.json().catch(() => null)) as { token?: string; filename?: string; code?: string; error?: string } | null;

      if (!response.ok || !result?.token) {
        setUploadErrors((current) => ({
          ...current,
          [optionId]:
            response.status === 429 && result?.error
              ? result.error
              : result?.code === "type_not_allowed" ? t("fileTypeNotAllowed") : result?.code === "too_large" ? t("fileTooLarge") : t("fileUploadFailed"),
        }));
        return;
      }

      setTextInputs((current) => ({ ...current, [optionId]: result.token! }));
      setFileNames((current) => ({ ...current, [optionId]: result.filename || file.name }));
      setValidationErrors((current) => {
        const next = { ...current };
        delete next[optionId];
        return next;
      });
    } catch {
      setUploadErrors((current) => ({ ...current, [optionId]: t("fileUploadFailed") }));
    } finally {
      setUploading((current) => ({ ...current, [optionId]: false }));
    }
  }

  function handleFileRemove(optionId: string) {
    setTextInputs((current) => {
      const next = { ...current };
      delete next[optionId];
      return next;
    });
    setFileNames((current) => {
      const next = { ...current };
      delete next[optionId];
      return next;
    });
  }

  // Fetch shipping cost for express checkout
  const [expressShippingRate, setExpressShippingRate] = useState<{ id: string; name: string; price: number }>({
    id: "dhl_paket",
    name: "DHL Paket",
    price: 5.49,
  });
  useEffect(() => {
    // The estimate only feeds the express checkout button, which needs a complete configuration (the server rejects an incomplete one).
    if (kitEnquiry || selectedVariation?.requestOnly || !canAddToCart) return;
    fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: product.id, ...(selectedVariation ? { variationId: selectedVariation.id } : {}), quantity, customizations }],
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
  }, [product.id, quantity, selectedVariation, customizations, kitEnquiry, canAddToCart]);

  function validateForEnquiry() {
    if (Object.keys(currentValidationErrors).length === 0) {
      setValidationErrors({});
      return true;
    }
    setValidationErrors(currentValidationErrors);
    const firstInvalid = product.personalizationOptions.find((option) => currentValidationErrors[option.id]);
    if (firstInvalid) document.getElementById(firstInvalid.id)?.focus();
    return false;
  }

  function handleAddToCart() {
    if (Object.keys(currentValidationErrors).length > 0) {
      setValidationErrors(currentValidationErrors);
      const firstInvalid = product.personalizationOptions.find((option) => currentValidationErrors[option.id]);
      if (firstInvalid) document.getElementById(firstInvalid.id)?.focus();
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
        productId: product.id,
        ...(selectedVariation ? { variationId: selectedVariation.id } : {}),
        name: product.name,
        price: `${totalUnitPrice.toFixed(2)} €`,
        image: product.images[0]?.src || "",
        quantity,
        slug: product.slug,
        customizationSummary,
        customizations,
        ...(setSelection && product.setConfig ? { unitsPerSet: setSelection.unitsPerSet, unitLabel: product.setConfig.unitLabel } : {}),
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
      <Breadcrumbs
        className="kk-container-full pt-7 pb-7"
        items={
          isBusinessKit
            ? [{ label: kitT("breadcrumbBusinessKits"), href: "/services/brand-kit" }, { label: product.name }]
            : [
                { label: t("breadcrumbShop"), href: "/shop" },
                { label: product.name },
              ]
        }
      />

      {/* Main product section */}
      <section className={`kk-container-full pb-16 lg:pb-20 ${isBusinessKit ? "lg:pb-24" : ""}`}>
        <div className={`grid min-w-0 grid-cols-1 items-start gap-10 ${isBusinessKit ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-x-14 lg:gap-y-6" : "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14"}`}>
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
          <div className={`min-w-0 ${isBusinessKit ? "order-2 lg:col-start-1 lg:row-start-1 lg:row-span-2" : ""}`}>
            {isBusinessKit && visibleImages.length === 0 && product.kit && product.kit.items.length > 0 ? (
              <KitIllustration items={product.kit.items} variant="gallery" />
            ) : (
              <>
                <ProductGallery
                  images={visibleImages}
                  activeIndex={selectedImage}
                  onSelect={setSelectedImage}
                  note={isBusinessKit ? kitT("imageNote") : undefined}
                />
                <ProductVideos videos={product.videos ?? []} poster={product.images[0]?.src} />
              </>
            )}
          </div>

          {/* Right – Product Info & Purchase */}
          <div className={`min-w-0 ${isBusinessKit ? "order-3 lg:col-start-2 lg:row-start-2" : ""}`}>
            {!isBusinessKit ? (
              <ProductHeading
                name={product.name}
                reviewRating={reviewRating}
                reviewCount={reviewCount}
              />
            ) : null}

            {/* Price */}
            {!showKitEnquiryPanel ? (
            <div className={isBusinessKit ? "" : "mt-5"}>
              {requestingCustomSize ? (
                <p className="font-heading text-[22px] font-bold tracking-[-0.02em] text-accent sm:text-[26px]">{t("customSizePrice")}</p>
              ) : enquiryConfigurator ? (
                <p className="font-heading text-[30px] font-bold tracking-[-0.03em] text-accent sm:text-[34px]">
                  {displayedPrice.amount > 0 ? t("enquiryPriceFrom", { price: formatProductPrice(displayedPrice) }) : t("customSizePrice")}
                </p>
              ) : (
              <ProductPriceText
                price={displayedPrice}
                extras={totalUnitPrice - displayedPrice.amount}
                className="font-heading text-[30px] font-bold tracking-[-0.03em] text-accent sm:text-[34px]"
                regularClassName="text-lg font-medium text-muted"
              />
              )}
              <p className="mt-1 text-[13px] text-muted">
                {enquiryConfigurator
                  ? t("enquiryPriceNote")
                  : isBusinessKit
                  ? kitFreeShipping
                    ? kitT("shippingFreeDomestic", { threshold: freeShippingThreshold ?? 0 })
                    : kitT("priceNote")
                  : product.priceNote}
              </p>
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
                  {kitFreeShipping ? kitT("shippingInfoLink") : t("shippingCosts")}
                </Link>
              </p>
            </div>
            ) : null}

            {/* Short description */}
            {product.shortDescription ? <p className={`${showKitEnquiryPanel ? "" : "mt-6 "}max-w-130 text-[15px] leading-7 text-muted`}>{product.shortDescription}</p> : null}

            {!isBusinessKit && !enquiryConfigurator ? (
              <div className="mt-5 rounded-kubikart-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground">
                <p className="font-semibold">{t("shippingTimeNotice", { time: shippingT("domesticTime") })}</p>
                <Link href="/legal/versand" className="kk-link inline-flex min-h-11 items-center text-sm font-semibold">
                  {t("shippingDetailsLink")}
                </Link>
              </div>
            ) : null}

            {isBusinessKit && product.kit?.scopeSummary ? (
              <p className="mt-4 max-w-130 rounded-kubikart-md border border-border bg-surface px-4 py-3 text-[13px] leading-6 font-semibold text-brand">
                {product.kit.scopeSummary}
              </p>
            ) : null}
            {showKitEnquiryPanel && kitState ? (
              <div className="mt-6">
                <BusinessKitEnquiryPanel product={product} state={kitState} bundle={isBusinessKit} />
              </div>
            ) : (
            <PersonalizationForm
              canAddToCart={canAddToCart}
              canAttemptAddToCart={canAttemptAddToCart}
              product={shownProduct}
              purchaseProductId={product.id}
              variationId={selectedVariation?.id}
              quantity={quantity}
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
                setSelectedOptions((currentSelections) =>
                  normalizeVariationSelections(product.variations, getVariationAttributes(product), {
                    ...currentSelections,
                    [optionId]: value,
                  }),
                );
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
              fileNames={fileNames}
              uploading={uploading}
              uploadErrors={uploadErrors}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              setSummary={setSummary}
              customSizeRequest={
                requestingCustomSize ? (
                  <CustomSizeRequest product={{ id: product.id, slug: product.slug, name: product.name }} kind={requestKind}
                    selection={[...requestVariationLines, ...uploadedFiles.map((option) => `${option.label}: ${fileNames[option.id] || ""}`.trim())]}
                    fileTokens={uploadedFiles.map((option) => textInputs[option.id])}
                    fileNames={uploadedFiles.map((option) => fileNames[option.id]).filter(Boolean)}
                  />
                ) : enquiryConfigurator ? (
                  <ConfiguredEnquiry
                    product={{ id: product.id, slug: product.slug, name: product.name }}
                    configuration={{
                      lines: customizationSummary,
                      fileTokens: product.personalizationOptions.filter((option) => option.type === "file" && customizations[option.id]).map((option) => customizations[option.id]),
                      validate: validateForEnquiry,
                      busy: isUploading,
                    }}
                  />
                ) : undefined
              }
            />
            )}

            {isBusinessKit && !kitEnquiry ? (
              <p className="mt-5 text-sm leading-6 text-muted">
                {kitT("customScopeText")}{" "}
                <Link href={`/sonderanfertigung?kit=${encodeURIComponent(product.slug)}`} className="kk-link inline-flex min-h-11 items-center font-semibold">
                  {kitT("customScopeLink")}
                </Link>
              </p>
            ) : null}

          </div>
        </div>
      </section>

      {isBusinessKit ? <BusinessKitSupportStrip orderable={!kitEnquiry} /> : (
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
          {kitState ? <BusinessKitContents items={product.kit?.items ?? []} state={kitState} /> : null}
          <BusinessKitDetails product={product} reviews={reviews} hasStructuredContents={Boolean(product.kit?.items.length)} />
          {!kitEnquiry ? <BusinessKitCustomisation product={product} /> : null}
          {!kitEnquiry ? <BusinessKitProcess /> : <BusinessKitEnquiryProcess />}
          {kitEnquiry && kitState?.kind === "enquiry" ? <BusinessKitFaq /> : null}
          <OtherBusinessKits products={otherBusinessKits} />
          <BusinessKitFinalCta />
        </>
      ) : (
        <>
          <ProductTabs product={product} reviews={reviews} />

          {/* Additional product sections */}
          <div className="kk-container-full space-y-16 py-16 lg:space-y-20 lg:py-20">
            <ProductHowItWorks enquiry={kitEnquiry} />
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
