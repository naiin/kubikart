import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateServerCart } from "@/lib/server-cart";

const products = [
  { id: 1, name: "QA jar", shipping_class: "kubikart-parcel", type: "variable", variations: [11], price: "13.50", status: "publish", purchasable: true, stock_status: "instock", weight: "", dimensions: { length: "", width: "", height: "" }, attributes: [], meta_data: [], categories: [] },
  { id: 2, name: "QA board", shipping_class: "kubikart-small-packet", type: "simple", price: "8.50", status: "publish", purchasable: true, stock_status: "instock", weight: "0.5", dimensions: { length: "40", width: "30", height: "5" }, attributes: [], meta_data: [], categories: [] },
];
let variationClass = "";
beforeEach(() => {
  variationClass = "";
  vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => String(url).includes("/variations/")
    ? { id: 11, shipping_class: variationClass, price: "13.50", regular_price: "13.50", stock_status: "instock", attributes: [] }
    : products.find(p => new URL(url).pathname.endsWith('/' + p.id)) })));
});
afterEach(() => vi.unstubAllGlobals());

describe("server-authoritative shipping-class aggregation", () => {
  it("inherits the jar parent class for a variation with no explicit override", async () => {
    const cart = await calculateServerCart({ items: [{ productId: 1, variationId: 11, quantity: 1 }] });
    expect(cart.shippingCents).toBe(549);
    expect(cart.selectedRate.id).toBe("dhl_paket");
  });
  it("charges the small-packet price but preserves the large parcel carrier", async () => {
    const cart = await calculateServerCart({ items: [{ productId: 2, quantity: 1 }] });
    expect(cart.shippingCents).toBe(399);
    expect(cart.selectedRate.id).toBe("dhl_paket");
  });
  it("charges once at the jar rate for a mixed cart", async () => {
    const cart = await calculateServerCart({ items: [{ productId: 1, variationId: 11, quantity: 1 }, { productId: 2, quantity: 1 }] });
    expect(cart.shippingCents).toBe(549);
    expect(cart.totalCents).toBe(2749);
  });
  it("preserves free shipping and rejects a client-selected cheaper method for jars", async () => {
    expect((await calculateServerCart({ items: [{ productId: 1, variationId: 11, quantity: 4 }] })).shippingCents).toBe(0);
    await expect(calculateServerCart({ items: [{ productId: 1, variationId: 11, quantity: 1 }], shippingMethodId: "dhl_kleinpaket" })).rejects.toMatchObject({ status: 409 });
  });
});
