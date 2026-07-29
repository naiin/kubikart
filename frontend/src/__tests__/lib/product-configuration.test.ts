import { describe, expect, it } from "vitest";
import {
  buildProductCustomization,
  countProductFieldCharacters,
  createProductSubmissionLock,
  getConfiguredUnitPrice,
  getMeaningfulFieldHelperText,
  getProductFieldPresentation,
  getSelectedExtrasTotal,
  isProductConfigurationPurchasable,
  limitProductFieldValue,
  shouldAppendOptionalMarker,
  validateProductConfiguration,
  type ProductConfigurationState,
} from "@/lib/product-configuration";
import {
  parseProductCustomFields,
  resolveProductPersonalizationOptions,
  type ProductPersonalizationOption,
} from "@/lib/product-page";

const fields: ProductPersonalizationOption[] = [
  {
    id: "engraving",
    label: "Engraving",
    type: "text",
    required: true,
    maxLength: 18,
  },
  {
    id: "font",
    label: "Font",
    type: "select",
    required: true,
    options: [
      { label: "Classic", value: "classic" },
      { label: "Modern", value: "modern" },
    ],
  },
  {
    id: "motif",
    label: "Motif",
    type: "select",
    required: false,
    options: [
      { label: "No motif", value: "none" },
      { label: "Heart", value: "heart" },
    ],
  },
  {
    id: "request",
    label: "Special request",
    type: "textarea",
    required: false,
    maxLength: 100,
  },
  {
    id: "_gift_wrap",
    label: "Gift wrapping",
    type: "checkbox",
    required: false,
    price: 2.5,
  },
];

function createState(overrides: Partial<ProductConfigurationState> = {}): ProductConfigurationState {
  return {
    selectedOptions: { font: "classic", motif: "none" },
    textInputs: {},
    checkboxValues: {},
    ...overrides,
  };
}

const requiredMessage = (label: string) => `${label} required`;
const maxLengthMessage = (label: string, maxLength: number) => `${label} max ${maxLength}`;

describe("product field character limits", () => {
  it("starts at zero and counts German and Unicode characters predictably", () => {
    expect(countProductFieldCharacters("")).toBe(0);
    expect(countProductFieldCharacters("Grüße")).toBe(5);
    expect(countProductFieldCharacters("⭐")).toBe(1);
  });

  it("limits input to the configured number of Unicode code points", () => {
    expect(limitProductFieldValue("1234567890123456789", 18)).toBe("123456789012345678");
    expect(limitProductFieldValue("ÄÖÜ⭐", 3)).toBe("ÄÖÜ");
  });
});

describe("product configuration validation", () => {
  it("blocks an empty required engraving while leaving optional fields optional", () => {
    const errors = validateProductConfiguration(fields, createState(), requiredMessage, maxLengthMessage);
    expect(errors).toEqual({ engraving: "Engraving required" });
  });

  it("accepts a valid engraving and required default selection", () => {
    const errors = validateProductConfiguration(
      fields,
      createState({ textInputs: { engraving: "Mama", request: "" } }),
      requiredMessage,
      maxLengthMessage,
    );
    expect(errors).toEqual({});
  });

  it("reports configured maximum-length violations independently of the input control", () => {
    const errors = validateProductConfiguration(
      fields,
      createState({ textInputs: { engraving: "1234567890123456789" } }),
      requiredMessage,
      maxLengthMessage,
    );
    expect(errors.engraving).toBe("Engraving max 18");
  });

  it("uses the same validity result for Add to Cart and PayPal eligibility", () => {
    expect(
      isProductConfigurationPurchasable({
        isOutOfStock: false,
        hasCompleteVariation: true,
        validationErrors: { engraving: "required" },
      }),
    ).toBe(false);
    expect(
      isProductConfigurationPurchasable({
        isOutOfStock: false,
        hasCompleteVariation: true,
        validationErrors: {},
      }),
    ).toBe(true);
    expect(
      isProductConfigurationPurchasable({
        isOutOfStock: true,
        hasCompleteVariation: true,
        validationErrors: {},
      }),
    ).toBe(false);
  });
});

