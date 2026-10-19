import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
// Next 16.2 still exports this helper under its pre-Proxy name.
import { unstable_doesMiddlewareMatch as doesProxyMatch } from "next/experimental/testing/server";

const { resolvePublicRoute, intl } = vi.hoisted(() => ({ resolvePublicRoute: vi.fn(), intl: vi.fn() }));
vi.mock("@/lib/public-route", () => ({ resolvePublicRoute }));
vi.mock("next-intl/middleware", () => ({ default: () => intl }));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kubikart.de");
  vi.stubEnv("VERCEL_ENV", "production");
  resolvePublicRoute.mockReset().mockResolvedValue(null);
  intl.mockReset().mockImplementation(() => NextResponse.next());
});
afterEach(() => vi.unstubAllEnvs());

describe("SEO proxy boundary", () => {
  it("matches dotted dynamic slugs but never re-routes the internal 404 through i18n", async () => {
    const { config } = await import("@/proxy");
    expect(doesProxyMatch({ config, nextConfig: {}, url: "/en/shop/missing.product" })).toBe(true);
    expect(doesProxyMatch({ config, nextConfig: {}, url: "/_not-found" })).toBe(false);
    expect(doesProxyMatch({ config, nextConfig: {}, url: "/images/home/test.webp" })).toBe(false);
  });
  it("returns a permanent localized redirect without streaming a misleading 200", async () => {
    resolvePublicRoute.mockResolvedValue({ kind: "found", pathname: "/en/shop/card" });
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://kubikart.de/en/shop/karte?variation=123"));
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://kubikart.de/en/shop/card?variation=123");
    expect(intl).not.toHaveBeenCalled();
  });
  it("separates missing pages from upstream outages", async () => {
    const { default: proxy } = await import("@/proxy");
    resolvePublicRoute.mockResolvedValue({ kind: "missing" });
    const missing = await proxy(new NextRequest("https://kubikart.de/en/shop/no.product"));
    expect(missing.status).toBe(404);
    expect(missing.headers.get("cache-control")).toBe("no-store");
    expect(await missing.text()).toContain("Back to the shop");
    resolvePublicRoute.mockResolvedValue({ kind: "unavailable" });
    const response = await proxy(new NextRequest("https://kubikart.de/en/shop/card"));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("adds noindex to a production deployment alias, not the canonical host", async () => {
    const { default: proxy } = await import("@/proxy");
    expect((await proxy(new NextRequest("https://kubikart.vercel.app/en"))).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect((await proxy(new NextRequest("https://kubikart.de/en"))).headers.get("x-robots-tag")).toBeNull();
  });
});
