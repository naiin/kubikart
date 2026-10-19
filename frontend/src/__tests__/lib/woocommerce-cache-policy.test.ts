import { afterEach, describe, expect, it, vi } from "vitest";
import { wcApi } from "@/lib/woocommerce";

afterEach(() => vi.unstubAllGlobals());

describe("WooCommerce public/private cache boundary", () => {
  it.each(["orders", "orders/123", "customers/123", "coupons"])("never caches %s even if a caller requests revalidation", async (endpoint) => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetcher);
    await wcApi(endpoint, { revalidate: 300 });
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: "no-store", signal: expect.any(AbortSignal) });
    expect(fetcher.mock.calls[0][1]).not.toHaveProperty("next");
  });

  it("retains tagged public product caching and explicit fresh commerce reads", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetcher);
    await wcApi("products", { tags: ["wc-products"] });
    expect(fetcher.mock.calls[0][1]).toMatchObject({ next: { revalidate: 300, tags: ["wc-products"] } });
    await wcApi("products/1", { revalidate: 0 });
    expect(fetcher.mock.calls[1][1]).toMatchObject({ cache: "no-store" });
    await wcApi("products/1", { method: "PUT", body: { name: "updated" } });
    expect(fetcher.mock.calls[2][1]).toMatchObject({ method: "PUT", cache: "no-store" });
  });
});
