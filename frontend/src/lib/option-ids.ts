/** Normalises WooCommerce attribute names and option labels into the ids/values used by the storefront. */
export function toOptionId(rawValue: string | undefined) {
  return (rawValue || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Custom WooCommerce attributes have id 0. Their REST `slug` is not stable
 * across Polylang locales (for example Stückzahl can become either
 * `stuckzahl` or `stueckzahl`), while their `name` is stable within the parent
 * product and its variations. Global attributes keep using their real slug.
 */
export function toWooAttributeId(attribute: { id?: number; name: string; slug?: string }) {
  return toOptionId(attribute.id === 0 ? attribute.name : attribute.slug || attribute.name);
}

export function toOptionValue(rawValue: string | undefined) {
  return (rawValue || "").trim().toLowerCase().replace(/\s+/g, "-");
}
