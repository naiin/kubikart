import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("robots metadata", () => {
  it("blocks APIs while allowing crawlers to read page-level noindex directives", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kubikart.de");
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: robots } = await import("@/app/robots");
    const metadata = robots();
    const rules = Array.isArray(metadata.rules) ? metadata.rules[0] : metadata.rules;

    expect(rules?.disallow).toEqual(["/api/"]);
    expect(Array.isArray(metadata.rules) && metadata.rules[1]).toMatchObject({
      userAgent: "OAI-SearchBot",
      allow: "/",
    });
    expect(metadata.sitemap).toContain("/sitemap.xml");
    vi.unstubAllEnvs();
  });

  it("blocks preview deployments and does not expose their sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.com");
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: robots } = await import("@/app/robots");

    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    vi.unstubAllEnvs();
  });
});
