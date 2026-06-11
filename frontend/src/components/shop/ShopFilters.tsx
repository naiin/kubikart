"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { WCCategory } from "@/lib/woocommerce";
import { useCallback, useState } from "react";

interface ShopFiltersProps {
  categories: WCCategory[];
}

function groupCategories(categories: WCCategory[]) {
  const parentCategories = categories.filter((c) => c.parent === 0 && c.slug !== "uncategorized" && c.slug !== "uncategorized-en");
  const businessParent = parentCategories.find((c) => c.slug === "business-produkte" || c.slug === "business-products");
  const businessChildIds = businessParent ? categories.filter((c) => c.parent === businessParent.id).map((c) => c.id) : [];
  const businessCats = businessParent ? [businessParent, ...categories.filter((c) => c.parent === businessParent.id)] : [];
  const personalCats = parentCategories.filter((c) => c.id !== businessParent?.id && !businessChildIds.includes(c.id));
  return { personalCats, businessCats };
}

export function ShopFilterSidebar({ categories }: ShopFiltersProps) {
  const t = useTranslations("shopPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";

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

  const resetFilters = () => {
    router.push(pathname);
  };

  const hasFilters = searchParams.toString().length > 0;
  const { personalCats, businessCats } = groupCategories(categories);

  return (
    <aside className="hidden lg:block w-70 shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Category Filter */}
        <div className="rounded-[18px] border border-gray-200 p-5 bg-white">
          <h3 className="text-sm font-bold text-navy-900 mb-3">{t("filterCategory")}</h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => updateParam("category", "")}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  !activeCategory ? "bg-navy-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t("filterAll")}
              </button>
            </li>
          </ul>

          {/* Personal / Gifts */}
          {personalCats.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">{t("filterGroupPersonal")}</p>
              <ul className="space-y-1">
                {personalCats.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => updateParam("category", String(cat.id))}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        activeCategory === String(cat.id) ? "bg-navy-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {cat.name}
                      {cat.count > 0 && <span className="ml-1 text-xs opacity-70">({cat.count})</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Business */}
          {businessCats.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-600 px-3 mb-2">{t("filterGroupBusiness")}</p>
              <ul className="space-y-1">
                {businessCats.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => updateParam("category", String(cat.id))}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        activeCategory === String(cat.id) ? "bg-navy-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                      } ${cat.parent !== 0 ? "pl-6" : ""}`}
                    >
                      {cat.name}
                      {cat.count > 0 && <span className="ml-1 text-xs opacity-70">({cat.count})</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Reset */}
        {hasFilters && (
          <button onClick={resetFilters} className="w-full text-sm font-semibold text-accent-600 hover:text-navy-900 transition-colors">
            {t("filterReset")}
          </button>
        )}
      </div>
    </aside>
  );
}

/* ─── Mobile Filter Drawer ─── */

export function MobileFilterDrawer({ categories }: ShopFiltersProps) {
  const t = useTranslations("shopPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [open, setOpen] = useState(false);
  const { personalCats, businessCats } = groupCategories(categories);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
      setOpen(false);
    },
    [router, pathname, searchParams],
  );

  const resetFilters = () => {
    router.push(pathname);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-gray-100 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {t("filterButton")}
      </button>

      {/* Backdrop + Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[320px] max-w-full bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-navy-900">{t("filterTitle")}</h2>
              <button onClick={() => setOpen(false)} className="p-2 text-gray-500 hover:text-navy-900">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => updateParam("category", "")}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      !activeCategory ? "bg-navy-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t("filterAll")}
                  </button>
                </li>
              </ul>

              {personalCats.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">{t("filterGroupPersonal")}</p>
                  <ul className="space-y-1">
                    {personalCats.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => updateParam("category", String(cat.id))}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                            activeCategory === String(cat.id) ? "bg-navy-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {cat.name}
                          {cat.count > 0 && <span className="ml-1 text-xs opacity-70">({cat.count})</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {businessCats.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">{t("filterGroupBusiness")}</p>
                  <ul className="space-y-1">
                    {businessCats.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => updateParam("category", String(cat.id))}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                            activeCategory === String(cat.id) ? "bg-navy-900 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                          } ${cat.parent !== 0 ? "pl-6" : ""}`}
                        >
                          {cat.name}
                          {cat.count > 0 && <span className="ml-1 text-xs opacity-70">({cat.count})</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-gray-100 transition-colors"
              >
                {t("filterReset")}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-800 transition-colors"
              >
                {t("filterApply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