describe("product submission locking", () => {
  it("blocks an immediate duplicate submission until the first one is released", () => {
    const lock = createProductSubmissionLock();

    expect(lock.acquire()).toBe(true);
    expect(lock.acquire()).toBe(false);
    lock.release();
    expect(lock.acquire()).toBe(true);
  });
});

describe("paid extras and cart/order metadata", () => {
  it("parses configured checkbox prices and localized select options from WooCommerce metadata", () => {
    const parsed = parseProductCustomFields([
      {
        key: "_kubikart_custom_fields",
        value: [
          {
            id: "font",
            label: "Schriftart",
            type: "select",
            required: true,
            options: [
              { value: "klassisch", label: "Klassisch" },
              { value: "modern", label: "Modern" },
            ],
          },
          {
            id: "_gift_wrap",
            label: "Geschenkverpackung",
            type: "checkbox",
            required: false,
            price: "2.50",
          },
        ],
      },
    ]);

    expect(parsed).toEqual([
      {
        id: "font",
        label: "Schriftart",
        type: "select",
        required: true,
        options: [
          { value: "klassisch", label: "Klassisch" },
          { value: "modern", label: "Modern" },
        ],
        defaultValue: undefined,
      },
      {
        id: "_gift_wrap",
        label: "Geschenkverpackung",
        type: "checkbox",
        required: false,
        price: 2.5,
      },
    ]);
  });

  it("adds the configured surcharge once per unit and removes it when deselected", () => {
    expect(getSelectedExtrasTotal(fields, {})).toBe(0);
    expect(getConfiguredUnitPrice(12.9, fields, { _gift_wrap: true })).toBe(15.4);
    expect(getConfiguredUnitPrice(12.9, fields, { _gift_wrap: false })).toBe(12.9);
    expect(getConfiguredUnitPrice(12.9, fields, { _gift_wrap: true }) * 3).toBeCloseTo(46.2);
  });

  it("serializes text, select, motif, optional requests and extras without dropping fields", () => {
    const result = buildProductCustomization(
      fields,
      createState({
        selectedOptions: { font: "modern", motif: "heart" },
        textInputs: { engraving: "Mama", request: "Blue ribbon" },
        checkboxValues: { _gift_wrap: true },
      }),
      "Yes",
    );

    expect(result.customizations).toEqual({
      engraving: "Mama",
      font: "modern",
      motif: "heart",
      request: "Blue ribbon",
      _gift_wrap: "true",
    });
    expect(result.customizationSummary).toEqual([
      "Engraving: Mama",
      "Font: Modern",
      "Motif: Heart",
      "Special request: Blue ribbon",
      "Gift wrapping: Yes",
    ]);
  });
});

