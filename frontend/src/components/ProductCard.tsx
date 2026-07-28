import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const currentPrice = formatPrice(product.price, locale);
  const regularPrice = product.on_sale ? formatPrice(product.regular_price, locale) : null;
  const averageRating = Number.parseFloat(product.average_rating || "0");
  const hasRating = product.rating_count > 0 && averageRating > 0;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-kubikart-md border border-border bg-surface-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-kubikart-md">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-page">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.025]"
            unoptimized
          />
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
            {currentPrice ? <span className="font-heading text-lg font-bold text-accent">{currentPrice}</span> : <span className="text-sm text-muted">{t("priceUnavailable")}</span>}
          </div>

          {product.stock_status === "outofstock" ? (
            <span className="rounded-full border border-danger/25 bg-danger/5 px-2.5 py-1 text-xs font-semibold text-danger">{t("outOfStock")}</span>
          ) : null}
        </div>

        <Link href={`/shop/${product.slug}`} className="kk-link mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold">
          {t("viewDetails")}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
