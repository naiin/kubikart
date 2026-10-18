import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProduct } from "@/lib/woocommerce";

const fetchMock = vi.fn();
const response = (data: unknown) => ({ ok: true, json: async () => data });
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe("public product lookup publication boundary", () => {
  it.each(["draft", "private", "pending", "future"])("rejects %s products accessed by numeric ID", async (status) => {
    fetchMock.mockResolvedValue(response({ id: 1, status }));
    await expect(getProduct(1, "de")).rejects.toThrow("Product not found");
  });
  it("filters slug lookups to published products and guards cached unexpected drafts", async () => {
    fetchMock.mockResolvedValue(response([{ id: 1, status: "draft" }]));
    await expect(getProduct("draft-gift", "en")).rejects.toThrow("Product not found");
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("status")).toBe("publish");
  });
  it("does not leak a draft translation of a published other-language product", async () => {
    fetchMock.mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: 1, status: "publish", translations: { en: 2 } }]))
      .mockResolvedValueOnce(response({ id: 2, status: "draft" }));
    await expect(getProduct("german-slug", "en")).rejects.toThrow("Product not found");
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("status")).toBe("publish");
  });
  it("preserves published numeric product reads", async () => {
    const product = { id: 1, status: "publish", sku: "EXISTING-SKU" };
    fetchMock.mockResolvedValue(response(product));
    await expect(getProduct(1, "de")).resolves.toEqual(product);
  });
  it("preserves published alternate-language slug resolution", async () => {
    const translated = { id: 2, status: "publish", slug: "english-slug" };
    fetchMock.mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: 1, status: "publish", translations: { en: 2 } }]))
      .mockResolvedValueOnce(response(translated));
    await expect(getProduct("german-slug", "en")).resolves.toEqual(translated);
  });
});
