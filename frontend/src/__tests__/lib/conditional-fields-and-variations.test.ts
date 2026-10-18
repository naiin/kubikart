import { describe, expect, it } from "vitest";
import {
  buildProductCustomization,
  getSelectedExtrasTotal,
  getVariationOptionAvailability,
  getVisibleOptions,
  isFieldVisible,
  resolveVisibleItems,
  normalizeVariationSelections,
  validateProductConfiguration,
} from "@/lib/product-configuration";
import { formatRegularProductPrice, getCustomSizeKind, mapWooVariations, parseProductCustomFields, shouldRenderSelectAsButtons, type ProductPersonalizationOption } from "@/lib/product-page";

const options: ProductPersonalizationOption[] = [
  { id: "gestaltung", label: "Design method", type: "select", required: true, options: [{ label: "Upload", value: "upload" }, { label: "Text", value: "text" }] },
  { id: "datei", label: "File", type: "file", required: true, showWhen: { field: "gestaltung", equals: "upload" } },
  { id: "wunschtext", label: "Wording", type: "textarea", required: true, price: 2, showWhen: { field: "gestaltung", equals: "text" } },
];

const state = (method: string, extra: Partial<Parameters<typeof validateProductConfiguration>[1]> = {}) => ({
  selectedOptions: { gestaltung: method },
  textInputs: {},
  checkboxValues: {},
  ...extra,
});

describe("conditional product fields", () => {
  it("shows a field only while its controlling select has the expected value", () => {
    expect(isFieldVisible(undefined, {})).toBe(true);
    expect(isFieldVisible({ field: "gestaltung", equals: "text" }, { gestaltung: "text" })).toBe(true);
    expect(isFieldVisible({ field: "gestaltung", equals: "text" }, { gestaltung: "upload" })).toBe(false);
    expect(getVisibleOptions(options, { gestaltung: "upload" }).map((option) => option.id)).toEqual(["gestaltung", "datei"]);
  });

  it("validates only the visible fields", () => {
    const required = (label: string) => `${label} required`;
    expect(validateProductConfiguration(options, state("upload"), required, required)).toEqual({ datei: "File required" });
    expect(validateProductConfiguration(options, state("text"), required, required)).toEqual({ wunschtext: "Wording required" });
  });

  it("neither prices nor submits hidden fields", () => {
    const hiddenValue = state("upload", { textInputs: { wunschtext: "ignored", datei: "token" } });

    expect(getSelectedExtrasTotal(options, hiddenValue)).toBe(0);
    expect(buildProductCustomization(options, hiddenValue, "Yes").customizations).toEqual({ gestaltung: "upload", datei: "token" });
  });

  it("shows fields that depend on a ticked checkbox and charges the checkbox price", () => {
    const withCheckbox: ProductPersonalizationOption[] = [
      { id: "montage", label: "Installation", type: "checkbox", required: false, price: 100 },
      { id: "adresse", label: "Address", type: "text", required: true, showWhen: { field: "montage", equals: "true" } },
    ];
    const base = { selectedOptions: {}, textInputs: {} };
    const required = (label: string) => `${label} required`;

    expect(getVisibleOptions(withCheckbox, {}, {}).map((option) => option.id)).toEqual(["montage"]);
    expect(getVisibleOptions(withCheckbox, {}, { montage: true }).map((option) => option.id)).toEqual(["montage", "adresse"]);
    expect(validateProductConfiguration(withCheckbox, { ...base, checkboxValues: {} }, required, required)).toEqual({});
    expect(validateProductConfiguration(withCheckbox, { ...base, checkboxValues: { montage: true } }, required, required)).toEqual({ adresse: "Address required" });
    expect(getSelectedExtrasTotal(withCheckbox, { ...base, checkboxValues: { montage: true } })).toBe(100);
  });

  it("hides the children of a hidden field even when their own condition still holds", () => {
    const chain: ProductPersonalizationOption[] = [
      { id: "line1", label: "Line 1", type: "checkbox", required: false },
      { id: "line2", label: "Line 2", type: "checkbox", required: false, showWhen: { field: "line1", equals: "true" } },
      { id: "text2", label: "Text 2", type: "text", required: true, showWhen: { field: "line2", equals: "true" } },
    ];

    expect(getVisibleOptions(chain, {}, { line1: false, line2: true }).map((option) => option.id)).toEqual(["line1"]);
    expect(getVisibleOptions(chain, {}, { line1: true, line2: true }).map((option) => option.id)).toEqual(["line1", "line2", "text2"]);
    expect(resolveVisibleItems(chain, { line1: "true" }).map((option) => option.id)).toEqual(["line1", "line2"]);
  });

  it("parses showWhen from the saved field definition", () => {
    const parsed = parseProductCustomFields([
      { key: "_kubikart_custom_fields", value: { fields: [{ id: "a", label: "A", type: "text", showWhen: { field: "b", equals: "x" } }, { id: "c", label: "C", type: "text", showWhen: { field: "", equals: "" } }] } },
    ]);

    expect(parsed?.[0].showWhen).toEqual({ field: "b", equals: "x" });
    expect(parsed?.[1].showWhen).toBeUndefined();
  });
});

