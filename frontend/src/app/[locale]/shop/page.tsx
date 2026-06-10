import type { Metadata } from "next";
import { getProducts, getCategories, WCProduct, WCCategory } from "@/lib/woocommerce";
import { ProductCard } from "@/components/ProductCard";
import { ShopHero } from "@/components/shop/ShopHero";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { ShopFilterSidebar, MobileFilterDrawer } from "@/components/shop/ShopFilters";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { ShopEmptyState } from "@/components/shop/ShopEmptyState";
import { ShopCustomCTA } from "@/components/shop/ShopCustomCTA";
import { ShopTrustSection } from "@/components/shop/ShopTrustSection";
import { ShopFAQ } from "@/components/shop/ShopFAQ";
import { ShopSeoContent } from "@/components/shop/ShopSeoContent";
import { ShopJsonLd } from "@/components/shop/ShopJsonLd";

export const metadata: Metadata = {
  title: "Shop für personalisierte Geschenke, Lasergravur & 3D-Druck | Kubikart",
  description:
    "Entdecke personalisierte Produkte, Lasergravuren, Holz- und Acrylgeschenke, 3D-Druck und Sonderanfertigungen von Kubikart. Jetzt online stöbern.",
  openGraph: {
    title: "Kubikart Shop – Personalisierte Produkte & Sonderanfertigungen",
    description: "Personalisierte Geschenke, Schlüsselanhänger, Holzprodukte, Acrylstände und 3D-Druck Produkte – individuell gefertigt in Deutschland.",
  },
};

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const categoryId = sp.category;
  const sort = sp.sort || "date";
  const searchQuery = sp.q || "";

  let orderby: string = "date";
  let order: string = "desc";

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
      order = "desc";
      break;
    default:
      orderby = "date";
      order = "desc";
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

  let products: WCProduct[] = [];
  let categories: WCCategory[] = [];

  try {
    products = await getProducts(productParams, locale);
  } catch {
    products = [];
  }

  try {
    categories = await getCategories(locale);
  } catch {
    categories = [];
  }

  return (
    <>
      <ShopJsonLd products={products} locale={locale} />
      <ShopHero />
      {/* <ShopCategoryCards categories={categories} /> */}

      {/* Main shop area */}
      <section id="products" className="py-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Desktop sidebar */}
            <ShopFilterSidebar categories={categories} />

            {/* Product area */}
            <div className="flex-1 min-w-0">
              {/* Mobile filter trigger + toolbar */}
              <div className="flex items-center gap-3 mb-4 lg:hidden">
                <MobileFilterDrawer categories={categories} />
              </div>

              <ShopToolbar productCount={products.length} />
              <ActiveFilterChips categories={categories} />

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <ShopEmptyState />
              )}
            </div>
          </div>
        </div>
      </section>

      <ShopCustomCTA />
      <ShopTrustSection />
      <ShopFAQ />
      <ShopSeoContent />
    </>
  );
}
