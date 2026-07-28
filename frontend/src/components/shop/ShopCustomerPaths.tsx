"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import type { WCCategory } from "@/lib/woocommerce";

const BUSINESS_PARENT_SLUGS = new Set(["business-produkte", "business-products"]);
const PERSONAL_CATEGORY_SLUGS = new Set(["personalisierte-geschenke", "personalized-gifts"]);

export function ShopCustomerPaths({ categories }: { categories: WCCategory[] }) {
  const t = useTranslations("shopPage");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessCategory = categories.find((category) => BUSINESS_PARENT_SLUGS.has(category.slug));
  const personalCategory = categories.find((category) => PERSONAL_CATEGORY_SLUGS.has(category.slug) && category.count > 0);

  const selectCategory = useCallback(
    (categoryId: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", String(categoryId));
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  if (!businessCategory && !personalCategory) {
    return null;
  }

  return (
    <section className="kk-section-compact bg-page" aria-labelledby="shop-customer-paths-title">
      <div className="kk-container-full">
        <h2 id="shop-customer-paths-title" className="kk-heading-3">{t("pathsTitle")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {businessCategory ? (
            <button
              type="button"
              onClick={() => selectCategory(businessCategory.id)}
              className="group flex min-h-28 items-center justify-between gap-5 rounded-kubikart-lg border border-border bg-surface-white p-5 text-left transition-colors hover:border-accent"
            >
              <span>
                <span className="font-heading text-xl font-bold text-brand">{t("pathBusinessTitle")}</span>
                <span className="mt-1 block text-sm leading-6 text-muted">{t("pathBusinessText")}</span>
              </span>
              <span className="text-xl text-accent transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </button>
          ) : null}

          {personalCategory ? (
            <button
              type="button"
              onClick={() => selectCategory(personalCategory.id)}
              className="group flex min-h-28 items-center justify-between gap-5 rounded-kubikart-lg border border-border bg-surface-white p-5 text-left transition-colors hover:border-accent"
            >
              <span>
                <span className="font-heading text-xl font-bold text-brand">{t("pathPersonalTitle")}</span>
                <span className="mt-1 block text-sm leading-6 text-muted">{t("pathPersonalText")}</span>
              </span>
              <span className="text-xl text-accent transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