describe("cascading variation attributes", () => {
  const variations = [
    { attributes: { shape: "round", size: "25", qty: "108" } },
    { attributes: { shape: "round", size: "25", qty: "216" } },
    { attributes: { shape: "round", size: "30", qty: "70" } },
    { attributes: { shape: "oval", size: "50x30", qty: "42" } },
  ];
  const attributes = [
    { id: "shape", options: [{ value: "round" }, { value: "oval" }] },
    { id: "size", options: [{ value: "25" }, { value: "30" }, { value: "50x30" }] },
    { id: "qty", options: [{ value: "42" }, { value: "70" }, { value: "108" }, { value: "216" }] },
  ];

  it("offers only the values that exist with the choices above them", () => {
    const available = getVariationOptionAvailability(variations, ["shape", "size", "qty"], { shape: "round", size: "25", qty: "108" });

    expect([...available.size]).toEqual(["25", "30"]);
    expect([...available.qty]).toEqual(["108", "216"]);
  });

  it("moves later selections to the first valid value when an earlier one changes", () => {
    const next = normalizeVariationSelections(variations, attributes, { shape: "oval", size: "25", qty: "108" });

    expect(next).toEqual({ shape: "oval", size: "50x30", qty: "42" });
  });

  it("keeps a valid selection untouched and ignores products without variations", () => {
    const selection = { shape: "round", size: "30", qty: "70" };

    expect(normalizeVariationSelections(variations, attributes, selection)).toBe(selection);
    expect(normalizeVariationSelections(undefined, attributes, selection)).toBe(selection);
  });
});

describe("regular price display", () => {
  it("returns the struck-through regular price only while a sale price applies", () => {
    expect(formatRegularProductPrice({ amount: 69.99, currency: "EUR", regularAmount: 79.99 })).toContain("79,99");
    expect(formatRegularProductPrice({ amount: 69.99, currency: "EUR", regularAmount: 79.99 }, 5)).toContain("84,99");
    expect(formatRegularProductPrice({ amount: 69.99, currency: "EUR" })).toBeNull();
  });
});

describe("select presentation", () => {
  const select = (labels: string[]): ProductPersonalizationOption => ({
    id: "x", label: "X", type: "select", required: true, options: labels.map((label, index) => ({ label, value: String(index) })),
  });

  it("uses buttons for a few short options and a dropdown otherwise", () => {
    expect(shouldRenderSelectAsButtons(select(["20 cm", "30 cm", "40 cm"]))).toBe(true);
    expect(shouldRenderSelectAsButtons(select(["1", "2", "3", "4", "5"]))).toBe(false);
    expect(shouldRenderSelectAsButtons(select(["Innen angebracht, von außen lesbar", "Innen angebracht, von innen lesbar", "Außen angebracht, von außen lesbar"]))).toBe(false);
  });

  it("keeps two options as buttons even when their labels are long", () => {
    expect(shouldRenderSelectAsButtons(select(["Innen angebracht, von außen lesbar", "Außen angebracht, von innen lesbar"]))).toBe(true);
  });
});

describe("custom size wording", () => {
  it("asks for film width and height on strip products and for the overall width elsewhere", () => {
    expect(getCustomSizeKind(["pa_folienformat", "anzahl_glasflaechen"])).toBe("film");
    expect(getCustomSizeKind(["pa_druckformat", "pa_kartenanzahl"])).toBe("format");
    expect(getCustomSizeKind(["pa_gesamtbreite"])).toBe("overall");
    expect(getCustomSizeKind([])).toBe("overall");
  });
});

describe("request-only variations", () => {
  const variation = (id: number, price: string, kind?: string) => ({
    id,
    price,
    regular_price: price,
    sale_price: "",
    stock_status: "instock",
    attributes: [{ id: 1, name: "Format", slug: "pa_druckformat", option: "A4" }],
    ...(kind ? { meta_data: [{ key: "_kubikart_request_kind", value: kind }] } : {}),
  });

  it("marks variations without a price and reads their request kind (default: custom size)", () => {
    const [priced, size, quote] = mapWooVariations([variation(1, "7.90"), variation(2, ""), variation(3, "", "quote")], "in_stock")!;

    expect(priced.requestOnly).toBe(false);
    expect(size).toMatchObject({ requestOnly: true, requestKind: "size" });
    expect(quote).toMatchObject({ requestOnly: true, requestKind: "quote" });
  });
});

describe("email field validation", () => {
  const option: ProductPersonalizationOption = { id: "mail", label: "E-Mail", type: "email", required: true };
  const state = (value: string) => ({ selectedOptions: {}, textInputs: { mail: value }, checkboxValues: {} });
  const run = (value: string) =>
    validateProductConfiguration([option], state(value), (label) => `required:${label}`, () => "too long", () => "url", (label) => `email:${label}`);

  it("accepts a plausible address and rejects anything else", () => {
    expect(run("info@salon.de")).toEqual({});
    expect(run("  info@salon.de ")).toEqual({});
    expect(run("kein-email")).toEqual({ mail: "email:E-Mail" });
    expect(run("a@b")).toEqual({ mail: "email:E-Mail" });
    expect(run("")).toEqual({ mail: "required:E-Mail" });
  });
});
