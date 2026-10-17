"use client";

import { useTranslations } from "next-intl";
import type { CartItem } from "@/lib/cart";

/** "4 Sets · 140 Sticker" for products sold in fixed sets (quantity counts sets). */
export function CartSetSummary({ item }: { item: Pick<CartItem, "quantity" | "unitsPerSet" | "unitLabel"> }) {
  const t = useTranslations("sets");
  if (!item.unitsPerSet) return null;

  return (
    <p className="mt-1 text-xs font-semibold text-navy-900">
      {t("cartSummary", { sets: item.quantity, total: item.quantity * item.unitsPerSet, unit: item.unitLabel || t("unitFallback") })}
    </p>
  );
}
