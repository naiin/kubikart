import type { WCCategory } from "@/lib/woocommerce";

/** WooCommerce supplies aliases for merged categories and translated numeric filter IDs. */
export function findShopCategory(categories: WCCategory[], id: string | null | undefined) {
  if (!id || !/^\d+$/.test(id)) return undefined;
  const numericId = Number(id);
  return categories.find((category) => category.id === numericId)
    ?? categories.find((category) => category.kubikart_legacy_ids?.includes(numericId));
}

export function getVisibleShopCategories(categories: WCCategory[]) {
  const hidden = new Set(["uncategorized", "uncategorized-en"]);
  const rank = (category: WCCategory) => /^(business-products|business-produkte)$/.test(category.slug) ? 0
    : /^(personalized-gifts|personalisierte-geschenke)$/.test(category.slug) ? 1 : 2;
  const sorted = [...categories].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const result: WCCategory[] = [];
  const visited = new Set<number>();
  function visit(category: WCCategory) {
    if (visited.has(category.id)) return;
    visited.add(category.id);
    if (category.count > 0 && !hidden.has(category.slug)) result.push(category);
    sorted.filter((child) => child.parent === category.id).forEach(visit);
  }
  sorted.filter((category) => !category.parent).forEach(visit);
  sorted.forEach(visit); // Preserve orphaned categories from a partial API response.
  return result;
}
