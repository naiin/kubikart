import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getBusinessKitCommercialState, parseBusinessKitData } from "@/lib/business-kits";
import { KitIllustrationForProduct } from "@/components/business-kits/KitIllustration";
import { canOptimizeImage } from "@/lib/image-optimization";
import type { WCProduct } from "@/lib/woocommerce";
import type { SiteLocale } from "@/lib/seo";

function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPrice(price: string, locale: SiteLocale) {
  const amount = Number.parseFloat(price);
  if (!Number.isFinite(amount)) return null;

  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export async function BusinessKitCard({ product, locale }: { product: WCProduct; locale: SiteLocale }) {
  const t = await getTranslations("businessKitsOverview");
  const image = product.images[0];
  const description = plainText(product.short_description);
  const state = getBusinessKitCommercialState(product);
  const hasIllustration = parseBusinessKitData(product.meta_data).items.length > 0;
  const price = state.kind === "purchasable" || state.kind === "outOfStock" ? formatPrice(product.price, locale) : null;
  const statusLabel =
    state.kind === "purchasable"
      ? t("orderable")
      : state.kind === "outOfStock"
        ? t("outOfStock")
        : state.kind === "enquiry"
          ? t("enquiryOnly")
          : t("notOrderable");

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-kubikart-lg border border-border bg-surface-white shadow-kubikart-sm">
      <Link href={`/shop/${product.slug}`} className={`relative block overflow-hidden bg-surface ${image ? "aspect-square" : "aspect-[16/10]"}`}>
        {image ? (
          <Image
            src={image.src}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.025]"
            unoptimized={!canOptimizeImage(image.src)}
          />
        ) : hasIllustration ? (
          <KitIllustrationForProduct product={product} />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted" role="img" aria-label={t("missingImage", { name: product.name })}>
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
              <path strokeLinecap="round" d="M14 8h.01" />
            </svg>
            {t("imagePending")}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-heading text-xl leading-7 font-bold text-brand">
          <Link href={`/shop/${product.slug}`} className="rounded-kubikart-sm transition-colors hover:text-accent">
            {product.name}
          </Link>
        </h2>

        {description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{description}</p> : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            {price ? (
              <p className="font-heading text-lg font-bold text-accent">{price}</p>
            ) : state.kind === "enquiry" && state.startingPrice ? (
              <p className="font-heading text-lg font-bold text-accent">{t("startingPrice", { price: formatPrice(String(state.startingPrice), locale) ?? "" })}</p>
            ) : (
              <p className="font-heading text-base font-bold text-brand">{state.kind === "enquiry" ? t("enquiryPrice") : t("priceUnavailable")}</p>
            )}
            <p className={`mt-1 text-xs font-semibold ${state.kind === "outOfStock" || state.kind === "unavailable" ? "text-danger" : "text-muted"}`}>
              {statusLabel}
            </p>
          </div>

          {state.kind === "enquiry" ? (
            <div className="flex flex-wrap gap-2">
              <Link href={`/kontakt?product=${encodeURIComponent(product.slug)}`} className="kk-button kk-button-primary min-h-11">
                {t("enquire")}
              </Link>
              <Link href={`/shop/${product.slug}`} className="kk-button kk-button-secondary min-h-11" aria-label={t("viewKit", { name: product.name })}>
                {t("details")}
              </Link>
            </div>
          ) : (
            <Link href={`/shop/${product.slug}`} className="kk-button kk-button-secondary min-h-11">
              {t("viewKit", { name: product.name })}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
