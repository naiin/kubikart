import { getCategories, getProducts, type WCCategory, type WCProduct } from "@/lib/woocommerce";
import { getPurchaseMode } from "@/lib/purchase-mode";
import type { SiteLocale } from "@/lib/seo";

type ProductWithCategories = {
  categories: Array<{ id?: number; slug: string }>;
};

type ProductImageLike = {
  src: string;
};

/**
 * Canonical localized WooCommerce category slugs, verified against the live
 * Polylang catalogue. IDs are intentionally resolved at runtime.
 */
export const BUSINESS_KITS_CATEGORY_SLUGS: Record<SiteLocale, string> = {
  de: "business-kits-de",
  en: "business-kits",
};

export function resolveBusinessKitsCategory(categories: WCCategory[], locale: SiteLocale) {
  const canonicalSlug = BUSINESS_KITS_CATEGORY_SLUGS[locale];
  return categories.find((category) => category.slug === canonicalSlug);
}

/**
 * Selects the dedicated presentation from the real localized WooCommerce
 * category membership already present on the product response.
 */
export function isBusinessKitProduct(product: ProductWithCategories, locale: SiteLocale) {
  const canonicalSlug = BUSINESS_KITS_CATEGORY_SLUGS[locale];
  return product.categories.some((category) => category.slug === canonicalSlug);
}

export function isBusinessKitsCategorySlug(slug: string) {
  return Object.values(BUSINESS_KITS_CATEGORY_SLUGS).includes(slug);
}

export type BusinessKitOrderMode = "purchase" | "enquiry";

export const BUSINESS_KIT_ICONS = [
  "stand",
  "table-stand",
  "sheet",
  "decal-logo",
  "decal-hours",
  "decal-text",
  "mirror-decal",
  "sign",
  "plaque",
  "guide",
  "design",
] as const;

export type BusinessKitIcon = (typeof BUSINESS_KIT_ICONS)[number];

export const BUSINESS_KIT_OPERATIONS = ["add", "replace", "replace_format", "quote_dependent"] as const;
export type BusinessKitOperation = (typeof BUSINESS_KIT_OPERATIONS)[number];

export type BusinessKitContentItem = {
  id: string;
  icon: BusinessKitIcon | "";
  quantity: number;
  title: string;
  description: string;
  image: { src: string; alt: string } | null;
  linkState: "linked" | "unlinked" | "unavailable" | "language_mismatch";
  /** "included" is part of the base package; "optional" is an upgrade or addition agreed in the quote. */
  kind: "included" | "optional";
  /** How an optional item relates to the package: an extra, a replacement, another format, or priced after review. */
  operation: BusinessKitOperation | "";
  replaces: { id: number; name: string; slug: string } | null;
  product: { id: number; variationId: number; name: string; slug: string; image: { src: string; alt: string } | null } | null;
};

export type BusinessKitData = {
  orderMode: BusinessKitOrderMode;
  orderModeExplicit: boolean;
  needsContents: boolean;
  scopeSummary: string;
  items: BusinessKitContentItem[];
  /** Owner-supplied search title and description; empty when not set. */
  seo: { title: string; description: string };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function parseImage(value: unknown, fallbackAlt: string) {
  const image = asRecord(value);
  const src = typeof image?.src === "string" ? image.src : "";
  if (!src || isWooCommercePlaceholderImage({ src })) return null;
  return { src, alt: typeof image?.alt === "string" && image.alt ? image.alt : fallbackAlt };
}

/**
 * Reads the `_kubikart_kit` entry exposed by the WordPress Business Kit
 * contents plugin. A missing or unreadable entry is treated as enquiry-only
 * so a kit is never offered for purchase without an explicit owner decision.
 */
export function parseBusinessKitData(metaData: { key: string; value: unknown }[] | undefined): BusinessKitData {
  const entry = metaData?.find((item) => item.key === "_kubikart_kit");
  let value: unknown = entry?.value;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      value = null;
    }
  }
  const record = asRecord(value);
  const orderMode: BusinessKitOrderMode = record?.order_mode === "purchase" ? "purchase" : "enquiry";
  const rawItems = Array.isArray(record?.items) ? record.items : [];
  const seo = asRecord(record?.seo);

  const items = rawItems.flatMap((raw): BusinessKitContentItem[] => {
    const item = asRecord(raw);
    if (!item) return [];
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const productRecord = asRecord(item.product);
    const linkState = ["linked", "unlinked", "unavailable", "language_mismatch"].includes(String(item.link_state))
      ? (item.link_state as BusinessKitContentItem["linkState"])
      : "unlinked";
    const product =
      linkState === "linked" &&
      productRecord &&
      Number.isInteger(productRecord.id) &&
      typeof productRecord.slug === "string" &&
      productRecord.slug &&
      typeof productRecord.name === "string"
        ? {
            id: Number(productRecord.id),
            variationId: Number.isInteger(productRecord.variation_id) ? Number(productRecord.variation_id) : 0,
            name: productRecord.name,
            slug: productRecord.slug,
            image: parseImage(productRecord.image, productRecord.name),
          }
        : null;
    if (!title && !product) return [];
    const quantity = Number(item.quantity);
    const kind: BusinessKitContentItem["kind"] = item.kind === "optional" ? "optional" : "included";
    const operation = (BUSINESS_KIT_OPERATIONS as readonly string[]).includes(String(item.operation))
      ? (item.operation as BusinessKitOperation)
      : "";
    const replacesRecord = asRecord(item.replaces);
    const replaces =
      kind === "optional" && replacesRecord && Number.isInteger(replacesRecord.id) && typeof replacesRecord.name === "string"
        ? { id: Number(replacesRecord.id), name: replacesRecord.name, slug: typeof replacesRecord.slug === "string" ? replacesRecord.slug : "" }
        : null;

    return [
      {
        kind,
        operation: kind === "optional" ? operation : "",
        replaces,
        id: String(item.id || ""),
        icon: (BUSINESS_KIT_ICONS as readonly string[]).includes(String(item.icon)) ? (item.icon as BusinessKitIcon) : "",
        quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
        title,
        description: typeof item.description === "string" ? item.description.trim() : "",
        image: parseImage(item.image, title || product?.name || ""),
        linkState: product ? "linked" : linkState === "linked" ? "unlinked" : linkState,
        product,
      },
    ];
  });

  return {
    orderMode,
    orderModeExplicit: record?.order_mode_explicit === true,
    needsContents: items.filter((item) => item.kind === "included").length === 0,
    scopeSummary: typeof record?.scope_summary === "string" ? record.scope_summary.trim().slice(0, 200) : "",
    items,
    seo: {
      title: typeof seo?.title === "string" ? seo.title.trim().slice(0, 120) : "",
      description: typeof seo?.description === "string" ? seo.description.trim().slice(0, 320) : "",
    },
  };
}

