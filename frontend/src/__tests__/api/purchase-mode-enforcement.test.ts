import { beforeEach, describe, expect, it, vi } from "vitest";

const purchaseMeta = (mode: string) => ({ key: "_kubikart_purchase", value: { mode, explicit: true } });
const setConfigMeta = { key: "_kubikart_set_config", value: { field_id: "diameter", unit_label: "Sticker", options: { "25": 54, "37": 35, "50": 20 } } };
const stickerFields = {
  key: "_kubikart_custom_fields",
  value: {
    schema_version: 3,
    fields: [
      { id: "diameter", label: "Durchmesser", type: "select", required: true, options: [{ value: "25", label: "25 mm" }, { value: "37", label: "37 mm" }, { value: "50", label: "50 mm" }] },
      { id: "instructions", label: "Hinweise", type: "textarea", required: false },
    ],
  },
};

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 506,
    name: "Produkt",
    type: "simple",
    status: "publish",
    price: "69.99",
    purchasable: true,
    stock_status: "instock",
    weight: "",
    dimensions: { length: "", width: "", height: "" },
    categories: [{ id: 1, name: "Acryl", slug: "acrylprodukte" }],
    meta_data: [],
    ...overrides,
  };
}

function mockProduct(value: Record<string, unknown>) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => value }));
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("purchase mode is enforced by the server cart", () => {
  it("refuses any enquiry-only product, whatever its category, price or purchasable flag", async () => {
    mockProduct(product({ meta_data: [purchaseMeta("enquiry")] }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 506, quantity: 1 }] })).rejects.toMatchObject({ status: 409, code: "enquiry_only" });
  });

  it("is not fooled by a product name or category that suggests a different mode", async () => {
    mockProduct(product({ name: "Business-Paket Deluxe", categories: [{ id: 187, name: "Business-Pakete", slug: "other" }], meta_data: [purchaseMeta("purchase")] }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 506, quantity: 1 }] })).resolves.toMatchObject({ lines: [expect.any(Object)] });
  });

  it("returns the enquiry-only code through the API error response", async () => {
    const { serverCartErrorResponse, ServerCartError } = await import("@/lib/server-cart");

    expect(serverCartErrorResponse(new ServerCartError("x", 409, "enquiry_only"))).toEqual({ message: "x", status: 409, code: "enquiry_only" });
  });
});

describe("products sold in sets", () => {
  const sticker = () => product({ id: 510, name: "Aufkleber-Set", price: "5", meta_data: [purchaseMeta("purchase"), setConfigMeta, stickerFields] });

  it("prices sets, not stickers, and records the totals for the owner", async () => {
    mockProduct(sticker());
    const { calculateServerCart } = await import("@/lib/server-cart");

    const cart = await calculateServerCart({ items: [{ productId: 510, quantity: 4, customizations: { diameter: "37" } }] });

    expect(cart.lines[0].unitPriceCents).toBe(500);
    expect(cart.lines[0].lineTotalCents).toBe(2000);
    expect(cart.lines[0].set).toEqual({ sets: 4, unitsPerSet: 35, totalUnits: 140, unitLabel: "Sticker" });
    expect(cart.lines[0].orderMeta).toEqual(
      expect.arrayContaining([
        { key: "Anzahl Sets", value: "4" },
        { key: "Sticker pro Set", value: "35" },
        { key: "Gesamtzahl Sticker", value: "140" },
      ]),
    );
  });

  it.each([
    ["25", 3, 162],
    ["37", 4, 140],
    ["50", 5, 100],
  ])("%s mm × %i sets gives %i stickers", async (diameter, sets, total) => {
    mockProduct(sticker());
    const { calculateServerCart } = await import("@/lib/server-cart");

    const cart = await calculateServerCart({ items: [{ productId: 510, quantity: sets, customizations: { diameter } }] });

    expect(cart.lines[0].set?.totalUnits).toBe(total);
    expect(cart.lines[0].lineTotalCents).toBe(500 * sets);
  });

  it("rejects a diameter that is not offered and a missing diameter", async () => {
    mockProduct(sticker());
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 510, quantity: 1, customizations: { diameter: "40" } }] })).rejects.toMatchObject({ status: 400 });
    await expect(calculateServerCart({ items: [{ productId: 510, quantity: 1 }] })).rejects.toMatchObject({ status: 400 });
  });

  it.each([0, -1, 1.5, 101])("rejects %s as a number of sets", async (sets) => {
    mockProduct(sticker());
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 510, quantity: sets, customizations: { diameter: "25" } }] })).rejects.toMatchObject({ status: 400 });
  });
});
