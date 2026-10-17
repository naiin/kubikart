import "server-only";

import type { ServerCartItemInput } from "@/lib/cart-contract";
import { getBusinessKitCommercialState, isBusinessKitsCategorySlug } from "@/lib/business-kits";
import { getSetSelection, isEnquiryOnly, parseSetConfig, type SetSelection } from "@/lib/purchase-mode";
import {
  CUSTOMER_FILE_TOKEN_PATTERN,
  CustomerFileError,
  formatCustomerFileMetaValue,
  getCustomerFile,
} from "@/lib/customer-files";
import { isValidHttpUrl, resolveVisibleItems } from "@/lib/product-configuration";
import { toOptionValue, toWooAttributeId } from "@/lib/option-ids";
import { calculateShippingRates, type ShippingPackage, type ShippingRate } from "@/lib/shipping";
import { wcApi, type WCProduct, type WCVariation } from "@/lib/woocommerce";

type CustomField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "url" | "select" | "checkbox" | "file";
  required: boolean;
  showWhen?: { field: string; equals: string };
  maxLength?: number;
  priceCents: number;
  options: { value: string; label: string }[];
};

const NEUTRAL_SELECT_VALUES = new Set(["none", "no", "without", "kein", "keine", "kein-motiv", "no-motif"]);

export class ServerCartError extends Error {
  constructor(message: string, readonly status = 400, readonly code?: string) {
    super(message);
    this.name = "ServerCartError";
  }
}

export interface CalculatedCartLine {
  productId: number;
  variationId?: number;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  customizations: Record<string, string>;
  /** Readable line-item meta for the WooCommerce order (label → value). */
  orderMeta: { key: string; value: string }[];
  /** Present for products sold in fixed sets: quantity counts sets. */
  set?: SetSelection & { unitLabel: string };
}

export interface CalculatedCart {
  currency: "EUR";
  lines: CalculatedCartLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  rates: ShippingRate[];
  selectedRate: ShippingRate;
  package: ShippingPackage;
}

function moneyToCents(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new ServerCartError("Product has no valid WooCommerce price", 409);
  return Math.round(amount * 100);
}

function parseFields(product: WCProduct): CustomField[] {
  const entry = product.meta_data?.find((item) => item.key === "_kubikart_custom_fields");
  if (!entry) return [];
  let value = entry.value;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { throw new ServerCartError("Product configuration is invalid", 409); }
  }
  const fields = Array.isArray(value) ? value : value && typeof value === "object" && "fields" in value ? (value as { fields?: unknown }).fields : [];
  if (!Array.isArray(fields)) return [];
  return fields.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const field = candidate as Record<string, unknown>;
    const type = field.type === "color" ? "select" : String(field.type || "");
    if (!field.id || !["text", "textarea", "url", "select", "checkbox", "file"].includes(type)) return [];
    const options = Array.isArray(field.options)
      ? field.options.flatMap((option) => {
          if (!option || typeof option !== "object" || !("value" in option)) return [];
          const entry = option as { value: unknown; label?: unknown };
          return [{ value: String(entry.value), label: String(entry.label ?? entry.value) }];
        })
      : [];
    return [{
      id: String(field.id), label: String(field.label || field.id),
      type: type as CustomField["type"], required: field.required === true || field.required === "true",
      showWhen: parseShowWhen(field.showWhen),
      maxLength: Number(field.maxLength) > 0 ? Number(field.maxLength) : undefined,
      priceCents: moneyToCents(Number(field.price) || 0),
      options,
    }];
  });
}

function parseShowWhen(value: unknown): CustomField["showWhen"] {
  if (!value || typeof value !== "object") return undefined;
  const { field, equals } = value as { field?: unknown; equals?: unknown };
  return field && equals !== undefined && equals !== "" ? { field: String(field), equals: String(equals) } : undefined;
}