export type BusinessKitCommercialState =
  | { kind: "purchasable"; price: number }
  | { kind: "enquiry"; startingPrice?: number }
  | { kind: "outOfStock"; price: number }
  | { kind: "unavailable" };

type KitProductLike = {
  meta_data?: { key: string; value: unknown }[];
  purchasable?: boolean;
  price?: string;
  stock_status?: string;
};

/**
 * Distinguishes the four customer-facing offer states of a kit from real
 * WooCommerce data and the owner's explicit purchase/enquiry decision.
 * Price, stock and purchasability always come from WooCommerce; an
 * enquiry-only product shows at most a "from" price and never an add-to-cart
 * control. Works for any product, not only bundles.
 */
export function getBusinessKitCommercialState(product: KitProductLike): BusinessKitCommercialState {
  const price = Number.parseFloat(product.price ?? "");

  // An enquiry-only product shows its WooCommerce price only as a "from" price.
  if (getPurchaseMode(product, "enquiry") === "enquiry") {
    return Number.isFinite(price) && price > 0 ? { kind: "enquiry", startingPrice: price } : { kind: "enquiry" };
  }

  if (product.purchasable === false || !Number.isFinite(price) || price <= 0) {
    return { kind: "unavailable" };
  }

  return product.stock_status === "outofstock" ? { kind: "outOfStock", price } : { kind: "purchasable", price };
}

export const getProductCommercialState = getBusinessKitCommercialState;

/**
 * Once a kit has structured contents, a prose contents list in the product
 * description would duplicate (and could contradict) it. Removes lists and the
 * line that introduces them; all other description text is kept untouched.
 */
export function removeProseContentLists(html: string) {
  return html
    .replace(/(^|\n)(?:<p[^>]*>)?[^<\n]*:[ \t]*(?:<\/p>)?\s*<(ul|ol)\b[^>]*>[\s\S]*?<\/\2>/gi, "$1")
    .replace(/<(ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<p[^>]*>\s*<\/p>/gi, "")
    .trim();
}

export function isWooCommercePlaceholderImage(image: ProductImageLike) {
  try {
    return /\/woocommerce-placeholder(?:\.[a-z0-9]+)?$/i.test(new URL(image.src).pathname);
  } catch {
    return /(?:^|\/)woocommerce-placeholder(?:\.[a-z0-9]+)?$/i.test(image.src);
  }
}

export async function getOtherBusinessKits(
  locale: SiteLocale,
  currentProductId: number,
  preferredProductIds: number[] = [],
  limit = 4,
) {
  const { products } = await getBusinessKits(locale);
  const preferredOrder = new Map(preferredProductIds.map((id, index) => [id, index]));

  return products
    .filter((product) => product.id !== currentProductId)
    .sort((left, right) => {
      const leftOrder = preferredOrder.get(left.id);
      const rightOrder = preferredOrder.get(right.id);
      if (leftOrder !== undefined || rightOrder !== undefined) {
        return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER);
      }
      return 0;
    })
    .slice(0, limit);
}

export async function getBusinessKits(locale: SiteLocale): Promise<{
  category: WCCategory;
  products: WCProduct[];
}> {
  const categories = await getCategories(locale);
  const category = resolveBusinessKitsCategory(categories, locale);

  if (!category) {
    throw new Error(`Canonical Business Kits category is unavailable for locale "${locale}".`);
  }

  const products = await getProducts(
    {
      category: category.id,
      status: "publish",
      per_page: 50,
      orderby: "menu_order",
      order: "asc",
    },
    locale,
  );

  return {
    category,
    products: products.filter(
      (product) =>
        product.status === "publish" &&
        product.categories.some((productCategory) => productCategory.id === category.id),
    ),
  };
}
