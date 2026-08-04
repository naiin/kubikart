import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("SEO helpers", () => {
  it("builds self-canonical localized metadata with crawl preview directives", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kubikart.de");
    vi.stubEnv("VERCEL_ENV", "production");
    const { buildPageMetadata } = await import("@/lib/seo");
    const metadata = buildPageMetadata({
      locale: "en",
      routeSegments: { de: "/shop", en: "/shop" },
      title: "Shop | Kubikart",
      description: "Products from Kubikart.",
    });

    expect(metadata.alternates?.canonical).toContain("/en/shop");
    expect(metadata.alternates?.languages).toMatchObject({
      de: expect.stringContaining("/de/shop"),
      en: expect.stringContaining("/en/shop"),
      "x-default": expect.stringContaining("/de/shop"),
    });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.twitter).toMatchObject({ card: "summary", title: "Shop | Kubikart" });
    vi.unstubAllEnvs();
  });

  it("escapes CMS-authored markup before embedding JSON-LD in a script", async () => {
    const { serializeJsonLd } = await import("@/lib/seo");
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });

    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
  });

  it("forces noindex outside the public production host", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kubikart-git-feature.vercel.app");
    vi.stubEnv("VERCEL_ENV", "preview");
    const { getRobotsMetadata } = await import("@/lib/seo");

    expect(getRobotsMetadata()).toMatchObject({ index: false, follow: true });
    vi.unstubAllEnvs();
  });
});
