"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";

export function ShopToolbar({ productCount }: { productCount: number }) {
  const t = useTranslations("shopPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") || "";
  const currentSort = ["date", "popularity", "price-asc", "price-desc"].includes(sortParam)
    ? sortParam
    : "date";
  const currentSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(currentSearch);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    updateParam("q", search.trim());
  }

  return (
    <div className="grid gap-4 border-y border-border py-5 lg:grid-cols-[minmax(16rem,1fr)_auto_auto] lg:items-end">
      <form onSubmit={handleSearch}>
        <label htmlFor="shop-product-search" className="mb-2 block text-sm font-semibold text-brand">
          {t("searchLabel")}
        </label>
        <div className="relative">
          <svg className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path strokeLinecap="round" d="m16 16 4 4" />
          </svg>
          <input
            id="shop-product-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="kk-form-control min-h-11 w-full pl-11"
          />
        </div>
      </form>

      <p className="text-sm text-muted lg:pb-3" aria-live="polite">
        <span className="font-semibold text-foreground">{productCount}</span>{" "}
        {t(productCount === 1 ? "productSingular" : "productPlural")}
      </p>

      <div>
        <label htmlFor="shop-product-sort" className="mb-2 block text-sm font-semibold text-brand">
          {t("sortLabel")}
        </label>
        <select
          id="shop-product-sort"
          value={currentSort}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="kk-form-control min-h-11 w-full lg:w-auto"
        >
          <option value="date">{t("sortNewest")}</option>
          <option value="popularity">{t("sortPopular")}</option>
          <option value="price-asc">{t("sortPriceAsc")}</option>
          <option value="price-desc">{t("sortPriceDesc")}</option>
        </select>
      </div>
    </div>
  );
}
