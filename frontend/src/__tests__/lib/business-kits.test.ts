import { describe, expect, it } from "vitest";
import {
  BUSINESS_KITS_CATEGORY_SLUGS,
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
});
