import type { ProductPersonalizationOption } from "@/lib/product-page";

export type ProductConfigurationState = {
  selectedOptions: Record<string, string>;
  textInputs: Record<string, string>;
  checkboxValues: Record<string, boolean>;
};

const NEUTRAL_SELECT_VALUES = new Set(["none", "no", "without", "kein", "keine", "kein-motiv", "no-motif"]);

export function isChargeableSelectValue(value: string | undefined) {
  return Boolean(value && !NEUTRAL_SELECT_VALUES.has(value.trim().toLowerCase()));
}

export function createProductSubmissionLock() {
  let locked = false;

  return {
    acquire() {
      if (locked) return false;
      locked = true;
      return true;
    },
    release() {
      locked = false;
    },
  };
}

const OPTIONAL_MARKER_PATTERN = /\(\s*optional\s*\)|(?:^|\s)optional(?:$|[.:,;])/i;
const PRICE_MARKER_PATTERN = /(?:€\s*\d|\d[\d.,]*\s*€|\+\s*\d)/;

export function shouldAppendOptionalMarker(option: ProductPersonalizationOption) {
  return option.type !== "checkbox" && !option.required && !OPTIONAL_MARKER_PATTERN.test(option.label);
}

export function getMeaningfulFieldHelperText(helperText?: string) {
  if (!helperText?.trim()) {
    return null;
  }

  const cleaned = helperText
    .trim()
    .replace(/\boptional\b/gi, "")
    .replace(/\bpflichtfeld\b/gi, "")
    .replace(/\brequired field\b/gi, "")
    .replace(/\brequired\b/gi, "")
    .replace(/\bmaximal\s+\d+\s+zeichen\b/gi, "")
    .replace(/\bmaximum\s+\d+\s+characters?\b/gi, "")
    .replace(/\bprice adjustment\b/gi, "")
    .replace(/\baufpreis\b/gi, "")
    .replace(/\(?\s*(?:\+\s*(?:€\s*)?\d+(?:[.,]\d{1,2})?\s*€?|€\s*\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s*€)\s*\)?/g, "")
    .replace(/^[\s,;:.\-–—]+|[\s,;:\-–—]+$/g, "")
    .trim();

  return cleaned || null;
}

export function fieldLabelContainsPrice(label: string) {
  return PRICE_MARKER_PATTERN.test(label);
}

export function getProductFieldPresentation(
  option: ProductPersonalizationOption,
  optionalMarker: string,
  locale: "de" | "en",
  currency: string,
) {
  const extraPrice = option.price || 0;
  const formattedExtraPrice =
    extraPrice > 0
      ? new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
          style: "currency",
          currency,
        }).format(extraPrice)
      : null;

  return {
    control: option.type,
    showCounter: (option.type === "text" || option.type === "textarea") && Boolean(option.maxLength),
    label: `${option.label}${shouldAppendOptionalMarker(option) ? ` ${optionalMarker}` : ""}`,
    helperText: getMeaningfulFieldHelperText(option.helperText),
    extraPriceLabel:
      formattedExtraPrice && !fieldLabelContainsPrice(option.label) ? `(+${formattedExtraPrice})` : null,
  };
}

export function countProductFieldCharacters(value: string) {
  return Array.from(value).length;
}

export function limitProductFieldValue(value: string, maxLength?: number) {
  if (!maxLength) {
    return value;
  }

  return Array.from(value).slice(0, maxLength).join("");
}

export function validateProductConfiguration(
  options: ProductPersonalizationOption[],
  state: ProductConfigurationState,
  requiredMessage: (label: string) => string,
  maxLengthMessage: (label: string, maxLength: number) => string,
) {
  const errors: Record<string, string> = {};

  for (const option of options) {
    if (option.type === "text" || option.type === "textarea") {
      const value = state.textInputs[option.id] || "";

      if (option.required && !value.trim()) {
        errors[option.id] = requiredMessage(option.label);
      } else if (option.maxLength && countProductFieldCharacters(value) > option.maxLength) {
        errors[option.id] = maxLengthMessage(option.label, option.maxLength);
      }
    } else if (option.type === "select") {
      if (option.required && !state.selectedOptions[option.id]) {
        errors[option.id] = requiredMessage(option.label);
      }
    } else if (option.type === "checkbox" && option.required && !state.checkboxValues[option.id]) {
      errors[option.id] = requiredMessage(option.label);
    }
  }

  return errors;
}

export function getSelectedExtrasTotal(options: ProductPersonalizationOption[], state: ProductConfigurationState) {
  return options.reduce((total, option) => {
    const selected = option.type === "checkbox"
      ? Boolean(state.checkboxValues[option.id])
      : option.type === "select"
        ? isChargeableSelectValue(state.selectedOptions[option.id])
        : Boolean(state.textInputs[option.id]?.trim());
    if (!selected) {
      return total;
    }

    return total + (option.price || 0);
  }, 0);
}

export function getConfiguredUnitPrice(
  basePrice: number,
  options: ProductPersonalizationOption[],
  state: ProductConfigurationState,
) {
  return basePrice + getSelectedExtrasTotal(options, state);
}

export function getCustomizationExtrasTotal(options: ProductPersonalizationOption[], customizations: Record<string, string>) {
  return options.reduce((total, option) => {
    const value = customizations[option.id]?.trim();
    const selected = option.type === "checkbox" ? value === "true" : option.type === "select" ? isChargeableSelectValue(value) : Boolean(value);
    return selected ? total + (option.price || 0) : total;
  }, 0);
}

export function isProductConfigurationPurchasable({
  isOutOfStock,
  hasCompleteVariation,
  validationErrors,
}: {
  isOutOfStock: boolean;
  hasCompleteVariation: boolean;
  validationErrors: Record<string, string>;
}) {
  return !isOutOfStock && hasCompleteVariation && Object.keys(validationErrors).length === 0;
}

export function buildProductCustomization(
  options: ProductPersonalizationOption[],
  state: ProductConfigurationState,
  selectedLabel: string,
) {
  const customizations: Record<string, string> = {};
  const customizationSummary: string[] = [];

  for (const option of options) {
    if (option.type === "select") {
      const value = state.selectedOptions[option.id];
      if (!value) {
        continue;
      }

      const label = option.options?.find((candidate) => candidate.value === value)?.label || value;
      customizations[option.id] = value;
      customizationSummary.push(`${option.label}: ${label}`);
    } else if (option.type === "checkbox") {
      if (!state.checkboxValues[option.id]) {
        continue;
      }

      customizations[option.id] = "true";
      customizationSummary.push(`${option.label}: ${selectedLabel}`);
    } else {
      const value = state.textInputs[option.id]?.trim();
      if (!value) {
        continue;
      }

      customizations[option.id] = value;
      customizationSummary.push(`${option.label}: ${value}`);
    }
  }

  return { customizations, customizationSummary };
}
