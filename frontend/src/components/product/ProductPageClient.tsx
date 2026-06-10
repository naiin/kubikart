"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ProductBenefits } from "@/components/product/ProductBenefits";
import { ProductFAQ } from "@/components/product/ProductFAQ";
import { ProductLeadCTA } from "@/components/product/ProductLeadCTA";
import { ProductSeoContent } from "@/components/product/ProductSeoContent";
import { readCart, writeCart } from "@/lib/cart";
import { formatProductPrice, type ProductPageProduct } from "@/lib/product-page";
import type { WCReview } from "@/lib/woocommerce";
import PayPalExpressButton from "@/components/checkout/PayPalExpressButton";

function getInitialSelections(product: ProductPageProduct) {
  const initialSelections: Record<string, string> = {};

  for (const option of product.personalizationOptions) {
    const firstOption = option.options?.[0];
    if (firstOption) {
      initialSelections[option.id] = firstOption.value;
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
  if (count <= 0) return null;

  return (
    <div className="flex items-center gap-2" aria-label={`Bewertung: ${rating.toFixed(1)} von 5 Sternen basierend auf ${count} Bewertungen`}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-4.5 w-4.5" viewBox="0 0 20 20" fill={i < Math.round(rating) ? "#f78801" : "#e5e7eb"} aria-hidden="true">
            <path d="M10 1.25l2.47 5.01 5.53.8-4 3.9.95 5.5L10 13.77l-4.95 2.69.95-5.5-4-3.9 5.53-.8L10 1.25z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-gray-500">({count} Bewertungen)</span>
    </div>
  );
}

// ─── Quantity Selector ──────────────────────────────────────────────────────────

function QuantitySelector({ quantity, onChange }: { quantity: number; onChange: (q: number) => void }) {
  return (
    <div className="flex h-13 w-30.5 items-center rounded-[10px] border border-gray-200">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
        className="flex h-full w-10 items-center justify-center text-lg text-gray-700 transition-colors hover:text-navy-900 disabled:opacity-40"
        aria-label="Menge verringern"
      >
        −
      </button>
      <span className="flex-1 text-center text-[15px] font-bold text-navy-900">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, quantity + 1))}
        disabled={quantity >= 99}
        className="flex h-full w-10 items-center justify-center text-lg text-gray-700 transition-colors hover:text-navy-900 disabled:opacity-40"
        aria-label="Menge erhöhen"
      >
        +
      </button>
    </div>
  );
}

// ─── Product Gallery ────────────────────────────────────────────────────────────

