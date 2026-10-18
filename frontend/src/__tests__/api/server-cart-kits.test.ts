import { beforeEach, describe, expect, it, vi } from "vitest";

const TOKEN = "b".repeat(32);

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 164,
    name: "Barber & Salon Kit",
    type: "simple",
    status: "publish",
    price: "149",
    purchasable: true,
    stock_status: "instock",
    weight: "0.5",
    dimensions: { length: "20", width: "15", height: "5" },
    categories: [{ id: 187, name: "Business Kits", slug: "business-kits-de" }],
    meta_data: [],
    ...overrides,
  };
}

const kitMeta = (orderMode: string) => ({ key: "_kubikart_kit", value: { order_mode: orderMode, order_mode_explicit: true, items: [] } });
const fieldsMeta = (fields: unknown[]) => ({ key: "_kubikart_custom_fields", value: { schema_version: 3, fields } });

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("server cart for Business Kits and uploads", () => {
  it("refuses to price an enquiry-only kit even though WooCommerce has a price", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => product({ meta_data: [] }) }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 164, quantity: 1 }] })).rejects.toMatchObject({ status: 409 });
  });

  it("refuses a Business Bundle that is enquiry-only and has no price, so it cannot be ordered through the cart API", async () => {
    const bundle = product({ id: 1487, price: "", purchasable: false, meta_data: [{ key: "_kubikart_purchase_mode", value: "enquiry" }, kitMeta("enquiry")] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => bundle }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 1487, quantity: 1 }] })).rejects.toMatchObject({ status: 409, code: "enquiry_only" });
  });

  it("prices a kit that the owner explicitly set to direct purchase", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => product({ meta_data: [kitMeta("purchase")] }) }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    const cart = await calculateServerCart({ items: [{ productId: 164, quantity: 1 }] });

    expect(cart.lines[0].unitPriceCents).toBe(14900);
  });

  it("does not affect ordinary products", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => product({ categories: [{ id: 1, name: "Wood", slug: "wood-products" }] }) }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 164, quantity: 1 }] })).resolves.toMatchObject({ lines: [expect.any(Object)] });
  });

  it("verifies an uploaded file and writes readable order meta with the private file marker", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/kubikart/customer-files/")) {
        return { ok: true, json: async () => ({ token: TOKEN, filename: "logo.png", mime: "image/png", size: 99, status: "pending", order_id: 0 }) };
      }
      return {
        ok: true,
        json: async () =>
          product({
            meta_data: [
              kitMeta("purchase"),
              fieldsMeta([
                { id: "business_name", label: "Firmenname", type: "text", required: true },
                { id: "finish", label: "Farbe", type: "select", required: false, options: [{ label: "Schwarz", value: "black" }] },
                { id: "logo", label: "Logo", type: "file", required: true },
              ]),
            ],
          }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const { calculateServerCart } = await import("@/lib/server-cart");

    const cart = await calculateServerCart({
      items: [{ productId: 164, quantity: 1, customizations: { business_name: "Salon Müller", finish: "black", logo: TOKEN } }],
    });

    expect(cart.lines[0].orderMeta).toEqual([
      { key: "Firmenname", value: "Salon Müller" },
      { key: "Farbe", value: "Schwarz" },
      { key: "Logo", value: `logo.png [kubikart-file:${TOKEN}]` },
    ]);
  });

  it("rejects a required logo that is missing, malformed or unknown to the backend", async () => {
    const fieldProduct = product({ meta_data: [kitMeta("purchase"), fieldsMeta([{ id: "logo", label: "Logo", type: "file", required: true }])] });
    const { calculateServerCart } = await (async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => fieldProduct }));
      return import("@/lib/server-cart");
    })();

    await expect(calculateServerCart({ items: [{ productId: 164, quantity: 1 }] })).rejects.toThrow(/Required/);
    await expect(calculateServerCart({ items: [{ productId: 164, quantity: 1, customizations: { logo: "../../etc/passwd" } }] })).rejects.toThrow(/Invalid uploaded file/);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("/customer-files/")
          ? { ok: false, status: 404, json: async () => ({ code: "kubikart_file_not_found" }) }
          : { ok: true, json: async () => fieldProduct },
      ),
    );
    await expect(calculateServerCart({ items: [{ productId: 164, quantity: 1, customizations: { logo: TOKEN } }] })).rejects.toThrow(/not found/);
  });
});
