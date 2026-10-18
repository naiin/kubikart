import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-optimization";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBusinessKitCommercialState, isBusinessKitProduct, parseBusinessKitData } from "@/lib/business-kits";
import { isEnquiryOnly } from "@/lib/purchase-mode";
import { KitIllustrationForProduct } from "@/components/business-kits/KitIllustration";
import { IllustrativeImageBadge } from "@/components/business-kits/IllustrativeImageBadge";
import { normalizeLocale } from "@/lib/seo";
import type { WCProduct } from "@/lib/woocommerce";

function formatPrice(value: string, locale: string) {
  const amount = Number.parseFloat(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function ProductCard({ product }: { product: WCProduct }) {
  const t = useTranslations("productCard");
  const locale = useLocale();
  const image = product.images[0];
  const category = product.categories[0];
  const isKit = isBusinessKitProduct(product, normalizeLocale(locale));
  const kitState = isKit || isEnquiryOnly(product) ? getBusinessKitCommercialState(product) : null;
  const enquiryState = kitState?.kind === "enquiry" ? kitState : null;
  const showsPrice = !kitState || kitState.kind === "purchasable" || kitState.kind === "outOfStock";
  const currentPrice = showsPrice ? formatPrice(product.price, locale) : null;
  const regularPrice = product.on_sale ? formatPrice(product.regular_price, locale) : null;
  // Variable products whose variations differ in price are shown "from" their lowest price.
  const isPriceRange = product.type === "variable" && /–|&ndash;|&#8211;/.test(product.price_html ?? "");
  const averageRating = Number.parseFloat(product.average_rating || "0");
  const hasRating = product.rating_count > 0 && averageRating > 0;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-kubikart-md border border-border bg-surface-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-kubikart-md">
      <Link href={`/shop/${product.slug}`} className={`relative block overflow-hidden bg-page ${image ? "aspect-square" : "aspect-[4/3]"}`}>
        {image ? (
          <Image
            src={image.src}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 480px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.025]"
            // Resized by Next on public hosts (the originals are 1254 px, up to 2.5 MB); local WordPress is served as is.
            unoptimized={!canOptimizeImage(image.src)}
            quality={85}
          />
        ) : kitState && parseBusinessKitData(product.meta_data).items.length > 0 ? (
          <KitIllustrationForProduct product={product} />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-muted"
            role="img"
            aria-label={t("missingImage", { product: product.name })}
          >
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
              <path strokeLinecap="round" d="M14 8h.01" />
            </svg>
          </span>
        )}

        {kitState && image ? <IllustrativeImageBadge /> : null}

        {product.on_sale ? (
          <span className="absolute top-3 left-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">{t("sale")}</span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {category ? <p className="text-xs font-semibold tracking-[0.06em] text-muted uppercase">{category.name}</p> : null}

        <h3 className="mt-2 font-heading text-base leading-6 font-bold text-brand">
          <Link href={`/shop/${product.slug}`} className="rounded-kubikart-sm transition-colors hover:text-accent">
            {product.name}
          </Link>
        </h3>

        {hasRating ? (
          <div className="mt-3 flex items-center gap-2 text-sm" aria-label={t("ratingLabel", { rating: averageRating.toFixed(1), count: product.rating_count })}>
            <span className="text-accent" aria-hidden="true">★</span>
            <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-muted">({product.rating_count})</span>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          <div className="flex flex-wrap items-baseline gap-2">
            {regularPrice ? <span className="text-sm text-muted line-through">{regularPrice}</span> : null}
            {enquiryState ? (
              enquiryState.startingPrice ? (
                <span className="font-heading text-lg font-bold text-accent">{t("startingPrice", { price: formatPrice(String(enquiryState.startingPrice), locale) ?? "" })}</span>
              ) : (
                <span className="text-sm font-semibold text-brand">{t("priceOnRequest")}</span>
              )
            ) : currentPrice ? (
              <span className="font-heading text-lg font-bold text-accent">{isPriceRange ? t("startingPrice", { price: currentPrice }) : currentPrice}</span>
            ) : (
              <span className="text-sm text-muted">{kitState ? t("kitUnavailable") : t("priceUnavailable")}</span>
            )}
          </div>

          {enquiryState ? (
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-brand">{t("kitEnquiry")}</span>
          ) : null}

          {(kitState ? kitState.kind === "outOfStock" : product.stock_status === "outofstock") ? (
            <span className="rounded-full border border-danger/25 bg-danger/5 px-2.5 py-1 text-xs font-semibold text-danger">{t("outOfStock")}</span>
          ) : null}
        </div>

        {enquiryState ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href={`/kontakt?product=${encodeURIComponent(product.slug)}`} className="kk-link inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold">
              {isKit ? t("enquireBundle") : t("enquire")}
              <span aria-hidden="true">→</span>
            </Link>
            <Link href={`/shop/${product.slug}`} className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-2 hover:text-brand hover:underline">
              {t("viewDetails")}
            </Link>
          </div>
        ) : (
          <Link href={`/shop/${product.slug}`} className="kk-link mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold">
            {t("selectProduct")}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
