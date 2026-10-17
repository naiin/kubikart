"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BlockedCartLine } from "@/lib/use-cart-availability";

export function CartAvailabilityNotice({ blocked, onRemove }: { blocked: BlockedCartLine[]; onRemove?: (productId: number) => void }) {
  const t = useTranslations("cartNotice");
  if (blocked.length === 0) return null;

  return (
    <div role="alert" className="rounded-xl border border-accent-600/40 bg-accent-100 p-4 text-sm text-navy-900">
      <p className="font-semibold">{t("title")}</p>
      <p className="mt-1 leading-6">{t("text")}</p>
      <ul className="mt-3 space-y-2">
        {blocked.map((line) => (
          <li key={line.productId} className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium">{line.name}</span>
            <span className="flex flex-wrap gap-x-4 text-sm">
              {line.reason === "enquiry_only" ? (
                <Link href={`/kontakt?product=${encodeURIComponent(line.slug)}`} className="underline underline-offset-2 hover:text-accent-600">
                  {t("enquire")}
                </Link>
              ) : null}
              {onRemove ? (
                <button type="button" onClick={() => onRemove(line.productId)} className="underline underline-offset-2 hover:text-accent-600">
                  {t("remove")}
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
