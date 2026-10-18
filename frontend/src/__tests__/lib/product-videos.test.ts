import { describe, expect, it } from "vitest";
import { parseProductVideos } from "@/lib/product-videos";

describe("product videos", () => {
  const valid = { id: 1, src: "https://shop.example/uploads/product.mp4", title: "Product demonstration" };
  it("preserves ordered attachments and removes duplicates", () => {
    expect(parseProductVideos([valid, { ...valid, id: 2 }, valid])).toEqual([valid, { ...valid, id: 2 }]);
  });
  it("rejects malformed data, embeds and unsafe URLs", () => {
    expect(parseProductVideos([null, {}, { ...valid, src: "javascript:alert(1).mp4" }, { ...valid, src: "https://example.com/embed" }, { ...valid, title: "" }])).toEqual([]);
    expect(parseProductVideos(undefined)).toEqual([]);
  });
});
