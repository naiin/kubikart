import { describe, expect, it } from "vitest";
import {
  BUSINESS_KITS_CATEGORY_SLUGS,
  getBusinessKitCommercialState,
  isBusinessKitProduct,
  parseBusinessKitData,
  removeProseContentLists,
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

function kitMeta(value: Record<string, unknown>) {
  return [{ key: "_kubikart_kit", value }];
}

describe("Business Kit commercial state", () => {
  it("treats a kit without an explicit purchase decision as enquiry-only, even when WooCommerce has a price", () => {
    expect(getBusinessKitCommercialState({ price: "149", purchasable: true, stock_status: "instock", meta_data: [] })).toEqual({ kind: "enquiry", startingPrice: 149 });
    expect(
      getBusinessKitCommercialState({ price: "149", purchasable: true, stock_status: "instock", meta_data: kitMeta({ order_mode: "enquiry", order_mode_explicit: true }) }),
    ).toEqual({ kind: "enquiry", startingPrice: 149 });
  });

  it("is purchasable only when the owner chose purchase and WooCommerce has a real price and stock", () => {
    expect(
      getBusinessKitCommercialState({ price: "149", purchasable: true, stock_status: "instock", meta_data: kitMeta({ order_mode: "purchase" }) }),
    ).toEqual({ kind: "purchasable", price: 149 });
  });

  it("distinguishes a genuine sold-out kit from a quote-only kit", () => {
    expect(
      getBusinessKitCommercialState({ price: "149", purchasable: true, stock_status: "outofstock", meta_data: kitMeta({ order_mode: "purchase" }) }),
    ).toEqual({ kind: "outOfStock", price: 149 });
    expect(getBusinessKitCommercialState({ price: "", purchasable: false, stock_status: "outofstock", meta_data: [] })).toEqual({ kind: "enquiry" });
  });

  it("flags a purchase kit without a real price as unavailable instead of inventing a quote state", () => {
    expect(
      getBusinessKitCommercialState({ price: "", purchasable: false, stock_status: "instock", meta_data: kitMeta({ order_mode: "purchase" }) }),
    ).toEqual({ kind: "unavailable" });
  });
});

describe("parseBusinessKitData", () => {
  it("defaults to enquiry with no contents when the backend entry is missing or unreadable", () => {
    expect(parseBusinessKitData(undefined)).toMatchObject({ orderMode: "enquiry", needsContents: true, items: [] });
    expect(parseBusinessKitData([{ key: "_kubikart_kit", value: "{broken" }])).toMatchObject({ orderMode: "enquiry", items: [] });
  });

  it("keeps order, quantities and kit-specific text, and only links valid products", () => {
    const data = parseBusinessKitData(
      kitMeta({
        order_mode: "purchase",
        order_mode_explicit: true,
        items: [
          {
            id: "a",
            quantity: 2,
            title: "",
            description: "Acryl, 10 cm",
            image: null,
            link_state: "linked",
            product: { id: 71, variation_id: 0, name: "NFC Stand", slug: "nfc-stand", image: { src: "https://x.test/a.jpg", alt: "" } },
          },
          { id: "b", quantity: 1, title: "Gestaltung", description: "", image: null, link_state: "unavailable", product: null },
          { id: "c", quantity: 1, title: "", description: "", image: null, link_state: "linked", product: null },
        ],
      }),
    );

    expect(data.orderMode).toBe("purchase");
    expect(data.needsContents).toBe(false);
    expect(data.items.map((item) => [item.id, item.quantity, item.linkState, item.product?.slug ?? null])).toEqual([
      ["a", 2, "linked", "nfc-stand"],
      ["b", 1, "unavailable", null],
    ]);
    expect(data.items[0].description).toBe("Acryl, 10 cm");
  });

  it("reads optional upgrades with their operation and replaced product, and the owner's SEO text", () => {
    const data = parseBusinessKitData(
      kitMeta({
        seo: { title: "Barber & Hair Salon Bundle | KubiKart", description: "Opening hours, stand and menus." },
        items: [
          { id: "a", quantity: 1, title: "QR stand", kind: "included", link_state: "unlinked", product: null },
          { id: "b", quantity: 1, title: "Acrylic stand", kind: "optional", operation: "replace", replaces: { id: 507, name: "QR stand", slug: "qr" }, link_state: "unlinked", product: null },
          { id: "c", quantity: 1, title: "Frosted film", kind: "optional", operation: "bogus", replaces: { id: 5, name: "x", slug: "x" }, link_state: "unlinked", product: null },
          { id: "d", quantity: 1, title: "Legacy row", link_state: "unlinked", product: null },
        ],
      }),
    );

    expect(data.items.map((item) => [item.id, item.kind, item.operation, item.replaces?.id ?? null])).toEqual([
      ["a", "included", "", null],
      ["b", "optional", "replace", 507],
      ["c", "optional", "", 5],
      ["d", "included", "", null],
    ]);
    expect(data.seo).toEqual({ title: "Barber & Hair Salon Bundle | KubiKart", description: "Opening hours, stand and menus." });
    expect(parseBusinessKitData(undefined).seo).toEqual({ title: "", description: "" });
  });

  it("needs contents when only optional upgrades are saved", () => {
    const data = parseBusinessKitData(kitMeta({ items: [{ id: "b", quantity: 1, title: "Acrylic", kind: "optional", operation: "add", link_state: "unlinked", product: null }] }));
    expect(data.needsContents).toBe(true);
  });

  it("never invents a price for an enquiry bundle without a WooCommerce price", () => {
    expect(getBusinessKitCommercialState({ price: "", purchasable: false, meta_data: kitMeta({ order_mode: "enquiry" }) })).toEqual({ kind: "enquiry" });
    expect(getBusinessKitCommercialState({ price: "0", meta_data: kitMeta({ order_mode: "enquiry" }) })).toEqual({ kind: "enquiry" });
  });

  it("ignores WooCommerce placeholder images", () => {
    const data = parseBusinessKitData(
      kitMeta({
        items: [{ id: "a", quantity: 1, title: "Aufsteller", image: { src: "https://x.test/woocommerce-placeholder.png" }, link_state: "unlinked", product: null }],
      }),
    );
    expect(data.items[0].image).toBeNull();
  });
});

describe("removeProseContentLists", () => {
  it("drops a prose contents list and its introducing line but keeps other description text", () => {
    const html = "<strong>Nur auf Anfrage.</strong>\n\nAktuell vorgesehene Zusammenstellung:\n<ul><li>A</li><li>B</li></ul>\nWeitere Hinweise.";
    const cleaned = removeProseContentLists(html);
    expect(cleaned).toContain("Nur auf Anfrage.");
    expect(cleaned).toContain("Weitere Hinweise.");
    expect(cleaned).not.toContain("<li>");
    expect(cleaned).not.toContain("Zusammenstellung");
  });
});
