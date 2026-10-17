import { beforeEach, describe, expect, it, vi } from "vitest";

const fields = [
  { id: "montage", label: "Installation", type: "checkbox", required: false, price: 100 },
  { id: "adresse", label: "Address", type: "text", required: true, maxLength: 150, showWhen: { field: "montage", equals: "true" } },
  { id: "gestaltung", label: "Design method", type: "select", required: true, options: [{ label: "Upload", value: "upload" }, { label: "Text", value: "text" }] },
  { id: "wunschtext", label: "Your wording", type: "textarea", required: true, maxLength: 120, showWhen: { field: "gestaltung", equals: "text" } },
  { id: "schrift", label: "Font", type: "select", required: true, showWhen: { field: "gestaltung", equals: "text" }, options: [{ label: "Modern", value: "modern" }] },
];

const product = {
  id: 1029,
  name: "Custom stickers",
  type: "variable",
  status: "publish",
  price: "7.99",
  purchasable: true,
  stock_status: "instock",
  weight: "",
  dimensions: { length: "", width: "", height: "" },
  categories: [{ id: 207, name: "Stickers", slug: "stickers" }],
  variations: [1030, 1031],
  attributes: [
    { id: 3, name: "Shape", slug: "pa_form", variation: true, options: ["Round", "Square"] },
    { id: 4, name: "Size", slug: "pa_groesse", variation: true, options: ["Ø 25 mm"] },
  ],
  meta_data: [{ key: "_kubikart_custom_fields", value: { schema_version: 3, fields } }],
};

const variation = {
  id: 1030,
  price: "7.99",
  stock_status: "instock",
  attributes: [
    { id: 3, name: "Shape", slug: "pa_form", option: "Round" },
    { id: 4, name: "Size", slug: "pa_groesse", option: "Ø 25 mm" },
  ],
};

// "Request custom size": a size without a price that can only be enquired about.
const requestVariation = { id: 1031, price: "", regular_price: "", stock_status: "instock", attributes: [{ id: 4, name: "Size", slug: "pa_groesse", option: "Request custom size" }] };

function stubWooCommerce() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (String(url).includes("/variations/1031") ? requestVariation : String(url).includes("/variations/") ? variation : product),
    })),
  );
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  stubWooCommerce();
});

async function cart(customizations: Record<string, string>) {
  const { calculateServerCart } = await import("@/lib/server-cart");
  return calculateServerCart({ items: [{ productId: 1029, variationId: 1030, quantity: 1, customizations }] });
}

describe("server cart: request-only size", () => {
  it("refuses a size without a price instead of ordering it for nothing", async () => {
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(
      calculateServerCart({ items: [{ productId: 1029, variationId: 1031, quantity: 1, customizations: { gestaltung: "upload" } }] }),
    ).rejects.toMatchObject({ status: 409, code: "enquiry_only" });
  });
});

describe("server cart: variation attributes and conditional fields", () => {
  it("accepts variation attribute selections and records them in the order meta", async () => {
    const result = await cart({ pa_form: "round", pa_groesse: "ø-25-mm", gestaltung: "text", wunschtext: "Thanks", schrift: "modern" });

    expect(result.lines[0].orderMeta).toEqual(
      expect.arrayContaining([
        { key: "Shape", value: "Round" },
        { key: "Size", value: "Ø 25 mm" },
        { key: "Your wording", value: "Thanks" },
      ]),
    );
  });

  it("rejects a selection that does not match the chosen variation", async () => {
    await expect(cart({ pa_form: "square", gestaltung: "text", wunschtext: "x", schrift: "modern" })).rejects.toThrow("does not match the variation");
  });

  it("still rejects unknown options", async () => {
    await expect(cart({ gestaltung: "upload", surprise: "1" })).rejects.toThrow("Unknown product option");
  });

  it("requires the fields of the selected design method only", async () => {
    await expect(cart({ gestaltung: "text", schrift: "modern" })).rejects.toThrow("Your wording");
    await expect(cart({ gestaltung: "upload" })).resolves.toMatchObject({ lines: [{ customizations: { gestaltung: "upload" } }] });
  });

  it("requires and prices the fields behind a ticked checkbox only when it is ticked", async () => {
    await expect(cart({ gestaltung: "upload", montage: "true" })).rejects.toThrow("Address");

    const withInstallation = await cart({ gestaltung: "upload", montage: "true", adresse: "Hauptstr. 1, 89134 Blaustein" });
    const without = await cart({ gestaltung: "upload", adresse: "ignored" });

    expect(withInstallation.lines[0].unitPriceCents - without.lines[0].unitPriceCents).toBe(10000);
    expect(without.lines[0].customizations).toEqual({ gestaltung: "upload" });
  });

  it("drops values of fields that do not apply to the selected method", async () => {
    const result = await cart({ gestaltung: "upload", wunschtext: "ignored", schrift: "modern" });

    expect(result.lines[0].customizations).toEqual({ gestaltung: "upload" });
  });
});
