import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getProducts, type WCProduct } from "@/lib/woocommerce";

export async function PopularProducts() {
  const [t, locale] = await Promise.all([getTranslations("homeRedesign.products"), getLocale()]);
  let products: WCProduct[] = [];

  try {
    products = await getProducts({ per_page: 4, orderby: "popularity" }, locale);
  } catch {
    products = [];
  }

  if (products.length === 0) {
    return (
      <section className="kk-section-major bg-surface">
        <div className="kk-container">
          <div className="rounded-kubikart-lg border border-border bg-surface-white px-6 py-10 text-center">
            <h2 className="kk-heading-2">{t("title")}</h2>
            <p className="kk-body mt-4 text-muted">{t("unavailable")}</p>
            <Link href="/shop" className="kk-link mt-5 inline-flex min-h-11 items-center font-semibold">
              {t("allLink")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="kk-section-major bg-surface">
      <div className="kk-container-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("eyebrow")}</p>
            <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          </div>
          <Link href="/shop" className="kk-link inline-flex min-h-11 items-center gap-2 font-semibold">
            {t("allLink")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
