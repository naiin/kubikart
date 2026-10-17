import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { index?: number }) =>
    key === "galleryViewImage" ? `View product image ${values?.index}` : key,
}));

describe("ProductGallery", () => {
  it("keeps a large square gallery compact and does not crop its images", async () => {
    const { ProductGallery } = await import("@/components/product/ProductGallery");
    const images = Array.from({ length: 9 }, (_, index) => ({
      src: `/product-${index + 1}.jpg`,
      alt: `Product view ${index + 1}`,
    }));

    const html = renderToStaticMarkup(
      <ProductGallery images={images} activeIndex={0} onSelect={() => undefined} />,
    );

    expect(html).toContain("aspect-square");
    expect(html).toContain("object-contain");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("1 / 9");
    expect(html.match(/aria-pressed=/g)).toHaveLength(9);
    expect(html).not.toContain("md:flex-col");
  });
});
