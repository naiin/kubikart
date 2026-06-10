import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { WCProduct } from "@/lib/woocommerce";

export function ProductCard({ product }: { product: WCProduct }) {
  const t = useTranslations("common");
  const image = product.images[0];

  return (
    <Link href={`/shop/${product.slug}`} className="group flex flex-col rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-950 group-hover:text-accent-600 transition-colors line-clamp-2">{product.name}</h3>
        {parseFloat(product.average_rating || "0") > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill={i < Math.round(parseFloat(product.average_rating)) ? "#f78801" : "#e5e7eb"}
                  aria-hidden="true"
                >
                  <path d="M10 1.25l2.47 5.01 5.53.8-4 3.9.95 5.5L10 13.77l-4.95 2.69.95-5.5-4-3.9 5.53-.8L10 1.25z" />
                </svg>
              ))}
            </div>
            {(product.rating_count ?? 0) > 0 && <span className="text-[11px] text-gray-500">({product.rating_count})</span>}
          </div>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {product.on_sale && product.regular_price && <span className="text-xs text-gray-400 line-through">€{product.regular_price}</span>}
            <span className="text-base font-bold text-gray-900">€{product.price}</span>
          </div>
          {product.stock_status === "outofstock" && <span className="text-xs text-red-500 font-medium">{t("outOfStock")}</span>}
        </div>
      </div>
    </Link>
  );
}
