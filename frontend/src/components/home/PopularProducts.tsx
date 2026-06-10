import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { getProducts, WCProduct } from "@/lib/woocommerce";
import { ProductCard } from "@/components/ProductCard";

export async function PopularProducts() {
  const t = await getTranslations("homepage");
  const locale = await getLocale();

  let products: WCProduct[] = [];

  try {
    products = await getProducts({ per_page: 4, orderby: "popularity" }, locale);
  } catch {
    products = [];
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-[28px] sm:text-[38px] font-bold leading-[1.15] tracking-[-0.03em] text-navy-900">{t("productsTitle")}</h2>
          <Link href="/shop" className="hidden sm:inline-flex items-center text-sm font-semibold text-navy-900 hover:text-accent-600 transition-colors">
            {t("productsLink")} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-xl bg-navy-900 px-7 py-3.5 text-[15px] font-bold text-white hover:bg-navy-800 transition-colors"
          >
            {t("productsLink")}
          </Link>
        </div>
      </div>
    </section>
  );
}
