import "server-only";

import type { ServerCartItemInput } from "@/lib/cart-contract";
import { calculateShippingRates, type ShippingPackage, type ShippingRate } from "@/lib/shipping";
import { wcApi, type WCProduct, type WCVariation } from "@/lib/woocommerce";

type CustomField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  maxLength?: number;
  priceCents: number;
  options: string[];
};

const NEUTRAL_SELECT_VALUES = new Set(["none", "no", "without", "kein", "keine", "kein-motiv", "no-motif"]);

export class ServerCartError extends Error {
  constructor(message: string, readonly status = 400) {
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
    if (!field.id || !["text", "textarea", "select", "checkbox"].includes(type)) return [];
    const options = Array.isArray(field.options)
      ? field.options.flatMap((option) => option && typeof option === "object" && "value" in option ? [String((option as { value: unknown }).value)] : [])
      : [];
    return [{
      id: String(field.id), label: String(field.label || field.id),
      type: type as CustomField["type"], required: field.required === true || field.required === "true",
      maxLength: Number(field.maxLength) > 0 ? Number(field.maxLength) : undefined,
      priceCents: moneyToCents(Number(field.price) || 0),
      options,
    }];
  });
}

function validateCustomizations(product: WCProduct, supplied: Record<string, string> = {}) {
  const fields = parseFields(product);
  const known = new Map(fields.map((field) => [field.id, field]));
  for (const key of Object.keys(supplied)) if (!known.has(key)) throw new ServerCartError(`Unknown product option: ${key}`);
  let extraCents = 0;
  const clean: Record<string, string> = {};
  for (const field of fields) {
    const value = String(supplied[field.id] ?? "").trim();
    const selected = field.type === "checkbox" ? value === "true" : value.length > 0;
    if (field.required && !selected) throw new ServerCartError(`Required product option is missing: ${field.label}`);
    if (!selected) continue;
    if (field.type === "checkbox" && value !== "true") throw new ServerCartError(`Invalid checkbox value: ${field.label}`);
    if (field.maxLength && value.length > field.maxLength) throw new ServerCartError(`Product option is too long: ${field.label}`);
    if (field.type === "select" && !field.options.includes(value)) throw new ServerCartError(`Invalid product option: ${field.label}`);
    clean[field.id] = value;
    if (field.type !== "select" || !NEUTRAL_SELECT_VALUES.has(value.toLowerCase())) extraCents += field.priceCents;
  }
  return { clean, extraCents };
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
    if (product.status !== "publish" || product.purchasable === false || product.stock_status === "outofstock") throw new ServerCartError(`${product.name} is not available`, 409);
    let variation: WCVariation | undefined;
    if (item.variationId) {
      if (!product.variations?.includes(item.variationId)) throw new ServerCartError("Variation does not belong to product");
      variation = await wcApi<WCVariation>(`products/${item.productId}/variations/${item.variationId}`, { revalidate: 0 });
      if (variation.purchasable === false || variation.stock_status === "outofstock") throw new ServerCartError(`${product.name} variation is not available`, 409);
    } else if (product.type === "variable") {
      throw new ServerCartError(`Select a variation for ${product.name}`);
    }
    const { clean, extraCents } = validateCustomizations(product, item.customizations);
    const unitPriceCents = moneyToCents(variation?.price ?? product.price) + extraCents;
    const dimensions = variation?.dimensions ?? product.dimensions;
    totalWeight += positiveDimension(variation?.weight || product.weight, 0.5) * item.quantity;
    maxLength = Math.max(maxLength, positiveDimension(dimensions?.length, 20));
    maxWidth = Math.max(maxWidth, positiveDimension(dimensions?.width, 15));
    totalHeight += positiveDimension(dimensions?.height, 5) * item.quantity;
    return { productId: product.id, ...(variation ? { variationId: variation.id } : {}), name: product.name, quantity: item.quantity, unitPriceCents, lineTotalCents: unitPriceCents * item.quantity, customizations: clean };
  }));
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const pkg = { weight: totalWeight, length: maxLength || 20, width: maxWidth || 15, height: totalHeight || 5 };
  const rates = calculateShippingRates(pkg, subtotalCents / 100, String(input.country || "DE").toUpperCase());
  const selectedRate = input.shippingMethodId ? rates.find((rate) => rate.id === input.shippingMethodId) : rates[0];
  if (!selectedRate) throw new ServerCartError("Selected shipping method is unavailable", 409);
  const shippingCents = moneyToCents(selectedRate.price);
  return { currency: "EUR", lines, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents, rates, selectedRate, package: pkg };
}

export function serverCartErrorResponse(error: unknown) {
  return error instanceof ServerCartError ? { message: error.message, status: error.status } : { message: "Unable to calculate cart", status: 500 };
}
