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
  it("preserves owner ordering and resolves a real localized featured Kit", async () => {
    const records = new Map([
      [162, product(162, { categories: [{ id: 187, name: "Business Kits", slug: "business-kits-de" }] })],
      [164, product(164)],
      [168, product(168)],
    ]);
    getProduct.mockImplementation(async (id: number) => records.get(id));
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const result = await resolveIndustryProducts(
      { featuredKitId: 162, relatedProductIds: [168, 164] },
      "de",
    );

    expect(result.featuredKit?.id).toBe(162);
    expect(result.relatedProducts.map((item) => item.id)).toEqual([168, 164]);
    expect(result.unavailable).toBe(false);
  });

  it("resolves a wrong-language relationship through its WooCommerce translation", async () => {
    getProduct.mockImplementation(async (id: number) => {
      if (id === 163) return product(163, { lang: "en", translations: { de: 164 } });
      if (id === 164) return product(164, { lang: "de" });
      return undefined;
    });
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const result = await resolveIndustryProducts(
      { relatedProductIds: [163] },
      "de",
    );
    expect(result.relatedProducts.map((item) => item.id)).toEqual([164]);
  });

  it("omits stale, unpublished, and untranslatable wrong-language records", async () => {
    getProduct.mockImplementation(async (id: number) => {
      if (id === 1) throw new Error("stale");
      if (id === 2) return product(2, { status: "draft" });
      return product(3, { lang: "en", translations: {} });
    });
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const result = await resolveIndustryProducts(
      { featuredKitId: 1, relatedProductIds: [2, 3] },
      "de",
    );
    expect(result.featuredKit).toBeUndefined();
    expect(result.relatedProducts).toEqual([]);
  });

  it("distinguishes total WooCommerce failure from an Industry with no selections", async () => {
    getProduct.mockRejectedValue(new Error("backend unavailable"));
    const { resolveIndustryProducts } = await import("@/lib/business-industries");

    const failed = await resolveIndustryProducts({ relatedProductIds: [1, 2] }, "de");
    const empty = await resolveIndustryProducts({ relatedProductIds: [] }, "de");
    expect(failed.unavailable).toBe(true);
    expect(empty.unavailable).toBe(false);
  });
});