/** Variation attributes (shape, size, ...) are validated against the chosen variation, not against custom fields. */
function validateVariationAttributes(product: WCProduct, variation: WCVariation | undefined, supplied: Record<string, string>) {
  const orderMeta: { key: string; value: string }[] = [];
  const attributeIds = new Set<string>();
  for (const attribute of product.attributes ?? []) {
    if (!attribute.variation) continue;
    const id = toWooAttributeId(attribute);
    attributeIds.add(id);
    const chosen = variation?.attributes.find((candidate) => toWooAttributeId(candidate) === id)?.option;
    const suppliedValue = supplied[id];
    if (suppliedValue !== undefined && chosen && toOptionValue(chosen) !== suppliedValue) {
      throw new ServerCartError(`Selected option does not match the variation: ${attribute.name}`);
    }
    if (chosen) orderMeta.push({ key: attribute.name, value: chosen });
  }
  return { attributeIds, orderMeta };
}

function validateCustomizations(product: WCProduct, supplied: Record<string, string> = {}, variation?: WCVariation) {
  const allFields = parseFields(product);
  const variationAttributes = validateVariationAttributes(product, variation, supplied);
  const known = new Map(allFields.map((field) => [field.id, field]));
  for (const key of Object.keys(supplied)) if (!known.has(key) && !variationAttributes.attributeIds.has(key)) throw new ServerCartError(`Unknown product option: ${key}`);
  const fields = resolveVisibleItems(allFields, supplied);
  let extraCents = 0;
  const clean: Record<string, string> = {};
  const orderMeta: { key: string; value: string }[] = [...variationAttributes.orderMeta];
  const fileChecks: Promise<void>[] = [];
  for (const field of fields) {
    const value = String(supplied[field.id] ?? "").trim();
    const selected = field.type === "checkbox" ? value === "true" : value.length > 0;
    if (field.required && !selected) throw new ServerCartError(`Required product option is missing: ${field.label}`);
    if (!selected) continue;
    if (field.type === "checkbox" && value !== "true") throw new ServerCartError(`Invalid checkbox value: ${field.label}`);
    if (field.maxLength && value.length > field.maxLength) throw new ServerCartError(`Product option is too long: ${field.label}`);
    if (field.type === "select" && !field.options.some((option) => option.value === value)) throw new ServerCartError(`Invalid product option: ${field.label}`);
    if (field.type === "url" && !isValidHttpUrl(value)) throw new ServerCartError(`Invalid link: ${field.label}`);
    if (field.type === "file") {
      if (!CUSTOMER_FILE_TOKEN_PATTERN.test(value)) throw new ServerCartError(`Invalid uploaded file: ${field.label}`);
      fileChecks.push(
        getCustomerFile(value).then(
          (file) => {
            orderMeta.push({ key: field.label, value: formatCustomerFileMetaValue(file) });
          },
          (error) => {
            throw error instanceof CustomerFileError && error.code === "not_found"
              ? new ServerCartError(`Uploaded file was not found: ${field.label}`)
              : new ServerCartError("Uploaded files cannot be verified right now", 503);
          },
        ),
      );
    } else {
      const displayValue =
        field.type === "checkbox" ? "Ja" : field.type === "select" ? field.options.find((option) => option.value === value)?.label || value : value;
      orderMeta.push({ key: field.label, value: displayValue });
    }
    clean[field.id] = value;
    if (field.type !== "select" || !NEUTRAL_SELECT_VALUES.has(value.toLowerCase())) extraCents += field.priceCents;
  }
  return { clean, extraCents, orderMeta, fileChecks };
}

