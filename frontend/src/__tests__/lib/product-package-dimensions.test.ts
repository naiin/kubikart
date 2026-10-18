import { beforeEach, describe, expect, it, vi } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import type { WCProduct } from "@/lib/woocommerce";

const mocks = vi.hoisted(() => ({ getProduct: vi.fn(), locale: "en" }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => {
    const messages = (mocks.locale === "de" ? de : en).productPage;
    return key === "estimatedPackageDimensions" || key === "estimatedShippingWeight" ? messages[key] : key;
  },
}));
vi.mock("@/lib/woocommerce", async (original) => ({
  ...await original<typeof import("@/lib/woocommerce")>(), getProduct: mocks.getProduct,
}));
import { getProductPageProduct } from "@/lib/product-page";

function fixture(estimated: boolean): WCProduct {
  return {
    id: 1, name: "Stand", slug: "stand", type: "simple", price: "39.99", regular_price: "39.99",
    sale_price: "", stock_status: "instock", description: "Stand", short_description: "Stand",
    permalink: "https://example.test/stand", status: "publish", on_sale: false,
    shipping_class: "", shipping_class_id: 0, average_rating: "0", rating_count: 0,
    categories: [], attributes: [], images: [], weight: "0.5", sku: "STAND",
    dimensions: { length: "30", width: "24", height: "6" },
    meta_data: estimated ? [{ id: 1, key: "_kubikart_shipping_dimensions_estimate", value: {
      basis: "owner-approved-estimate", scope: "maximum-standard-pack",
    } }] : [],
  };
}

beforeEach(() => { mocks.getProduct.mockReset(); });
describe("shipping packaging estimates in product details", () => {
  it.each(["de", "en"])("labels estimates without presenting them as manufactured size (%s)", async (locale) => {
    mocks.locale = locale;
    mocks.getProduct.mockResolvedValue(fixture(true));
    const product = await getProductPageProduct("stand", locale);
    expect(product?.dimensions).toBeUndefined();
    expect(product?.attributes).toContainEqual({
      name: (locale === "de" ? de : en).productPage.estimatedPackageDimensions,
      values: ["30 × 24 × 6 cm"],
    });
    expect(product?.weight).toBe(0.5);
    expect(product?.price.amount).toBe(39.99);
  });
  it("preserves ordinary product dimensions when there is no estimate marker", async () => {
    mocks.getProduct.mockResolvedValue(fixture(false));
    const product = await getProductPageProduct("stand", "en");
    expect(product?.dimensions).toEqual({ length: 30, width: 24, height: 6 });
    expect(product?.attributes).toEqual([]);
  });
  it.each(["de", "en"])("labels packed-weight estimates without claiming measured product weight (%s)", async (locale) => {
    mocks.locale = locale;
    const data = fixture(true);
    data.meta_data.push({ id: 2, key: "_kubikart_shipping_weight_estimate", value: { basis: "owner-approved-estimate" } });
    mocks.getProduct.mockResolvedValue(data);
    const product = await getProductPageProduct("stand", locale);
    expect(product?.weight).toBeUndefined();
    expect(product?.quickFacts).toEqual([]);
    expect(product?.attributes).toContainEqual({
      name: (locale === "de" ? de : en).productPage.estimatedShippingWeight,
      values: ["0.5 kg"],
    });
    expect(data.weight).toBe("0.5"); // WooCommerce keeps the value for shipping.
  });
});
