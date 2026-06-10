import { useTranslations } from "next-intl";
import { formatProductPrice, type ProductPageProduct } from "@/lib/product-page";

export function StickyMobileCTA({ product, formId }: { product: ProductPageProduct; formId: string }) {
  const t = useTranslations("productPage");
  const canAddToCart = product.availability !== "out_of_stock";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-300 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{t("price")}</p>
          <p className="truncate text-lg font-extrabold tracking-[-0.03em] text-navy-900">{formatProductPrice(product.price)}</p>
        </div>
        <button
          type="submit"
          form={formId}
          disabled={!canAddToCart}
          className={`inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition ${
            canAddToCart ? "bg-navy-900 text-white hover:bg-navy-800" : "cursor-not-allowed bg-gray-300 text-white"
          }`}
        >
          {canAddToCart ? t("stickyAddToCart") : t("stickyOutOfStock")}
        </button>
      </div>
    </div>
  );
}
