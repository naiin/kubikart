import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function industry(overrides: Record<string, unknown> = {}) {
  return {
    id: 173,
    slug: "restaurants-lieferdienste",
    status: "publish",
    modified: "2026-07-29T10:00:00",
    modified_gmt: "2026-07-29T08:00:00",
    menu_order: 2,
    title: { rendered: "Restaurants &amp; Lieferdienste" },
    excerpt: { rendered: "<p>Reale Kurzbeschreibung.</p>" },
    content: { rendered: "<h1>Unsicher</h1><p>Inhalt<script>alert(1)</script></p>" },
    featured_media: 174,
    lang: "de",
    translations: { de: 173, en: 176 },
    _kubikart_featured_kit_id: 162,
    _kubikart_related_product_ids: [164, 168, 164],
    _embedded: {
      "wp:featuredmedia": [
        { id: 174, source_url: "https://test-wp.local/media.jpg", alt_text: "Restaurant products" },
      ],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("authenticated Business Industries WordPress client", () => {
  it("uses Basic auth server-side and adapts the approved relationship fields", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response([industry()]));
    const { getBusinessIndustries } = await import("@/lib/wordpress");

    const result = await getBusinessIndustries("de");

    expect(result).toHaveLength(1);
    expect(result[0].featuredKitId).toBe(162);
    expect(result[0].title).toBe("Restaurants & Lieferdienste");
    expect(result[0].relatedProductIds).toEqual([164, 168]);
    expect(result[0].featuredMedia?.id).toBe(174);
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toMatch(/^Basic /);
    expect(fetchMock.mock.calls[0][0].toString()).toContain("lang=de");
  });

  it("sorts by menu order then localized title and excludes non-published responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response([
      industry({ id: 5, title: { rendered: "Zahnärzte" }, menu_order: 1 }),
      industry({ id: 4, title: { rendered: "Bäckereien" }, menu_order: 1 }),
      industry({ id: 3, status: "draft", title: { rendered: "Draft" }, menu_order: 0 }),
    ]));
    const { getBusinessIndustries } = await import("@/lib/wordpress");

    const result = await getBusinessIndustries("de");
    expect(result.map((item) => item.id)).toEqual([4, 5]);
  });

  it("sanitizes editor HTML and demotes an editor H1", async () => {
    const { removeDuplicateLeadingExcerpt, sanitizeWordPressContent } = await import("@/lib/wordpress");
    const html = sanitizeWordPressContent(
      '<h1>Second H1</h1><p onclick="bad()">Text</p><script>alert(1)</script>',
    );

    expect(html).toContain("<h2>Second H1</h2>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(removeDuplicateLeadingExcerpt("<p>Summary</p><p>More</p>", "Summary")).toBe("<p>More</p>");
    expect(removeDuplicateLeadingExcerpt("<p>Summary</p>", "Summary")).toBe("");
  });

  it("resolves the translated record for a valid wrong-locale slug", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([industry({
        id: 176,
        slug: "restaurants-and-takeaway",
        lang: "en",
        translations: { en: 176, de: 173 },
      })]))
      .mockResolvedValueOnce(response(industry()));
    const { resolveBusinessIndustrySlug } = await import("@/lib/wordpress");

    const result = await resolveBusinessIndustrySlug("restaurants-and-takeaway", "de");
    expect(result?.redirected).toBe(true);
    expect(result?.industry.slug).toBe("restaurants-lieferdienste");
  });

  it("returns undefined for an unknown published slug", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => response([]));
    const { resolveBusinessIndustrySlug } = await import("@/lib/wordpress");

    await expect(resolveBusinessIndustrySlug("not-real", "de")).resolves.toBeUndefined();
  });

  it("throws a safe unavailable error without exposing an endpoint response", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("internal endpoint detail"));
    const { getBusinessIndustries, WordPressUnavailableError } = await import("@/lib/wordpress");

    await expect(getBusinessIndustries("de")).rejects.toBeInstanceOf(WordPressUnavailableError);
  });
});
