import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getProducts, getBusinessIndustries } = vi.hoisted(() => ({ getProducts: vi.fn(), getBusinessIndustries: vi.fn() }));
vi.mock("@/lib/woocommerce", () => ({ getProducts }));
vi.mock("@/lib/wordpress", () => ({ getBusinessIndustries }));

beforeEach(() => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kubikart.de");
  getProducts.mockReset().mockResolvedValue([]);
  getBusinessIndustries.mockReset().mockResolvedValue([]);
});
afterEach(() => vi.unstubAllEnvs());

describe("complete, source-dated sitemap regeneration", () => {
  it("does not publish a partial successful sitemap after a product API failure", async () => {
    getProducts.mockRejectedValue(new Error("backend unavailable"));
    const { default: sitemap } = await import("@/app/sitemap");
    await expect(sitemap()).rejects.toThrow("backend unavailable");
  });
  it("does not replace an industry inventory with an empty successful result after an outage", async () => {
    getBusinessIndustries.mockRejectedValue(new Error("industry API unavailable"));
    const { default: sitemap } = await import("@/app/sitemap");
    await expect(sitemap()).rejects.toThrow("industry API unavailable");
  });
  it("normalizes GMT dates and never invents a lastmod date for missing/invalid source data", async () => {
    const { sitemapDate } = await import("@/app/sitemap");
    expect(sitemapDate("2026-10-18T12:57:04")).toBe("2026-10-18T12:57:04.000Z");
    expect(sitemapDate("2026-10-18T14:57:04+02:00")).toBe("2026-10-18T12:57:04.000Z");
    expect(sitemapDate(undefined)).toBeUndefined();
    expect(sitemapDate("invalid")).toBeUndefined();
  });
  it("emits only an available translated product URL and excludes hidden products", async () => {
    getProducts.mockImplementation(async (_params, locale) => locale === "en" ? [{ id: 1, slug: "card", catalog_visibility: "visible", date_modified_gmt: "2026-10-18T12:57:04" }, { id: 2, slug: "hidden", catalog_visibility: "hidden" }] : []);
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    expect(entries.find(x => x.url.endsWith("/en/shop/card"))).toMatchObject({ lastModified: "2026-10-18T12:57:04.000Z", alternates: { languages: { en: "https://kubikart.de/en/shop/card" } } });
    expect(entries.some(x => x.url.endsWith("/hidden"))).toBe(false);
  });
});
