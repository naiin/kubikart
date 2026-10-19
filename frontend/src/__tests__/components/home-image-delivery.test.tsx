import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WCProduct } from "@/lib/woocommerce";

const { getProducts, getCategories } = vi.hoisted(() => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/woocommerce", () => ({ getProducts, getCategories }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("next/image", () => ({
  default: ({ src, sizes, unoptimized }: { src: string; sizes?: string; unoptimized?: boolean }) => (
    <span data-image={src} data-sizes={sizes} data-unoptimized={String(Boolean(unoptimized))} />
  ),
}));

function product(src: string): WCProduct {
  return {
    id: 1, name: "Test product", slug: "test-product", permalink: "", type: "simple", status: "publish",
    description: "", short_description: "", price: "149", regular_price: "149", sale_price: "", on_sale: false,
    stock_status: "instock", weight: "", dimensions: { length: "", width: "", height: "" },
    shipping_class: "", shipping_class_id: 0, categories: [], images: [{ id: 1, src, alt: "Test image" }],
    attributes: [], meta_data: [], average_rating: "0", rating_count: 0,
  };
}

describe("homepage WooCommerce image delivery", () => {
  it.each([
    ["https://kubikart-werbetechnik.de/wp-content/uploads/test.webp", false],
    ["https://kubikart-backend.lndo.site/wp-content/uploads/test.webp", true],
  ])("uses the shared optimization policy for %s", async (src, unoptimized) => {
    const item = product(src);
    getCategories.mockResolvedValue([{ id: 95, slug: "personalized-gifts", count: 1 }]);
    getProducts.mockResolvedValue([item]);
    const { HomePaths } = await import("@/components/home/HomePaths");
    const { BusinessKitCard } = await import("@/components/business-kits/BusinessKitCard");

    for (const component of [await HomePaths(), await BusinessKitCard({ product: item, locale: "en" })]) {
      const html = renderToStaticMarkup(component);
      expect(html).toContain(`data-unoptimized="${unoptimized}"`);
      expect(html).toContain("data-sizes=");
      expect(html).toContain('href="/shop/test-product"');
    }
  });
});
