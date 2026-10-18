import { useTranslations } from "next-intl";
import { parseBusinessKitData, type BusinessKitContentItem, type BusinessKitIcon } from "@/lib/business-kits";
import type { WCProduct } from "@/lib/woocommerce";

const MAX_GLYPHS = 5;

/** Simple geometric symbols in a 64 × 64 box. They use the brand colours only. */
function Glyph({ icon }: { icon: BusinessKitIcon }) {
  const common = { className: "h-full w-full", viewBox: "0 0 64 64", fill: "none", "aria-hidden": true } as const;

  switch (icon) {
    case "stand":
      return (
        <svg {...common}>
          <path d="M8 56h48l-4 4H12z" className="fill-brand/20" />
          <rect x="14" y="6" width="36" height="48" rx="3" className="fill-surface-white stroke-brand" strokeWidth="2" />
          <rect x="20" y="14" width="9" height="9" className="fill-brand" />
          <rect x="35" y="14" width="9" height="9" className="fill-brand" />
          <rect x="20" y="29" width="9" height="9" className="fill-brand" />
          <path d="M36 33a5 5 0 0 1 7 0M33 29a9 9 0 0 1 13 0" className="stroke-accent" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M20 45h24" className="stroke-brand/40" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "table-stand":
      return (
        <svg {...common}>
          <path d="M10 56h44l-3 4H13z" className="fill-brand/20" />
          <rect x="16" y="14" width="32" height="42" rx="3" className="fill-surface-white stroke-brand" strokeWidth="2" />
          <rect x="22" y="22" width="8" height="8" className="fill-brand" />
          <rect x="34" y="22" width="8" height="8" className="fill-brand" />
          <rect x="22" y="34" width="8" height="8" className="fill-brand" />
          <rect x="35" y="35" width="5" height="5" className="fill-accent" />
        </svg>
      );
    case "sheet":
      return (
        <svg {...common}>
          <path d="M14 6h28l10 10v42H14z" className="fill-surface-white stroke-brand" strokeWidth="2" strokeLinejoin="round" />
          <path d="M42 6v10h10" className="stroke-brand" strokeWidth="2" strokeLinejoin="round" />
          <path d="M20 26h26M20 33h26M20 40h18M20 47h22" className="stroke-brand/50" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="20" y="16" width="14" height="4" className="fill-accent" />
        </svg>
      );
    case "decal-logo":
      return (
        <svg {...common}>
          <rect x="6" y="14" width="52" height="36" rx="3" className="fill-brand/5 stroke-brand/40" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="32" cy="32" r="12" className="fill-brand" />
          <path d="M22 36a10 10 0 0 1 20 0z" className="fill-accent" />
        </svg>
      );
    case "decal-hours":
      return (
        <svg {...common}>
          <rect x="10" y="6" width="44" height="52" rx="3" className="fill-brand/5 stroke-brand/40" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="32" cy="20" r="8" className="stroke-brand" strokeWidth="2.2" />
          <path d="M32 15v5l3 2" className="stroke-brand" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18 36h28M18 43h28M18 50h18" className="stroke-brand" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case "decal-text":
      return (
        <svg {...common}>
          <rect x="4" y="16" width="56" height="32" rx="3" className="fill-brand/5 stroke-brand/40" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M12 26h40M12 33h32M12 40h22" className="stroke-brand" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "mirror-decal":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="48" height="48" rx="8" className="fill-surface-white stroke-brand" strokeWidth="2" />
          <path d="M16 18l12-8M20 28l22-18" className="stroke-brand/30" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 38h32M16 45h20" className="stroke-brand" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "sign":
      return (
        <svg {...common}>
          <path d="M10 58h44" className="stroke-brand/40" strokeWidth="3" strokeLinecap="round" />
          <rect x="8" y="14" width="48" height="34" rx="3" className="fill-surface-white stroke-brand" strokeWidth="2" />
          <path d="M20 48v10M44 48v10" className="stroke-brand/40" strokeWidth="3" />
          <circle cx="24" cy="31" r="7" className="fill-brand" />
          <path d="M36 28h14M36 35h10" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "plaque":
      return (
        <svg {...common}>
          <rect x="4" y="20" width="56" height="24" rx="3" className="fill-surface-white stroke-brand" strokeWidth="2" />
          <path d="M12 29h28M12 36h18" className="stroke-brand" strokeWidth="3" strokeLinecap="round" />
          <circle cx="51" cy="32" r="3" className="fill-accent" />
        </svg>
      );
    case "guide":
      return (
        <svg {...common}>
          <rect x="8" y="12" width="34" height="42" rx="2" className="fill-brand/5 stroke-brand" strokeWidth="2" />
          <path d="M42 54l14-8V8L42 12" className="stroke-brand" strokeWidth="2" strokeLinejoin="round" />
          <path d="M14 22h22M14 29h22M14 36h14" className="stroke-brand/50" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "design":
      return (
        <svg {...common}>
          <rect x="8" y="10" width="40" height="44" rx="3" className="fill-surface-white stroke-brand" strokeWidth="2" />
          <path d="M16 22h24M16 29h24" className="stroke-brand/50" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M16 40l6 6 12-12" className="stroke-accent" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M46 44l12-20 4 3-12 20-6 3z" className="fill-brand" />
        </svg>
      );
  }
}

function glyphFor(item: BusinessKitContentItem): BusinessKitIcon {
  return item.icon || "design";
}

function GlyphRow({ item, size }: { item: BusinessKitContentItem; size: "sm" | "lg" }) {
  const count = Math.min(item.quantity, MAX_GLYPHS);
  const box = size === "lg" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12";
  const overlap = item.quantity > 1 ? (size === "lg" ? "-ml-6 first:ml-0" : "-ml-7 first:ml-0") : "";

  return (
    <div className="flex items-end" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={`${box} ${overlap} shrink-0`}>
          <Glyph icon={glyphFor(item)} />
        </span>
      ))}
    </div>
  );
}

/**
 * Clearly illustrative overview of what a Business Kit contains, drawn from the
 * kit's structured contents (symbols, quantities, titles). It is never a photo
 * of the delivered package.
 */
export function KitIllustration({
  items,
  variant = "gallery",
}: {
  items: BusinessKitContentItem[];
  variant?: "gallery" | "card";
}) {
  const t = useTranslations("businessKitProduct");
  const shown = items.filter((item) => item.kind !== "optional" && (item.title || item.product));
  if (shown.length === 0) return null;

  const summary = shown.map((item) => t("illustrationItem", { count: item.quantity, name: item.title || item.product?.name || "" })).join(", ");
  const compact = variant === "card";

  return (
    <div
      role="img"
      aria-label={`${t("illustrationCaption")}: ${summary}`}
      className={`flex h-full w-full flex-col justify-between bg-surface ${compact ? "gap-2 p-3" : "min-h-[22rem] gap-5 rounded-kubikart-lg border border-border p-5 sm:p-7"}`}
    >
      <ul
        aria-hidden="true"
        className={compact ? "flex flex-1 flex-wrap content-center items-end justify-center gap-x-4 gap-y-2" : "grid flex-1 grid-cols-2 content-center gap-x-4 gap-y-6 sm:grid-cols-3"}
      >
        {shown.map((item) => (
          <li key={item.id || item.title} className="flex min-w-0 flex-col items-center gap-2 text-center">
            <GlyphRow item={item} size={compact ? "sm" : "lg"} />
            {compact ? (
              <span className="text-[11px] leading-4 font-semibold text-brand">{t("contentsQuantity", { count: item.quantity })}</span>
            ) : (
              <span className="text-xs leading-4 font-semibold text-brand break-words">
                {t("illustrationItem", { count: item.quantity, name: item.title || item.product?.name || "" })}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p aria-hidden="true" className={`text-center font-semibold text-muted ${compact ? "text-[10px] leading-3" : "text-xs"}`}>
        {t("illustrationCaption")}
      </p>
    </div>
  );
}

/** Illustration for a WooCommerce kit product (reads the structured contents from its meta data). */
export function KitIllustrationForProduct({ product, variant = "card" }: { product: Pick<WCProduct, "meta_data">; variant?: "gallery" | "card" }) {
  const items = parseBusinessKitData(product.meta_data).items;
  return <KitIllustration items={items} variant={variant} />;
}
