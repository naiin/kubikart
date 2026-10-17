import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WCProduct } from "@/lib/woocommerce";

const getProduct = vi.fn();

vi.mock("@/lib/woocommerce", async () => {
  const actual = await vi.importActual<typeof import("@/lib/woocommerce")>("@/lib/woocommerce");
  return { ...actual, getProduct };
});

function product(id: number, overrides: Partial<WCProduct> = {}): WCProduct {
  return {
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    permalink: "",
    type: "simple",
    status: "publish",
    description: "",
    short_description: "",
    price: "10",
    regular_price: "10",
    sale_price: "",
    on_sale: false,
    purchasable: true,
    stock_status: "instock",
    weight: "",
    dimensions: { length: "", width: "", height: "" },
    shipping_class: "",
    shipping_class_id: 0,
    categories: [],
    images: [],
    attributes: [],
    variations: [],
    meta_data: [],
    average_rating: "0",
    rating_count: 0,
    lang: "de",
    translations: {},
    ...overrides,
  };
}

beforeEach(() => {
  getProduct.mockReset();
});

describe("Business Industry WooCommerce relationship resolution", () => {
  it("renders exactly the saved bundle and product lists in their saved order", async () => {
    const records = new Map([
      [162, product(162, { categories: [{ id: 187, name: "Business-Pakete", slug: "business-kits-de" }] })],
      [160, product(160, { categories: [{ id: 187, name: "Business-Pakete", slug: "business-kits-de" }] })],
      [168, product(168, { categories: [{ id: 187, name: "Business-Pakete", slug: "business-kits-de" }] })],
      [506, product(506)],
      [508, product(508)],
      // A bundle that is not in the saved lists must never appear.
      [164, product(164, { categories: [{ id: 187, name: "Business-Pakete", slug: "business-kits-de" }] })],
    ]);
    getProduct.mockImplementation(async (id: number) => records.get(id));
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const result = await resolveIndustryProducts({ bundleIds: [168, 162, 160], relatedProductIds: [508, 506] }, "de");

    expect(result.bundles.map((item) => item.id)).toEqual([168, 162, 160]);
    expect(result.relatedProducts.map((item) => item.id)).toEqual([508, 506]);
    expect(getProduct).not.toHaveBeenCalledWith(164);
    expect(result.unavailable).toBe(false);
  });

  it("resolves a wrong-language relationship through its WooCommerce translation", async () => {
    getProduct.mockImplementation(async (id: number) => {
      if (id === 163) return product(163, { lang: "en", translations: { de: 164 } });
      if (id === 164) return product(164, { lang: "de" });
      return undefined;
    });
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const result = await resolveIndustryProducts({ bundleIds: [163], relatedProductIds: [] }, "de");
    expect(result.bundles.map((item) => item.id)).toEqual([164]);
  });

  it("omits stale, unpublished, and untranslatable wrong-language records", async () => {
    getProduct.mockImplementation(async (id: number) => {
      if (id === 1) throw new Error("stale");
      if (id === 2) return product(2, { status: "draft" });
      return product(3, { lang: "en", translations: {} });
    });
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const result = await resolveIndustryProducts({ bundleIds: [1], relatedProductIds: [2, 3] }, "de");
    expect(result.bundles).toEqual([]);
    expect(result.relatedProducts).toEqual([]);
  });

  it("keeps an emptied bundle list empty (no hidden defaults) and distinguishes total failure", async () => {
    getProduct.mockRejectedValue(new Error("backend unavailable"));
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const failed = await resolveIndustryProducts({ bundleIds: [], relatedProductIds: [1, 2] }, "de");
    const empty = await resolveIndustryProducts({ bundleIds: [], relatedProductIds: [] }, "de");
    expect(failed.unavailable).toBe(true);
    expect(empty).toEqual({ bundles: [], relatedProducts: [], unavailable: false });
    expect(getProduct).toHaveBeenCalledTimes(2);
  });
});
