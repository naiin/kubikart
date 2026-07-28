"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { WCCategory } from "@/lib/woocommerce";

export function ActiveFilterChips({ categories }: { categories: WCCategory[] }) {
  const t = useTranslations("shopPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const activeSearch = searchParams.get("q");

  const removeParam = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const chips: { label: string; key: string }[] = [];

  if (activeCategory) {
    const category = categories.find((candidate) => String(candidate.id) === activeCategory);
    chips.push({ label: category?.name || activeCategory, key: "category" });
  }

  if (activeSearch) {
    chips.push({ label: `“${activeSearch}”`, key: "q" });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4" aria-label={t("activeFiltersLabel")}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => removeParam(chip.key)}
          className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-surface-white px-3.5 py-2 text-sm font-semibold text-brand transition-colors hover:border-accent hover:text-accent"
          aria-label={t("removeFilter", { filter: chip.label })}
        >
          <span className="truncate">{chip.label}</span>
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" onClick={() => router.push(pathname)} className="kk-link inline-flex min-h-11 items-center px-2 text-sm font-semibold">
        {t("filterReset")}
      </button>
    </div>
  );
}