describe("WordPress field schema and presentation", () => {
  it("parses the versioned REST field wrapper used by schema version 2", () => {
    const parsed = parseProductCustomFields([
      {
        key: "_kubikart_custom_fields",
        value: {
          schema_version: 2,
          requires_review: false,
          fields: [
            {
              id: "gift_wrapping",
              label: "Add gift wrapping",
              type: "checkbox",
              required: false,
              price: 2.5,
            },
          ],
        },
      },
    ]);

    expect(parsed).toEqual([
      {
        id: "gift_wrapping",
        label: "Add gift wrapping",
        type: "checkbox",
        required: false,
        price: 2.5,
      },
    ]);
  });

  it("keeps only properties that apply to each canonical control type", () => {
    const parsed = parseProductCustomFields([
      {
        key: "_kubikart_custom_fields",
        value: [
          {
            id: "engraving",
            label: "Gravurtext",
            type: "text",
            required: true,
            placeholder: "Zum Beispiel Mama",
            maxLength: "18",
            options: [{ value: "ignored", label: "Ignored" }],
            price: "9.99",
          },
          {
            id: "request",
            label: "Besondere Wünsche",
            type: "textarea",
            required: false,
            maxLength: "120",
          },
          {
            id: "font",
            label: "Schriftart",
            type: "select",
            required: true,
            maxLength: "20",
            defaultValue: "modern",
            options: [
              { value: "klassisch", label: "Klassisch" },
              { value: "modern", label: "Modern" },
              { value: "handschrift", label: "Handschrift" },
              { value: "serif", label: "Serif" },
            ],
          },
          {
            id: "_gift_wrap",
            label: "Geschenkverpackung",
            type: "checkbox",
            required: false,
            maxLength: "20",
            price: "2.50",
          },
        ],
      },
    ]);

    expect(parsed?.map((field) => field.type)).toEqual(["text", "textarea", "select", "checkbox"]);
    expect(parsed?.[0]).toMatchObject({ placeholder: "Zum Beispiel Mama", maxLength: 18 });
    expect(parsed?.[0]).not.toHaveProperty("options");
    expect(parsed?.[1]).toMatchObject({ maxLength: 120 });
    expect(parsed?.[2]).toMatchObject({ defaultValue: "modern" });
    expect(parsed?.[2]).not.toHaveProperty("maxLength");
    expect(parsed?.[3]).toMatchObject({ price: 2.5 });
    expect(parsed?.[3]).not.toHaveProperty("maxLength");
  });

  it("does not silently reinterpret an unknown WordPress type as text", () => {
    const parsed = parseProductCustomFields([
      {
        key: "_kubikart_custom_fields",
        value: [{ id: "upload", label: "Upload", type: "file", required: false }],
      },
    ]);

    expect(parsed).toEqual([]);
  });

  it("uses real metadata instead of migration presets once metadata exists", () => {
    const realFields: ProductPersonalizationOption[] = [
      { id: "font", label: "Schriftart", type: "select", required: true, options: [] },
    ];
    const presetFields: ProductPersonalizationOption[] = [
      { id: "font", label: "Preset font", type: "text", required: true },
      { id: "_gift_wrap", label: "Preset gift wrap", type: "checkbox", required: false, price: 2.5 },
    ];

    expect(resolveProductPersonalizationOptions([], realFields, presetFields)).toEqual(realFields);
    expect(resolveProductPersonalizationOptions([], null, presetFields)).toEqual(presetFields);
  });

  it("maps text, textarea, four-option select and checkbox to distinct presentations", () => {
    const [text, select, textarea, checkbox] = [fields[0], fields[1], fields[3], fields[4]].map((field) =>
      getProductFieldPresentation(field, "(optional)", "en", "EUR"),
    );

    expect(text).toMatchObject({ control: "text", showCounter: true });
    expect(textarea).toMatchObject({ control: "textarea", showCounter: true });
    expect(select).toMatchObject({ control: "select", showCounter: false });
    expect(checkbox).toMatchObject({
      control: "checkbox",
      showCounter: false,
      label: "Gift wrapping",
      extraPriceLabel: "(+€2.50)",
    });
  });

  it("shows optional and price information once in German and English", () => {
    const optionalField: ProductPersonalizationOption = {
      id: "request",
      label: "Besondere Wünsche",
      type: "textarea",
      required: false,
      helperText: "Optional. Bitte beschreibe nur produktbezogene Wünsche.",
    };
    const pricedLabelField: ProductPersonalizationOption = {
      id: "gift",
      label: "Gift wrapping (+€2.50)",
      type: "checkbox",
      required: false,
      helperText: "Optional. Price adjustment +€2.50.",
      price: 2.5,
    };

    expect(shouldAppendOptionalMarker(optionalField)).toBe(true);
    expect(getMeaningfulFieldHelperText(optionalField.helperText)).toBe(
      "Bitte beschreibe nur produktbezogene Wünsche.",
    );
    expect(getMeaningfulFieldHelperText("Optional")).toBeNull();
    expect(getMeaningfulFieldHelperText("Pflichtfeld")).toBeNull();
    expect(getMeaningfulFieldHelperText("Pflichtfeld. Maximal 20 Zeichen.")).toBeNull();
    expect(getMeaningfulFieldHelperText("Required Field; Maximum 20 Characters")).toBeNull();
    expect(getProductFieldPresentation(optionalField, "(optional)", "de", "EUR").label).toBe(
      "Besondere Wünsche (optional)",
    );
    expect(getProductFieldPresentation(fields[4], "(optional)", "de", "EUR").extraPriceLabel).toContain("2,50");
    expect(getProductFieldPresentation(pricedLabelField, "(optional)", "en", "EUR")).toMatchObject({
      label: "Gift wrapping (+€2.50)",
      helperText: null,
      extraPriceLabel: null,
    });
  });
});
