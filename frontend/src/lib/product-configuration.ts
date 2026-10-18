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

/** True when a conditional field applies to the current selections (fields without a condition always apply). */
export function isFieldVisible(showWhen: ProductPersonalizationOption["showWhen"], values: Record<string, string | undefined>) {
  return !showWhen || values[showWhen.field] === showWhen.equals;
}

/**
 * Keeps the items whose condition holds. A condition refers to a select field (`equals` is the chosen value) or to a
 * checkbox (`equals: "true"` while ticked) and only counts while the field it refers to is itself visible, so a hidden
 * parent never keeps its children alive.
 */
export function resolveVisibleItems<T extends { id: string; showWhen?: { field: string; equals: string } }>(
  items: T[],
  values: Record<string, string | undefined>,
): T[] {
  const visible = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of items) {
      if (visible.has(item.id)) continue;
      const condition = item.showWhen;
      if (!condition || (visible.has(condition.field) && values[condition.field] === condition.equals)) {
        visible.add(item.id);
        changed = true;
      }
    }
  }
  return items.filter((item) => visible.has(item.id));
}

export function getVisibleOptions(
  options: ProductPersonalizationOption[],
  selectedOptions: Record<string, string>,
  checkboxValues: Record<string, boolean> = {},
) {
  const values: Record<string, string | undefined> = { ...selectedOptions };
  for (const [id, checked] of Object.entries(checkboxValues)) {
    if (checked) values[id] = "true";
  }
  return resolveVisibleItems(options, values);
}

type VariationAttributes = { attributes: Record<string, string> }[];

/**
 * Cascades variation attributes left to right: an attribute offers only the values that exist together with the
 * selections of the attributes before it (for example only the sizes that exist for the chosen shape).
 */
export function getVariationOptionAvailability(
  variations: VariationAttributes | undefined,
  attributeIds: string[],
  selectedOptions: Record<string, string>,
) {
  const available: Record<string, Set<string>> = {};
  if (!variations?.length) return available;

  attributeIds.forEach((id, index) => {
    const earlier = attributeIds.slice(0, index);
    available[id] = new Set(
      variations
        .filter((variation) => earlier.every((earlierId) => variation.attributes[earlierId] === selectedOptions[earlierId]))
        .map((variation) => variation.attributes[id])
        .filter((value): value is string => Boolean(value)),
    );
  });

  return available;
}

/** Replaces variation selections that no longer exist for the shape/size above them with the first valid value. */
export function normalizeVariationSelections(
  variations: VariationAttributes | undefined,
  attributes: { id: string; options?: { value: string }[] }[],
  selectedOptions: Record<string, string>,
) {
  if (!variations?.length) return selectedOptions;

  const next = { ...selectedOptions };
  const ids = attributes.map((attribute) => attribute.id);
  for (const attribute of attributes) {
    const available = getVariationOptionAvailability(variations, ids, next)[attribute.id];
    if (!available || available.has(next[attribute.id])) continue;
    const first = attribute.options?.find((option) => available.has(option.value))?.value ?? Array.from(available)[0];
    if (first) next[attribute.id] = first;
  }

  return changed(selectedOptions, next) ? next : selectedOptions;
}

function changed(left: Record<string, string>, right: Record<string, string>) {
  return Object.keys(right).some((key) => left[key] !== right[key]);
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
    showCounter: (option.type === "text" || option.type === "textarea" || option.type === "url" || option.type === "email") && Boolean(option.maxLength),
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

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

/** A plausible e-mail address (one @, no spaces, a dot in the domain); the same rule the contact form uses. */
export function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateProductConfiguration(
  options: ProductPersonalizationOption[],
  state: ProductConfigurationState,
  requiredMessage: (label: string) => string,
  maxLengthMessage: (label: string, maxLength: number) => string,
  invalidUrlMessage: (label: string) => string = requiredMessage,
  invalidEmailMessage: (label: string) => string = requiredMessage,
) {
  const errors: Record<string, string> = {};

  for (const option of getVisibleOptions(options, state.selectedOptions, state.checkboxValues)) {
    if (option.type === "text" || option.type === "textarea" || option.type === "url" || option.type === "email") {
      const value = state.textInputs[option.id] || "";

      if (option.required && !value.trim()) {
        errors[option.id] = requiredMessage(option.label);
      } else if (option.maxLength && countProductFieldCharacters(value) > option.maxLength) {
        errors[option.id] = maxLengthMessage(option.label, option.maxLength);
      } else if (option.type === "url" && value.trim() && !isValidHttpUrl(value)) {
        errors[option.id] = invalidUrlMessage(option.label);
      } else if (option.type === "email" && value.trim() && !isValidEmailAddress(value)) {
        errors[option.id] = invalidEmailMessage(option.label);
      }
    } else if (option.type === "file") {
      if (option.required && !state.textInputs[option.id]) {
        errors[option.id] = requiredMessage(option.label);
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
  return getVisibleOptions(options, state.selectedOptions, state.checkboxValues).reduce((total, option) => {
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
  fileNames: Record<string, string> = {},
) {
  const customizations: Record<string, string> = {};
  const customizationSummary: string[] = [];

  for (const option of getVisibleOptions(options, state.selectedOptions, state.checkboxValues)) {
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
      customizationSummary.push(`${option.label}: ${option.type === "file" ? fileNames[option.id] || value : value}`);
    }
  }

  return { customizations, customizationSummary };
}
