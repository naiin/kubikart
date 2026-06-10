"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import type { ProductPageProduct } from "@/lib/product-page";

export function ProductGallery({ product }: { product: ProductPageProduct }) {
  const t = useTranslations("productPage");
  const galleryImages = product.images.length ? product.images : [{ src: "/placeholders/product-detail-cream.svg", alt: `${product.name} von Kubikart` }];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[activeIndex] || galleryImages[0];

  return (
    <section aria-label={t("galleryLabel")}>
      <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_18px_60px_rgba(6,20,38,0.08)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-accent-100 via-white to-cream-50" aria-hidden="true" />
        <div className="relative aspect-square">
          <Image src={activeImage.src} alt={activeImage.alt} fill priority sizes="(min-width: 1024px) 48vw, 100vw" unoptimized className="object-cover" />
        </div>
      </div>

      {galleryImages.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {galleryImages.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${product.slug}-${image.src}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                  isActive ? "border-navy-900 ring-2 ring-navy-900/10" : "border-gray-200 hover:border-gray-300"
                }`}
                aria-label={t("galleryViewImage", { index: index + 1 })}
                aria-pressed={isActive}
              >
                <Image src={image.src} alt={image.alt} fill sizes="25vw" unoptimized className="object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
