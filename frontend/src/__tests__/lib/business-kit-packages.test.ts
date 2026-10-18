import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseBusinessKitData } from "@/lib/business-kits";
import { isValidHttpUrl, validateProductConfiguration } from "@/lib/product-configuration";

describe("isValidHttpUrl", () => {
  it("accepts complete http(s) links and rejects everything else", () => {
    expect(isValidHttpUrl("https://g.page/r/salon-mueller")).toBe(true);
    expect(isValidHttpUrl(" http://example.com/menu ")).toBe(true);
    for (const bad of ["g.page/r/x", "javascript:alert(1)", "ftp://example.com", "https://localhost", "", "https://"]) {
      expect(isValidHttpUrl(bad)).toBe(false);
    }
  });
});

describe("url personalisation fields", () => {
  const options = [
    { id: "qr1_url", label: "QR-Code 1: Ziel-Link", type: "url" as const, required: true, maxLength: 30 },
    { id: "menu_url", label: "Speisekarte", type: "url" as const, required: false },
  ];
  const state = (textInputs: Record<string, string>) => ({ selectedOptions: {}, textInputs, checkboxValues: {} });
  const run = (textInputs: Record<string, string>) =>
    validateProductConfiguration(options, state(textInputs), (label) => `required:${label}`, (label, max) => `max:${label}:${max}`, (label) => `url:${label}`);

  it("requires, length-checks and format-checks links", () => {
    expect(run({})).toEqual({ qr1_url: "required:QR-Code 1: Ziel-Link" });
    expect(run({ qr1_url: "nicht-ok" })).toEqual({ qr1_url: "url:QR-Code 1: Ziel-Link" });
    expect(run({ qr1_url: `https://example.com/${"a".repeat(40)}` })).toEqual({ qr1_url: "max:QR-Code 1: Ziel-Link:30" });
    expect(run({ qr1_url: "https://example.com/a" })).toEqual({});
  });

  it("does not demand an optional link", () => {
    expect(run({ qr1_url: "https://example.com", menu_url: "" })).toEqual({});
  });
});

describe("kit scope summary", () => {
  it("is read from the backend entry and capped", () => {
    expect(parseBusinessKitData([{ key: "_kubikart_kit", value: { scope_summary: " Mit Logo · ohne Montage " } }]).scopeSummary).toBe("Mit Logo · ohne Montage");
    expect(parseBusinessKitData([{ key: "_kubikart_kit", value: { scope_summary: "x".repeat(500) } }]).scopeSummary).toHaveLength(200);
    expect(parseBusinessKitData(undefined).scopeSummary).toBe("");
  });
});

describe("server cart link validation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("rejects a non-http link supplied for a url field", async () => {
    const product = {
      id: 7,
      name: "Kit",
      type: "simple",
      status: "publish",
      price: "149",
      purchasable: true,
      stock_status: "instock",
      weight: "0.5",
      dimensions: { length: "20", width: "15", height: "5" },
      categories: [{ id: 187, name: "Kits", slug: "business-kits-de" }],
      meta_data: [
        { key: "_kubikart_kit", value: { order_mode: "purchase", order_mode_explicit: true, items: [] } },
        { key: "_kubikart_custom_fields", value: { schema_version: 3, fields: [{ id: "qr1_url", label: "Link", type: "url", required: true }] } },
      ],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => product }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 7, quantity: 1, customizations: { qr1_url: "javascript:alert(1)" } }] })).rejects.toThrow(/Invalid link/);
    await expect(calculateServerCart({ items: [{ productId: 7, quantity: 1, customizations: { qr1_url: "https://g.page/r/x" } }] })).resolves.toMatchObject({
      lines: [{ orderMeta: [{ key: "Link", value: "https://g.page/r/x" }] }],
    });
  });

  it("rejects an invalid e-mail address in an email-type field and accepts a valid one", async () => {
    const product = {
      id: 8,
      name: "Visitenkarten",
      slug: "visitenkarten",
      status: "publish",
      price: "19",
      purchasable: true,
      stock_status: "instock",
      weight: "0.1",
      dimensions: { length: "10", width: "6", height: "1" },
      categories: [],
      meta_data: [{ key: "_kubikart_custom_fields", value: { schema_version: 3, fields: [{ id: "business_email", label: "E-Mail", type: "email", required: true }] } }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => product }));
    const { calculateServerCart } = await import("@/lib/server-cart");

    await expect(calculateServerCart({ items: [{ productId: 8, quantity: 1, customizations: { business_email: "kein-email" } }] })).rejects.toThrow(/Invalid e-mail address/);
    await expect(calculateServerCart({ items: [{ productId: 8, quantity: 1, customizations: { business_email: "info@salon.de" } }] })).resolves.toMatchObject({
      lines: [{ orderMeta: [{ key: "E-Mail", value: "info@salon.de" }] }],
    });
  });
});
