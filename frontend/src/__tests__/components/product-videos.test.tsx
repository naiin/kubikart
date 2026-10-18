import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProductVideos } from "@/components/product/ProductVideos";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

describe("ProductVideos", () => {
  it("does not introduce an empty section on other products", () => {
    expect(renderToStaticMarkup(<ProductVideos videos={[]} />)).toBe("");
  });
  it("renders both videos with controls and no autoplay or eager download", () => {
    const videos = [1, 2].map((id) => ({ id, src: `https://shop.example/video-${id}.mp4`, title: `Product video ${id}` }));
    const html = renderToStaticMarkup(<ProductVideos videos={videos} poster="/product.webp" />);
    expect(html.match(/<video /g)).toHaveLength(2);
    expect(html.match(/preload="none"/g)).toHaveLength(2);
    expect(html.match(/controls=""/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Product video 2"');
    expect(html).not.toContain("autoPlay");
    expect(html).not.toContain("iframe");
  });
});
