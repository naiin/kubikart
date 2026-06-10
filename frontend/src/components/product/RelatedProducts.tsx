import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatProductPrice, type ProductPageProduct } from "@/lib/product-page";

export function RelatedProducts({ products }: { products: ProductPageProduct[] }) {
  const t = useTranslations("productPage");

  return (
    <section aria-labelledby="related-products">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-600">{t("relatedLabel")}</p>
          <h2 id="related-products" className="mt-3 text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[38px]">
            {t("relatedTitle")}
          </h2>
        </div>
        <Link href="/shop" className="hidden text-sm font-bold text-navy-900 transition hover:text-accent-600 sm:inline-flex">
          {t("relatedShopLink")}
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => {
          const previewImage = product.images[0] || { src: "/placeholders/product-detail-cream.svg", alt: `${product.name} von Kubikart` };

          return (
            <Link
              key={product.slug}
              href={`/shop/${product.slug}`}
              className="group overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_18px_50px_rgba(6,20,38,0.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(6,20,38,0.08)]"
            >
              <div className="relative aspect-square overflow-hidden bg-cream-50">
                <Image
                  src={previewImage.src}
                  alt={previewImage.alt}
                  fill
                  sizes="(min-width: 1280px) 24vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-600">{product.category.name}</p>
                <h3 className="mt-3 text-lg font-bold leading-7 text-navy-900">{product.name}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 line-clamp-2">{product.subtitle}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-base font-extrabold text-navy-900">{formatProductPrice(product.price)}</span>
                  <span className="text-sm font-semibold text-navy-900 transition group-hover:text-accent-600">{t("relatedView")}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
