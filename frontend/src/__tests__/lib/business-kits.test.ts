import { describe, expect, it } from "vitest";
import {
  BUSINESS_KITS_CATEGORY_SLUGS,
  isBusinessKitProduct,
  isWooCommercePlaceholderImage,
  resolveBusinessKitsCategory,
} from "@/lib/business-kits";
import type { WCCategory } from "@/lib/woocommerce";

function category(id: number, slug: string): WCCategory {
  return {
    id,
    slug,
    name: "Business Kits",
    parent: 0,
    description: "",
    count: 5,
    image: null,
  };
}

describe("Business Kits category resolution", () => {
  const categories = [
    category(185, "business-kits"),
    category(187, "business-kits-de"),
    category(99, "unrelated"),
  ];

  it("resolves the real German and English category records independently", () => {
    expect(resolveBusinessKitsCategory(categories, "de")?.id).toBe(187);
    expect(resolveBusinessKitsCategory(categories, "en")?.id).toBe(185);
  });

  it("uses documented stable slugs rather than translated visible names or numeric constants", () => {
    expect(BUSINESS_KITS_CATEGORY_SLUGS).toEqual({
      de: "business-kits-de",
      en: "business-kits",
    });
  });

  it("does not select a similarly named or unrelated category", () => {
    expect(resolveBusinessKitsCategory([category(200, "business-kits-archive")], "en")).toBeUndefined();
  });

  it("selects the dedicated template only from localized category membership", () => {
    expect(isBusinessKitProduct({ categories: [{ id: 187, slug: "business-kits-de" }] }, "de")).toBe(true);
    expect(isBusinessKitProduct({ categories: [{ id: 185, slug: "business-kits" }] }, "en")).toBe(true);
    expect(isBusinessKitProduct({ categories: [{ id: 185, slug: "business-kits" }] }, "de")).toBe(false);
    expect(isBusinessKitProduct({ categories: [{ id: 99, slug: "wood-products" }] }, "en")).toBe(false);
  });

  it("does not infer Kit membership from a product title or slug", () => {
    expect(isBusinessKitProduct({ categories: [{ id: 99, slug: "products" }] }, "en")).toBe(false);
  });

  it("recognizes WooCommerce's generated placeholder as missing media", () => {
    expect(
      isWooCommercePlaceholderImage({
        src: "https://example.test/wp-content/uploads/woocommerce-placeholder.webp",
      }),
    ).toBe(true);
    expect(
      isWooCommercePlaceholderImage({
        src: "https://example.test/wp-content/uploads/starter-visibility-kit.webp",
      }),
    ).toBe(false);
  });
});
