import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BusinessIndustry } from "@/lib/wordpress";

const getLocale = vi.fn();
const getBusinessIndustries = vi.fn();

vi.mock("next-intl/server", () => ({
  getLocale,
  getTranslations: vi.fn(async () => (key: string, values?: Record<string, string>) =>
    values?.title ? `${key}:${values.title}` : key,
  ),
}));

vi.mock("@/lib/wordpress", () => ({
  getBusinessIndustries,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/business-industries/IndustryMedia", () => ({
  IndustryMedia: ({ title, media, fallbackSrc, fallbackAlt }: {
    title: string;
    media?: { source_url: string };
    fallbackSrc?: string;
    fallbackAlt?: string;
  }) => <div data-media={title} data-src={media?.source_url || fallbackSrc} data-alt={fallbackAlt} />,
}));

function industry(overrides: Partial<BusinessIndustry>): BusinessIndustry {
  return {
    id: 1,
    slug: "restaurants",
    locale: "de",
    modified: "2026-07-29T10:00:00Z",
    menuOrder: 0,
    title: "Restaurants",
    excerptHtml: "<p>Passende Produkte.</p>",
    excerptText: "Passende Produkte.",
    contentHtml: "",
    translations: {},
    bundleIds: [],
    relatedProductIds: [],
    ...overrides,
  };
}

describe("homepage Industry links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLocale.mockResolvedValue("de");
  });

  it("loads the current locale and preserves the ordered WordPress result", async () => {
    getBusinessIndustries.mockResolvedValue([
      industry({ id: 2, slug: "cafes", title: "Cafés", menuOrder: 1 }),
      industry({ id: 1, slug: "restaurants", title: "Restaurants", menuOrder: 2 }),
    ]);

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(getBusinessIndustries).toHaveBeenCalledWith("de");
    expect(html.indexOf("Cafés")).toBeLessThan(html.indexOf("Restaurants"));
    expect(html).toContain('href="/businesses/cafes"');
  });

  it("shows up to eight real Industries as compact links without duplicating entries", async () => {
    getBusinessIndustries.mockResolvedValue(
      Array.from({ length: 9 }, (_, index) =>
        industry({ id: index + 1, slug: `industry-${index + 1}`, title: `Industry ${index + 1}` }),
      ),
    );

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(html).toContain("/businesses/industry-8");
    expect(html).not.toContain("/businesses/industry-9");
    expect(html.match(/href="\/businesses\/industry-\d+"/g)).toHaveLength(8);
  });

  it("renders one published Industry once without filling the grid with duplicates", async () => {
    getBusinessIndustries.mockResolvedValue([
      industry({ id: 9, slug: "driving-schools", title: "Driving Schools", locale: "en" }),
    ]);
    getLocale.mockResolvedValue("en");

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(getBusinessIndustries).toHaveBeenCalledWith("en");
    expect(html).not.toContain('href="/en/businesses/driving-schools"');
    expect(html.split('href="/businesses/driving-schools"')).toHaveLength(2);
    expect(html.split("<li")).toHaveLength(2);
  });

  it("renders a restrained empty state without static fallback Industries", async () => {
    getBusinessIndustries.mockResolvedValue([]);

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(html).toContain("empty");
    expect(html).toContain('href="/businesses"');
    expect(html).not.toContain("Restaurants");
    expect(html).not.toContain("Barbers");
  });

  it.each([
    ["de", "fahrschulen"],
    ["en", "driving-schools"],
  ])("uses the matching product composition for the %s industry slug", async (locale, slug) => {
    getLocale.mockResolvedValue(locale);
    getBusinessIndustries.mockResolvedValue([
      industry({
        slug,
        featuredMedia: {
          id: 20,
          source_url: "https://example.com/old-generic-driving-photo.jpg",
          alt_text: "Old photograph",
        },
      }),
    ]);

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(html).toContain('/images/home/industries/driving-school-acrylic-qr-nfc-stand.webp');
    expect(html).toContain('data-alt="imageAlts.driving"');
    expect(html).not.toContain("old-generic-driving-photo.jpg");
  });

  it("keeps WordPress media for new industries without assigning an unrelated product image", async () => {
    getBusinessIndustries.mockResolvedValue([
      industry({
        slug: "new-industry",
        featuredMedia: { id: 21, source_url: "https://example.com/new-industry.jpg", alt_text: "New industry" },
      }),
      industry({ id: 2, slug: "industry-without-media" }),
    ]);

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(html).toContain('data-src="https://example.com/new-industry.jpg"');
    expect(html).not.toContain("/images/home/");
  });

  it("keeps the homepage available when WordPress Industries fail", async () => {
    getBusinessIndustries.mockRejectedValue(new Error("unavailable"));

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(html).toContain("unavailable");
    expect(html).toContain('href="/businesses"');
    expect(html).not.toContain("Restaurants");
  });
});
