import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePublicRoute } from "@/lib/public-route";

afterEach(() => vi.unstubAllGlobals());
const response = (items: unknown, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => items });

describe("pre-stream public URL identity", () => {
  it("uses a bounded minimal published identity lookup", async () => {
    const fetcher = vi.fn().mockResolvedValue(response([{ id: 1, slug: "card", lang: "en", status: "publish" }]));
    vi.stubGlobal("fetch", fetcher);
    await expect(resolvePublicRoute("/en/shop/card")).resolves.toEqual({ kind: "found", pathname: "/en/shop/card" });
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.searchParams.get("_fields")).toBe("id,slug,status,lang,translations");
    expect(url.searchParams.get("lang")).toBe("en");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: "no-store", signal: expect.any(AbortSignal) });
  });

  it.each(["shop", "businesses"])("resolves translated %s slugs before rendering", async (family) => {
    const fetcher = vi.fn().mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: 1, status: "publish", lang: "de", slug: "karte", translations: { en: 2 } }]))
      .mockResolvedValueOnce(response({ id: 2, status: "publish", lang: "en", slug: "card" }));
    vi.stubGlobal("fetch", fetcher);
    await expect(resolvePublicRoute(`/en/${family}/karte`)).resolves.toEqual({ kind: "found", pathname: `/en/${family}/card` });
  });

  it("rejects unpublished translations and recognizes dotted missing slugs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([])));
    await expect(resolvePublicRoute("/en/shop/missing.product")).resolves.toEqual({ kind: "missing" });
    const fetcher = vi.fn().mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: 1, status: "publish", translations: { en: 2 } }]))
      .mockResolvedValueOnce(response({ id: 2, slug: "private", status: "private" }));
    vi.stubGlobal("fetch", fetcher);
    await expect(resolvePublicRoute("/en/shop/karte")).resolves.toEqual({ kind: "missing" });
  });

  it("distinguishes an upstream outage from a genuine 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([], false)));
    await expect(resolvePublicRoute("/de/shop/karte")).resolves.toEqual({ kind: "unavailable" });
    await expect(resolvePublicRoute("/de/cart")).resolves.toBeNull();
    await expect(resolvePublicRoute("/en/shop/a%2Fb")).resolves.toEqual({ kind: "missing" });
  });
});