function positiveDimension(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function calculateServerCart(input: { items: ServerCartItemInput[]; country?: string; shippingMethodId?: string }): Promise<CalculatedCart> {
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 50) throw new ServerCartError("A cart must contain between 1 and 50 items");
  let totalWeight = 0, maxLength = 0, maxWidth = 0, totalHeight = 0;
  const lines = await Promise.all(input.items.map(async (item) => {
    if (!Number.isInteger(item.productId) || item.productId <= 0 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new ServerCartError("Invalid product or quantity");
    }
    const product = await wcApi<WCProduct>(`products/${item.productId}`, { revalidate: 0 });
    // Enquiry-only products can never be ordered, whatever else is true of them.
    if (isEnquiryOnly(product)) throw new ServerCartError(`${product.name} can only be requested, not ordered online`, 409, "enquiry_only");
    if (product.status !== "publish" || product.purchasable === false || product.stock_status === "outofstock") throw new ServerCartError(`${product.name} is not available`, 409);
    if (
      product.categories?.some((category) => isBusinessKitsCategorySlug(category.slug)) &&
      getBusinessKitCommercialState(product).kind !== "purchasable"
    ) {
      throw new ServerCartError(`${product.name} can only be requested, not ordered online`, 409, "enquiry_only");
    }
    let variation: WCVariation | undefined;
    if (item.variationId) {
      if (!product.variations?.includes(item.variationId)) throw new ServerCartError("Variation does not belong to product");
      variation = await wcApi<WCVariation>(`products/${item.productId}/variations/${item.variationId}`, { revalidate: 0 });
      if (variation.purchasable === false || variation.stock_status === "outofstock") throw new ServerCartError(`${product.name} variation is not available`, 409);
      // A size without a price ("Request custom size") can only be enquired about, never ordered.
      if (!variation.price && !variation.regular_price) throw new ServerCartError(`${product.name} variation can only be requested, not ordered online`, 409, "enquiry_only");
    } else if (product.type === "variable") {
      throw new ServerCartError(`Select a variation for ${product.name}`);
    }
    const { clean, extraCents, orderMeta, fileChecks } = validateCustomizations(product, item.customizations, variation);
    await Promise.all(fileChecks);
    const fieldOrder = parseFields(product).map((field) => field.label);
    orderMeta.sort((left, right) => fieldOrder.indexOf(left.key) - fieldOrder.indexOf(right.key));
    const setConfig = parseSetConfig(product.meta_data);
    let setSelection: SetSelection | null = null;
    if (setConfig) {
      setSelection = getSetSelection(setConfig, clean[setConfig.fieldId], item.quantity);
      if (!setSelection) throw new ServerCartError(`Select a valid option for ${product.name}`);
      const unit = setConfig.unitLabel || "Einheiten";
      orderMeta.push(
        { key: "Anzahl Sets", value: String(setSelection.sets) },
        { key: `${unit} pro Set`, value: String(setSelection.unitsPerSet) },
        { key: `Gesamtzahl ${unit}`, value: String(setSelection.totalUnits) },
      );
    }
    const unitPriceCents = moneyToCents(variation?.price ?? product.price) + extraCents;
    const dimensions = variation?.dimensions ?? product.dimensions;
    totalWeight += positiveDimension(variation?.weight || product.weight, 0.5) * item.quantity;
    maxLength = Math.max(maxLength, positiveDimension(dimensions?.length, 20));
    maxWidth = Math.max(maxWidth, positiveDimension(dimensions?.width, 15));
    totalHeight += positiveDimension(dimensions?.height, 5) * item.quantity;
    return { productId: product.id, ...(variation ? { variationId: variation.id } : {}), name: product.name, quantity: item.quantity, unitPriceCents, lineTotalCents: unitPriceCents * item.quantity, customizations: clean, orderMeta, ...(setSelection && setConfig ? { set: { ...setSelection, unitLabel: setConfig.unitLabel } } : {}) };
  }));
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const pkg = { weight: totalWeight, length: maxLength || 20, width: maxWidth || 15, height: totalHeight || 5 };
  const rates = calculateShippingRates(pkg, subtotalCents / 100, String(input.country || "DE").toUpperCase());
  const selectedRate = input.shippingMethodId ? rates.find((rate) => rate.id === input.shippingMethodId) : rates[0];
  if (!selectedRate) throw new ServerCartError("Selected shipping method is unavailable", 409);
  const shippingCents = moneyToCents(selectedRate.price);
  return { currency: "EUR", lines, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents, rates, selectedRate, package: pkg };
}

export function serverCartErrorResponse(error: unknown): { message: string; status: number; code?: string } {
  return error instanceof ServerCartError ? { message: error.message, status: error.status, ...(error.code ? { code: error.code } : {}) } : { message: "Unable to calculate cart", status: 500 };
}
