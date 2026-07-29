import { describe, expect, it, vi } from "vitest";
import type { BusinessIndustry } from "@/lib/wordpress";

vi.mock("server-only", () => ({}));

function industry(
  id: number,
  locale: "de" | "en",
  slug: string,
  translations: BusinessIndustry["translations"],
): BusinessIndustry {
  return {
    id,
    locale,
    slug,
    translations,
    modified: "2026-07-29T08:00:00",
    menuOrder: 0,
    title: slug,
    excerptHtml: "",
    excerptText: "",
    contentHtml: "",
    relatedProductIds: [],
  };
}

describe("Business Industry sitemap entries", () => {
  it("uses only real localized records and their translated slugs", async () => {
    const { buildIndustrySitemapEntries } = await import("@/app/sitemap");
    const entries = buildIndustrySitemapEntries(
      {
        de: [industry(173, "de", "restaurants-lieferdienste", { de: 173, en: 176 })],
        en: [industry(176, "en", "restaurants-and-takeaway", { de: 173, en: 176 })],
      },
      new Date("2026-07-29T09:00:00Z"),
    );

    expect(entries).toHaveLength(2);
    expect(entries[0].url).toContain("/de/businesses/restaurants-lieferdienste");
    expect(entries[0].alternates?.languages?.en).toContain(
      "/en/businesses/restaurants-and-takeaway",
    );
    expect(entries[0].lastModified).toBe("2026-07-29T08:00:00");
  });

  it("does not fabricate a missing translation", async () => {
    const { buildIndustrySitemapEntries } = await import("@/app/sitemap");
    const entries = buildIndustrySitemapEntries(
      {
        de: [industry(173, "de", "restaurants-lieferdienste", { de: 173 })],
        en: [],
      },
      new Date(),
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].alternates?.languages).not.toHaveProperty("en");
  });
});

