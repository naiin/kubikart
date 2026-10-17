import { describe, expect, it } from "vitest";
import { getPurchaseMode, getSetPriceCents, getSetSelection, isEnquiryOnly, parseSetConfig } from "@/lib/purchase-mode";

const meta = (key: string, value: unknown) => ({ key, value });

describe("getPurchaseMode", () => {
  it("reads the explicit product setting", () => {
    expect(getPurchaseMode({ meta_data: [meta("_kubikart_purchase", { mode: "enquiry", explicit: true })] })).toBe("enquiry");
    expect(getPurchaseMode({ meta_data: [meta("_kubikart_purchase", JSON.stringify({ mode: "purchase" }))] }, "enquiry")).toBe("purchase");
  });

  it("keeps existing catalogue products directly purchasable and unknown bundles enquiry-only", () => {
    expect(getPurchaseMode({ meta_data: [] })).toBe("purchase");
    expect(getPurchaseMode({ meta_data: [] }, "enquiry")).toBe("enquiry");
    expect(getPurchaseMode({ meta_data: [meta("_kubikart_kit", { items: [] })] })).toBe("enquiry");
    expect(isEnquiryOnly({ meta_data: [meta("_kubikart_purchase", { mode: "enquiry" })] })).toBe(true);
  });

  it("ignores an invalid mode value", () => {
    expect(getPurchaseMode({ meta_data: [meta("_kubikart_purchase", { mode: "bogus" })] })).toBe("purchase");
  });
});

describe("sticker set calculations", () => {
  const config = parseSetConfig([meta("_kubikart_set_config", { field_id: "diameter", unit_label: "Sticker", options: { "25": 54, "37": 35, "50": 20, "bad": 0 } })]);

  it("parses only valid options", () => {
    expect(config).toEqual({ fieldId: "diameter", unitLabel: "Sticker", options: { "25": 54, "37": 35, "50": 20 } });
    expect(parseSetConfig([])).toBeNull();
  });

  it("turns sets into the total number of stickers", () => {
    expect(getSetSelection(config!, "37", 4)).toEqual({ sets: 4, unitsPerSet: 35, totalUnits: 140 });
    expect(getSetSelection(config!, "25", 1)).toEqual({ sets: 1, unitsPerSet: 54, totalUnits: 54 });
    expect(getSetSelection(config!, "50", 10)?.totalUnits).toBe(200);
  });

  it("never offers arbitrary counts or invalid input", () => {
    expect(getSetSelection(config!, "40", 2)).toBeNull();
    expect(getSetSelection(config!, undefined, 2)).toBeNull();
    expect(getSetSelection(config!, "37", 0)).toBeNull();
    expect(getSetSelection(config!, "37", 1.5)).toBeNull();
  });

  it("prices sets at the WooCommerce price per set (€5, 4 sets → €20)", () => {
    expect(getSetPriceCents(5, 4)).toBe(2000);
    expect(getSetPriceCents(39.99, 3)).toBe(11997);
  });
});
