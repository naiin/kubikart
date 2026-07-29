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
  IndustryMedia: ({ title }: { title: string }) => <div data-media={title} />,
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
    expect(html).toContain("Passende Produkte.");
  });

  it("limits the homepage to six real Industries without duplicating entries", async () => {
    getBusinessIndustries.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) =>
        industry({ id: index + 1, slug: `industry-${index + 1}`, title: `Industry ${index + 1}` }),
      ),
    );

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(html).toContain("/businesses/industry-6");
    expect(html).not.toContain("/businesses/industry-7");
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
    expect(html.split('href="/businesses/driving-schools"')).toHaveLength(3);
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

  it("keeps the homepage available when WordPress Industries fail", async () => {
    getBusinessIndustries.mockRejectedValue(new Error("unavailable"));

    const { IndustryLinks } = await import("@/components/home/IndustryLinks");
    const html = renderToStaticMarkup(await IndustryLinks());

    expect(html).toContain("unavailable");
    expect(html).toContain('href="/businesses"');
    expect(html).not.toContain("Restaurants");
  });
});
