"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
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
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const chips: { label: string; key: string }[] = [];

  if (activeCategory) {
    const cat = categories.find((c) => String(c.id) === activeCategory);
    chips.push({ label: cat?.name || activeCategory, key: "category" });
  }

  if (activeSearch) {
    chips.push({ label: `"${activeSearch}"`, key: "q" });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeParam(chip.key)}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-accent-600 hover:text-white transition-colors"
        >
          {chip.label}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button onClick={() => router.push(pathname)} className="text-xs font-semibold text-gray-500 hover:text-accent-600 transition-colors px-2 py-1.5">
        {t("filterReset")}
      </button>
    </div>
  );
}
