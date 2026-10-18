import { describe, expect, it } from "vitest";
import { findShopCategory, getVisibleShopCategories } from "@/lib/shop-categories";
import type { WCCategory } from "@/lib/woocommerce";

function category(id: number, slug: string, parent = 0, count = 1, aliases: number[] = []): WCCategory {
  return { id, slug, name: slug, parent, count, description: "", image: null, kubikart_legacy_ids: aliases };
}
describe("consolidated shop categories", () => {
  const business = category(127, "business-products", 0, 8, [125]);
  const qr = category(153, "qr-nfc-stands", 127, 2, [103, 107, 111, 155]);
  const gifts = category(95, "personalized-gifts", 0, 10, [97]);
  const keychains = category(91, "keychains", 95, 3);
  it("resolves retained, merged and other-language category IDs", () => {
    expect(findShopCategory([qr, business], "153")).toBe(qr);
    expect(findShopCategory([qr, business], "103")).toBe(qr);
    expect(findShopCategory([qr, business], "155")).toBe(qr);
    expect(findShopCategory([qr, business], "125")).toBe(business);
  });
  it.each([null, undefined, "", "abc", "103,127", "99999"])("does not broaden unknown or invalid filters: %s", (id) => {
    expect(findShopCategory([qr, business], id)).toBeUndefined();
  });
  it("prefers a current category over a stale alias collision", () => {
    expect(findShopCategory([qr, category(103, "owner-category")], "103")?.id).toBe(103);
  });
  it("groups product types under their parents and hides empty/default categories", () => {
    expect(getVisibleShopCategories([keychains, qr, gifts, category(15, "uncategorized"), category(185, "business-kits", 127, 0), business])).toEqual([business, qr, gifts, keychains]);
  });
  it("retains populated orphan categories and handles cycles without hanging", () => {
    const orphan = category(1, "orphan", 999);
    expect(getVisibleShopCategories([orphan, category(2, "cycle-a", 3), category(3, "cycle-b", 2)])).toHaveLength(3);
  });
});
