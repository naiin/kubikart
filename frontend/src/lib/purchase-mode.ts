export type PurchaseMode = "purchase" | "enquiry";

type MetaEntry = { key: string; value: unknown };
type ProductWithMeta = { meta_data?: MetaEntry[] };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readEntry(metaData: MetaEntry[] | undefined, key: string): Record<string, unknown> | null {
  let value: unknown = metaData?.find((item) => item.key === key)?.value;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

/**
 * The purchase mode is product data (`_kubikart_purchase`, written by the
 * WordPress purchase-mode plugin), never derived from names or categories.
 * Without it the legacy Business Bundle entry (`_kubikart_kit`) is honoured,
 * where a missing decision means enquiry. Otherwise `fallback` applies:
 * direct purchase for ordinary products (how the existing catalogue behaves),
 * enquiry when the caller already knows the product is a bundle.
 */
export function getPurchaseMode(product: ProductWithMeta, fallback: PurchaseMode = "purchase"): PurchaseMode {
  const purchase = readEntry(product.meta_data, "_kubikart_purchase");
  if (purchase?.mode === "enquiry" || purchase?.mode === "purchase") return purchase.mode;

  const legacyKit = readEntry(product.meta_data, "_kubikart_kit");
  if (legacyKit) return legacyKit.order_mode === "purchase" ? "purchase" : "enquiry";

  return fallback;
}

export function isEnquiryOnly(product: ProductWithMeta) {
  return getPurchaseMode(product) === "enquiry";
}

export type SetConfig = {
  fieldId: string;
  unitLabel: string;
  /** Option value → units (for example stickers) in one set. */
  options: Record<string, number>;
};

/** Products sold in fixed sets (the cart quantity counts sets, not units). */
export function parseSetConfig(metaData: MetaEntry[] | undefined): SetConfig | null {
  const entry = readEntry(metaData, "_kubikart_set_config");
  const options = asRecord(entry?.options);
  if (!entry || !options || typeof entry.field_id !== "string" || !entry.field_id) return null;

  const parsed: Record<string, number> = {};
  for (const [value, units] of Object.entries(options)) {
    const count = Number(units);
    if (Number.isInteger(count) && count >= 1) parsed[value] = count;
  }
  if (Object.keys(parsed).length === 0) return null;

  return { fieldId: entry.field_id, unitLabel: typeof entry.unit_label === "string" ? entry.unit_label : "", options: parsed };
}

export type SetSelection = { sets: number; unitsPerSet: number; totalUnits: number };

/** Units per set for a chosen option, or null when the option is not offered. */
export function getSetSelection(config: SetConfig, optionValue: string | undefined, sets: number): SetSelection | null {
  if (!optionValue || !Number.isInteger(sets) || sets < 1) return null;
  const unitsPerSet = config.options[optionValue];
  if (!unitsPerSet) return null;
  return { sets, unitsPerSet, totalUnits: unitsPerSet * sets };
}

/** Price in cents for a number of sets at a per-set WooCommerce price. */
export function getSetPriceCents(pricePerSet: number, sets: number) {
  return Math.round(pricePerSet * 100) * sets;
}
