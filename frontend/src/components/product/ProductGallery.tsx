"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IllustrativeImageBadge } from "@/components/business-kits/IllustrativeImageBadge";

type GalleryImage = { src: string; alt: string; caption?: string };

type ProductGalleryProps = {
  images: GalleryImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
  illustrative?: boolean;
  note?: string;
};

export function ProductGallery({ images, activeIndex, onSelect, illustrative = false, note }: ProductGalleryProps) {
  const t = useTranslations("productPage");
  const active = images[activeIndex] || images[0];
  const [zoomed, setZoomed] = useState(false);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectPrevious = useCallback(
    () => onSelect((activeIndex - 1 + images.length) % images.length),
    [activeIndex, images.length, onSelect],
  );
  const selectNext = useCallback(
    () => onSelect((activeIndex + 1) % images.length),
    [activeIndex, images.length, onSelect],
  );

  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!zoomed) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowLeft" && images.length > 1) selectPrevious();
      if (event.key === "ArrowRight" && images.length > 1) selectNext();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [zoomed, images.length, selectNext, selectPrevious]);

  if (!active) {
    return (
      <section aria-label={t("galleryLabel")}>
        <div className="flex aspect-square items-center justify-center rounded-kubikart-lg border border-border bg-surface text-center text-sm text-muted">
          <div>
            <svg className="mx-auto mb-3 h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
            </svg>
            {t("imageUnavailable")}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={t("galleryLabel")} className="min-w-0 max-w-full">
      <figure>
        <div className="relative aspect-square overflow-hidden rounded-kubikart-lg border border-border bg-surface-white">
          <Image src={active.src} alt={active.alt} fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-contain" unoptimized />
          {illustrative ? <IllustrativeImageBadge className="left-4 bottom-4" /> : null}

          {images.length > 1 ? (
            <>
              <GalleryArrow direction="previous" label={t("galleryPrevious")} onClick={selectPrevious} />
              <GalleryArrow direction="next" label={t("galleryNext")} onClick={selectNext} />
            </>
          ) : null}

          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {images.length > 1 ? (
              <span className="rounded-full bg-brand/90 px-3 py-2 text-xs font-semibold text-white" aria-live="polite">
                {activeIndex + 1} / {images.length}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/95 text-brand shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label={t("galleryZoom")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
              </svg>
            </button>
          </div>
        </div>

        {active.caption || note ? (
          <figcaption className="mt-3 space-y-1 text-xs leading-5 text-muted">
            {active.caption ? <p>{active.caption}</p> : null}
            {note ? <p>{note}</p> : null}
          </figcaption>
        ) : null}
      </figure>

      {images.length > 1 ? (
        <div className="mt-4 flex w-full min-w-0 snap-x gap-3 overflow-x-auto overscroll-x-contain pb-2" role="group" aria-label={t("galleryLabel")}>
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              ref={(element) => { thumbnailRefs.current[index] = element; }}
              type="button"
              onClick={() => onSelect(index)}
              className={`relative aspect-square w-20 shrink-0 snap-start overflow-hidden rounded-kubikart-md bg-surface-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-22 ${index === activeIndex ? "border-2 border-accent" : "border border-border hover:border-border-strong"}`}
              aria-label={t("galleryViewImage", { index: index + 1 })}
              aria-pressed={index === activeIndex}
            >
              <Image src={image.src} alt="" fill sizes="88px" className="object-contain" unoptimized />
            </button>
          ))}
        </div>
      ) : null}

      {zoomed ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setZoomed(false)} role="dialog" aria-modal="true" aria-label={t("galleryPreview")}>
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5 sm:top-5"
            aria-label={t("galleryClose")}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[85vh] w-[90vw] max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <Image src={active.src} alt={active.alt} fill sizes="90vw" className="object-contain" unoptimized />
          </div>
          {active.caption ? <p className="absolute inset-x-4 bottom-4 mx-auto max-w-3xl rounded-xl bg-black/60 px-4 py-2 text-center text-xs leading-5 text-white">{active.caption}</p> : null}
          {images.length > 1 ? (
            <>
              <GalleryArrow direction="previous" label={t("galleryPrevious")} onClick={selectPrevious} lightbox />
              <GalleryArrow direction="next" label={t("galleryNext")} onClick={selectNext} lightbox />
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function GalleryArrow({ direction, label, onClick, lightbox = false }: { direction: "previous" | "next"; label: string; onClick: () => void; lightbox?: boolean }) {
  const side = direction === "previous" ? "left-3 sm:left-4" : "right-3 sm:right-4";
  const colors = lightbox ? "bg-white/15 text-white hover:bg-white/25 focus-visible:outline-white" : "border border-border bg-white/95 text-brand shadow-sm hover:bg-surface focus-visible:outline-accent";

  return (
    <button
      type="button"
      onClick={(event) => {
        if (lightbox) event.stopPropagation();
        onClick();
      }}
      className={`absolute ${side} top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${colors}`}
      aria-label={label}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={direction === "previous" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