function ProductGallery({ images, activeIndex, onSelect }: { images: { src: string; alt: string }[]; activeIndex: number; onSelect: (i: number) => void }) {
  const active = images[activeIndex] || images[0];
  const [zoomed, setZoomed] = useState(false);

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[96px_1fr] md:gap-6">
        {/* Thumbnails – vertical on desktop, horizontal on mobile */}
        <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={`relative shrink-0 overflow-hidden rounded-xl transition-all ${
                i === activeIndex ? "ring-2 ring-accent-600 border-2 border-accent-600" : "border border-gray-200 hover:border-gray-300"
              }`}
              style={{ width: 84, height: 112 }}
              aria-label={`Bild ${i + 1} anzeigen`}
              aria-pressed={i === activeIndex}
            >
              <Image src={img.src} alt={img.alt} fill sizes="84px" className="object-cover" unoptimized />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className="relative order-1 aspect-4/5 overflow-hidden rounded-2xl bg-cream-50 md:order-2">
          <Image src={active.src} alt={active.alt} fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="absolute bottom-4 right-4 flex h-10.5 w-10.5 items-center justify-center rounded-full bg-white shadow-md transition-shadow hover:shadow-lg"
            aria-label="Bild vergrößern"
          >
            <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="6" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              <path strokeLinecap="round" d="M11 8v6M8 11h6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lightbox overlay */}
      {zoomed && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-label="Bildvorschau"
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Schließen"
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
                aria-label="Vorheriges Bild"
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
                aria-label="Nächstes Bild"
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

// ─── Trust Icons ────────────────────────────────────────────────────────────────

function TrustIcons() {
  const items = [
    {
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21s-6.5-4.2-8.5-8.5C1.7 8.2 4.2 4.5 8 4.5c2 0 3.4 1 4 2.3.6-1.3 2-2.3 4-2.3 3.8 0 6.3 3.7 4.5 8C18.5 16.8 12 21 12 21z"
          />
        </svg>
      ),
      title: "Handgefertigt",
      subtitle: "mit Liebe",
    },
    {
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v9H3zM17 10h2.5l2.5 3v4h-5z" />
          <circle cx="7" cy="18.5" r="1.5" />
          <circle cx="19" cy="18.5" r="1.5" />
        </svg>
      ),
      title: "Schneller Versand",
      subtitle: "3–5 Werktage",
    },
    {
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l6 3v5c0 4.5-3 8.5-6 10-3-1.5-6-5.5-6-10V6l6-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
      ),
      title: "Sichere Zahlung",
      subtitle: "SSL verschlüsselt",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.title} className="flex flex-col items-center text-center">
          <span className="text-navy-900">{item.icon}</span>
          <span className="mt-1.5 text-[13px] font-semibold text-gray-800">{item.title}</span>
          <span className="text-[12px] text-gray-500">{item.subtitle}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Trust Support Card ─────────────────────────────────────────────────────────

function TrustSupportCard() {
  const items = [
    {
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 3l6 3v5c0 4.5-3 8.5-6 10-3-1.5-6-5.5-6-10V6l6-3z" />
        </svg>
      ),
      title: "Sicher bezahlen",
      description: "Alle Zahlungen sind SSL verschlüsselt.",
    },
    {
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M9 12l2 2 4-4" />
        </svg>
      ),
      title: "Zufriedenheitsgarantie",
      description: "Nicht zufrieden? Wir finden eine Lösung.",
    },
    {
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </svg>
      ),
      title: "Kundenservice",
      description: "Wir sind gerne für dich da.",
    },
    {
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" d="M12 2l2 4 4.5.7-3.2 3.2.7 4.5L12 12.5 8 14.4l.7-4.5L5.5 6.7 10 6l2-4z" />
        </svg>
      ),
      title: "Individuelle Anfertigung",
      description: "Jedes Stück ist ein Unikat.",
    },
  ];

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-linear-to-br from-white to-cream-50 p-7">
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3.5">
            <span className="mt-0.5 text-navy-900">{item.icon}</span>
            <div>
              <p className="text-[14px] font-bold text-navy-900">{item.title}</p>
              <p className="text-[13px] text-gray-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Personalization Form ───────────────────────────────────────────────────────

