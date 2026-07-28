import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/ProductCard";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { ShopBusinessKitsPromo } from "@/components/shop/ShopBusinessKitsPromo";
import { ShopCustomerPaths } from "@/components/shop/ShopCustomerPaths";
import { ShopCustomCTA } from "@/components/shop/ShopCustomCTA";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";
import { ShopCategoryFilters } from "@/components/shop/ShopFilters";
import { ShopHero } from "@/components/shop/ShopHero";
import { ShopJsonLd } from "@/components/shop/ShopJsonLd";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";
import { getCategories, getProducts, type WCCategory, type WCProduct } from "@/lib/woocommerce";

type ShopSearchParams = {
  category?: string;
  sort?: string;
  q?: string;
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ShopSearchParams>;
}): Promise<Metadata> {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "shopPage" });
  const hasQueryState = Boolean(query.category || query.sort || query.q);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.shop,
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    index: !hasQueryState,
  });
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ShopSearchParams>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "shopPage" });
  const categoryId = query.category && /^\d+$/.test(query.category) ? query.category : "";
  const searchQuery = query.q?.trim() || "";
  const requestedSort = query.sort || "";
  const sort = ["date", "popularity", "price-asc", "price-desc"].includes(requestedSort)
    ? requestedSort
    : "date";

  let orderby = "date";
  let order = "desc";

  switch (sort) {
    case "price-asc":
      orderby = "price";
      order = "asc";
      break;
    case "price-desc":
      orderby = "price";
      order = "desc";
      break;
    case "popularity":
      orderby = "popularity";
      break;
  }

  const productParams: Record<string, string | number | boolean> = {
    per_page: 50,
    orderby,
    order,
  };

  if (categoryId) {
    productParams.category = categoryId;
  }

  if (searchQuery) {
    productParams.search = searchQuery;
  }

  const [productsResult, categoriesResult] = await Promise.allSettled([
    getProducts(productParams, locale),
    getCategories(locale),
  ]);

  const products: WCProduct[] = productsResult.status === "fulfilled" ? productsResult.value : [];
  const categories: WCCategory[] = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const productsUnavailable = productsResult.status === "rejected";

  return (
    <div className="bg-page">
      <ShopJsonLd products={products} locale={locale} />
      <ShopHero />
      <ShopCustomerPaths categories={categories} />

      <section id="products" className="kk-section-major bg-surface-white" aria-labelledby="shop-products-title">
        <div className="kk-container-full">
          <ShopCategoryFilters categories={categories} />

          <div className="mt-8">
            <h2 id="shop-products-title" className="sr-only">
              {t("productsHeading")}
            </h2>
            <ShopToolbar productCount={products.length} />
            <ActiveFilterChips categories={categories} />
          </div>

          <div className="mt-8">
            {productsUnavailable || products.length === 0 ? (
              <ShopEmptyState unavailable={productsUnavailable} />
            ) : (
              <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <ShopBusinessKitsPromo />
      <ShopCustomCTA />
    </div>
  );
}
