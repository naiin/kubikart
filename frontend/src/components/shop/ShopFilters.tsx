"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { WCCategory } from "@/lib/woocommerce";

const HIDDEN_CATEGORY_SLUGS = new Set(["uncategorized", "uncategorized-en"]);

export function ShopCategoryFilters({ categories }: { categories: WCCategory[] }) {
  const t = useTranslations("shopPage");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const visibleCategories = categories.filter((category) => category.count > 0 && !HIDDEN_CATEGORY_SLUGS.has(category.slug));

  const updateCategory = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (categoryId) {
        params.set("category", categoryId);
      } else {
        params.delete("category");
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return (
    <div aria-labelledby="shop-category-filter-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">{t("categoriesEyebrow")}</p>
          <h2 id="shop-category-filter-title" className="kk-heading-3 mt-2">{t("categoriesTitle")}</h2>
        </div>
        {visibleCategories.length === 0 ? <p className="text-sm text-muted">{t("categoriesUnavailable")}</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("filterCategory")}>
        <button
          type="button"
          onClick={() => updateCategory("")}
          aria-pressed={!activeCategory}
          className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            !activeCategory
              ? "border-brand bg-brand text-white"
              : "border-border bg-surface-white text-brand hover:border-accent hover:text-accent"
          }`}
        >
          {t("filterAll")}
        </button>

        {visibleCategories.map((category) => {
          const selected = activeCategory === String(category.id);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => updateCategory(String(category.id))}
              aria-pressed={selected}
              className={`inline-flex min-h-11 max-w-full items-center rounded-full border px-4 py-2 text-left text-sm font-semibold transition-colors ${
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-surface-white text-brand hover:border-accent hover:text-accent"
              }`}
            >
              <span className="break-words">{category.name}</span>
              <span className="ml-1.5 text-xs opacity-70" aria-label={t("categoryProductCount", { count: category.count })}>
                {category.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
