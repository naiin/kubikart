"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

export function ShopToolbar({ productCount }: { productCount: number }) {
  const t = useTranslations("shopPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "date";
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
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", search.trim());
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm text-gray-950 placeholder:text-gray-500 focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </form>

      {/* Product count */}
      <p className="text-sm text-gray-500 whitespace-nowrap">
        {productCount} {t("productCount")}
      </p>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => updateParam("sort", e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-950 focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-colors"
      >
        <option value="date">{t("sortNewest")}</option>
        <option value="popularity">{t("sortPopular")}</option>
        <option value="price-asc">{t("sortPriceAsc")}</option>
        <option value="price-desc">{t("sortPriceDesc")}</option>
      </select>
    </div>
  );
}
