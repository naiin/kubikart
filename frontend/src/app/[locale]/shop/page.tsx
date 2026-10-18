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
import { Link } from "@/i18n/navigation";
import { isBusinessKitProduct, resolveBusinessKitsCategory } from "@/lib/business-kits";
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

  const fetchedProducts: WCProduct[] = productsResult.status === "fulfilled" ? productsResult.value : [];
  const categories: WCCategory[] = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const siteLocale = normalizeLocale(locale);
  // Enquiry-only Business Bundles are not mixed into the unfiltered list; they stay in their category, in search and in
  // the Business Products category.
  const hideBundles = !categoryId && !searchQuery;
  const products = hideBundles ? fetchedProducts.filter((product) => !isBusinessKitProduct(product, siteLocale)) : fetchedProducts;
  const bundlesCategory = resolveBusinessKitsCategory(categories, siteLocale);
  const showBundlesHint = hideBundles && Boolean(bundlesCategory) && products.length < fetchedProducts.length;
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
            {showBundlesHint && bundlesCategory ? (
              <p className="mt-4 rounded-kubikart-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
                {t("bundlesSeparate")}{" "}
                <Link href={`/shop?category=${bundlesCategory.id}#products`} className="kk-link inline-flex min-h-11 items-center font-semibold">
                  {t("bundlesSeparateLink")}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="mt-8">
            {productsUnavailable || products.length === 0 ? (
              <ShopEmptyState unavailable={productsUnavailable} />
            ) : (
              <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3">
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