function PersonalizationForm({
  canAddToCart,
  product,
  quantity,
  displayedPrice,
  shippingRate,
  selectedOptions,
  textInputs,
  giftWrap,
  validationErrors,
  addedToCart,
  setQuantity,
  setGiftWrap,
  onOptionSelect,
  onTextInput,
  onAddToCart,
}: {
  canAddToCart: boolean;
  product: ProductPageProduct;
  quantity: number;
  displayedPrice: number;
  shippingRate: { id: string; name: string; price: number };
  selectedOptions: Record<string, string>;
  textInputs: Record<string, string>;
  giftWrap: boolean;
  validationErrors: Record<string, string>;
  addedToCart: boolean;
  setQuantity: (q: number) => void;
  setGiftWrap: (v: boolean) => void;
  onOptionSelect: (optionId: string, value: string) => void;
  onTextInput: (optionId: string, value: string) => void;
  onAddToCart: () => void;
}) {
  const options = product.personalizationOptions;

  return (
    <>
      <div className="mt-7 space-y-5">
        {options.map((option) => {
          if (option.type === "color" || (option.type === "select" && option.options && option.options.length <= 5)) {
            return (
              <div key={option.id}>
                <label className="text-[14px] font-bold text-navy-900">{option.label}</label>
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
                  {option.label} {!option.required && <span className="font-normal text-gray-500">(optional)</span>}
                </label>
                <div className="relative mt-2">
                  <input
                    id={option.id}
                    type="text"
                    value={value}
                    onChange={(e) => onTextInput(option.id, option.maxLength ? e.target.value.slice(0, option.maxLength) : e.target.value)}
                    placeholder={option.placeholder}
                    maxLength={option.maxLength}
                    className={`h-12 w-full rounded-[10px] border px-3.5 pr-14 text-[14px] text-gray-800 outline-none transition-colors focus:ring-1 ${
                      error ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-navy-900 focus:ring-navy-900"
                    }`}
                  />
                  {option.maxLength && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">
                      {value.length}/{option.maxLength}
                    </span>
                  )}
                </div>
                {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
              </div>
            );
          }

          if (option.type === "textarea") {
            const value = textInputs[option.id] || "";
            const error = validationErrors[option.id];
            return (
              <div key={option.id}>
                <label htmlFor={option.id} className="text-[14px] font-bold text-navy-900">
                  {option.label} {!option.required && <span className="font-normal text-gray-500">(optional)</span>}
                </label>
                <textarea
                  id={option.id}
                  value={value}
                  onChange={(e) => onTextInput(option.id, option.maxLength ? e.target.value.slice(0, option.maxLength) : e.target.value)}
                  placeholder={option.placeholder}
                  maxLength={option.maxLength}
                  rows={3}
                  className={`mt-2 w-full rounded-[10px] border px-3.5 py-3 text-[14px] text-gray-800 outline-none transition-colors focus:ring-1 ${
                    error ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-navy-900 focus:ring-navy-900"
                  }`}
                />
                {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
              </div>
            );
          }

          if (option.type === "select") {
            return (
              <div key={option.id}>
                <label htmlFor={option.id} className="text-[14px] font-bold text-navy-900">
                  {option.label}
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

          return null;
        })}
      </div>

      {/* Gift packaging */}
      <label className="mt-5 flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={giftWrap}
          onChange={(e) => setGiftWrap(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-navy-900 focus:ring-navy-900"
        />
        <span className="text-[13px] text-gray-600">Geschenkverpackung hinzufügen (+€2,50)</span>
      </label>

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
              Hinzugefügt!
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              In den Warenkorb
            </>
          )}
        </button>
      </div>

      {/* PayPal Express Checkout */}
      <div className="mt-3.5">
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
                      product_id: product.id,
                      quantity,
                      price: String(displayedPrice),
                      customizations: textInputs,
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
      </div>
    </>
  );
}

// ─── Product Tabs ───────────────────────────────────────────────────────────────

function ProductTabs({ product, reviews }: { product: ProductPageProduct; reviews: WCReview[] }) {
  const descSection = product.detailSections.find((s) => s.id === "beschreibung") || product.detailSections[0];
  const shippingSection = product.detailSections.find((s) => s.id === "versand-und-fertigung");
  const reviewCount = reviews.length || product.reviewCount || 0;

  const tabList = ["Beschreibung", "Details", "Versand & Lieferung", `Bewertungen (${reviewCount})`];
  const [activeTab, setActiveTab] = useState<string>("Beschreibung");

  return (
    <section className="mx-auto mt-20 max-w-5xl px-5 sm:px-8 lg:px-0">
      {/* Tab headers */}
      <div className="flex gap-0 border-b border-gray-200">
        {tabList.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-3.5 text-[14px] font-bold transition-colors ${
              activeTab === tab ? "text-navy-900" : "text-gray-500 hover:text-gray-700"
            }`}
            aria-selected={activeTab === tab}
            role="tab"
          >
            {tab}
            {activeTab === tab && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-600" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-10" role="tabpanel">
        {activeTab === "Beschreibung" && descSection && (
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">{product.name}</h2>
            <div className="mt-4 max-w-2xl space-y-4 text-[15px] leading-7 text-gray-600">
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

        {activeTab === "Details" && (
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

        {activeTab === "Versand & Lieferung" && (
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

        {activeTab.startsWith("Bewertungen") &&
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
                    {review.verified && <span className="text-xs text-green-600">✓ Verifiziert</span>}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: review.review }} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-gray-500">Bewertungen werden hier angezeigt.</p>
          ))}
      </div>
    </section>
  );
}

// ─── Related Products ───────────────────────────────────────────────────────────

function RelatedProductsSection({ products }: { products: ProductPageProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8 lg:px-8">
      <h2 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Das könnte dir auch gefallen</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/shop/${p.slug}`}
            className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-4/3 bg-cream-50">
              <Image
                src={p.images[0]?.src || "/placeholders/product-detail-cream.svg"}
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

// ─── Main Page Component ────────────────────────────────────────────────────────

type ProductPageClientProps = {
  product: ProductPageProduct;
  reviews: WCReview[];
  relatedProducts: ProductPageProduct[];
};

function ProductPageClientContent({ product, reviews, relatedProducts }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialSelections(product));
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const [giftWrap, setGiftWrap] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);

  const images = product.images.length ? product.images : [{ src: "/placeholders/product-detail-cream.svg", alt: `${product.name} von Kubikart` }];
  const selectedVariation = getSelectedVariation(product, selectedOptions);
  const displayedPrice = selectedVariation?.price || product.price;
  const isOutOfStock = (selectedVariation?.availability || product.availability) === "out_of_stock";

  // Check if all required fields are satisfied
  const requiredTextFields = product.personalizationOptions.filter((o) => o.required && (o.type === "text" || o.type === "textarea"));
  const requiredSelectFields = product.personalizationOptions.filter((o) => o.required && o.type === "select" && !o.options?.length);
  const allRequiredFilled =
    requiredTextFields.every((o) => (textInputs[o.id] || "").trim().length > 0) &&
    requiredSelectFields.every((o) => (selectedOptions[o.id] || "").trim().length > 0);
  const canAddToCart = !isOutOfStock && allRequiredFilled;

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
        items: [{ product_id: product.id, quantity, price: String(displayedPrice.amount) }],
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
  }, [product.id, quantity, displayedPrice.amount]);

  function handleAddToCart() {
    // Validate required text/textarea fields
    const errors: Record<string, string> = {};
    for (const option of product.personalizationOptions) {
      if (option.required && (option.type === "text" || option.type === "textarea")) {
        if (!(textInputs[option.id] || "").trim()) {
          errors[option.id] = `${option.label} ist ein Pflichtfeld.`;
        }
      }
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});

    // Build customization summary for cart display
    const customizations: Record<string, string> = {};
    const customizationSummary: string[] = [];

    for (const option of product.personalizationOptions) {
      if (option.type === "select" || option.type === "color") {
        const value = selectedOptions[option.id];
        if (value) {
          const label = option.options?.find((o) => o.value === value)?.label || value;
          customizations[option.id] = value;
          customizationSummary.push(`${option.label}: ${label}`);
        }
      } else {
        const value = textInputs[option.id];
        if (value?.trim()) {
          customizations[option.id] = value.trim();
          customizationSummary.push(`${option.label}: ${value.trim()}`);
        }
      }
    }

    if (giftWrap) {
      customizations["_gift_wrap"] = "true";
      customizationSummary.push("Geschenkverpackung: Ja");
    }

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
        price: `${(displayedPrice.amount + (giftWrap ? 2.5 : 0)).toFixed(2)} €`,
        image: product.images[0]?.src || "",
        quantity,
        slug: product.slug,
        customizationSummary,
        customizations,
      });
    }

    writeCart(cart);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  }

  const reviewCount = reviews.length || product.reviewCount || 0;
  const reviewRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : product.averageRating || 0;

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-5 pt-7 pb-7 sm:px-8 lg:px-8">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-gray-500">
          <li>
            <Link href="/" className="hover:text-navy-900 transition-colors">
              Startseite
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2l4 4-4 4" />
            </svg>
          </li>
          <li>
            <Link href="/shop" className="hover:text-navy-900 transition-colors">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2l4 4-4 4" />
            </svg>
          </li>
          <li>
            <Link href="/shop" className="hover:text-navy-900 transition-colors">
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2l4 4-4 4" />
            </svg>
          </li>
          <li className="font-medium text-gray-800" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main product section */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          {/* Left – Gallery */}
          <ProductGallery images={images} activeIndex={selectedImage} onSelect={setSelectedImage} />

          {/* Right – Product Info & Purchase */}
          <div>
            {/* Badge */}
            {product.badges[0] && (
              <span className="inline-block rounded-md border border-accent-600 bg-accent-100 px-2.5 py-1 text-[12px] font-bold text-accent-600">
                {product.badges[0]}
              </span>
            )}

            {/* Title */}
            <h1 className="mt-4 text-[31px] font-extrabold leading-[1.08] tracking-[-0.035em] text-navy-900 sm:text-[42px]">{product.name}</h1>

            {/* Rating */}
            <div className="mt-3">
              <StarRating rating={reviewRating} count={reviewCount} />
            </div>

            {/* Price */}
            <div className="mt-5">
              <p className="text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[34px]">{formatProductPrice(displayedPrice)}</p>
              <p className="mt-1 text-[13px] text-gray-500">{product.priceNote}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">
                Preis gem.{" "}
                <Link href="/legal/agb" className="underline hover:text-gray-700">
                  § 19 UStG
                </Link>{" "}
                ohne Ausweis der MwSt.
                {" · "}
                <Link href="/legal/versand" className="underline hover:text-gray-700">
                  zzgl. Versandkosten
                </Link>
              </p>
              <p className="mt-1 text-[12px] text-gray-500">Lieferzeit: 3–5 Werktage</p>
            </div>

            {/* Short description */}
            <p className="mt-6 max-w-130 text-[15px] leading-7 text-gray-600">{product.shortDescription}</p>

            {/* Personalization */}
            <PersonalizationForm
              canAddToCart={canAddToCart}
              product={product}
              quantity={quantity}
              displayedPrice={displayedPrice.amount + (giftWrap ? 2.5 : 0)}
              shippingRate={expressShippingRate}
              selectedOptions={selectedOptions}
              textInputs={textInputs}
              giftWrap={giftWrap}
              validationErrors={validationErrors}
              addedToCart={addedToCart}
              setQuantity={setQuantity}
              setGiftWrap={setGiftWrap}
              onOptionSelect={(optionId, value) =>
                setSelectedOptions((currentSelections) => ({
                  ...currentSelections,
                  [optionId]: value,
                }))
              }
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

            {/* Trust icons */}
            <TrustIcons />

            {/* Trust/support card */}
            <TrustSupportCard />
          </div>
        </div>
      </section>

      {/* Product tabs */}
      <ProductTabs product={product} reviews={reviews} />

      {/* Additional product sections */}
      <div className="mx-auto max-w-7xl space-y-20 px-5 py-16 sm:px-8 lg:px-8 lg:space-y-24 lg:py-20">
        <ProductBenefits benefits={product.benefits} />
        <ProductLeadCTA product={product} />
        <ProductFAQ faqs={product.faqs} />
        <ProductSeoContent content={product.seoContent} />
      </div>

      {/* Related products */}
      <RelatedProductsSection products={relatedProducts} />

      {/* Bottom spacing */}
      <div className="h-24" />
    </div>
  );
}

export function ProductPageClient({ product, reviews, relatedProducts }: ProductPageClientProps) {
  return <ProductPageClientContent key={product.id} product={product} reviews={reviews} relatedProducts={relatedProducts} />;
}
