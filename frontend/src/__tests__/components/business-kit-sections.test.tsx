import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BusinessKitContentItem } from "@/lib/business-kits";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key}(${Object.values(values).join(",")})` : key,
  useLocale: () => "de",
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("@/components/ProductEnquiryForm", () => ({ ProductEnquiryForm: () => <form data-testid="enquiry-form" /> }));

function item(overrides: Partial<BusinessKitContentItem>): BusinessKitContentItem {
  return {
    id: "x",
    icon: "",
    quantity: 1,
    title: "Item",
    description: "",
    image: null,
    linkState: "unlinked",
    product: null,
    kind: "included",
    operation: "",
    replaces: null,
    ...overrides,
  };
}

describe("Business Bundle sections", () => {
  it("lists included items with quantities, then optional upgrades with their operation", async () => {
    const { BusinessKitContents } = await import("@/components/business-kits/BusinessKitProductSections");
    const html = renderToStaticMarkup(
      <BusinessKitContents
        state={{ kind: "enquiry" }}
        items={[
          item({ id: "a", title: "QR-Aufsteller", quantity: 1 }),
          item({ id: "b", title: "Acryl-Aufsteller", kind: "optional", operation: "replace", replaces: { id: 5, name: "QR-Aufsteller", slug: "qr" } }),
          item({ id: "c", title: "Milchglasfolie", kind: "optional", operation: "quote_dependent" }),
        ]}
      />,
    );

    expect(html.indexOf("contentsTitle")).toBeLessThan(html.indexOf("optionalTitle"));
    expect(html.indexOf("QR-Aufsteller")).toBeLessThan(html.indexOf("optionalTitle"));
    expect(html.indexOf("optionalTitle")).toBeLessThan(html.indexOf("Acryl-Aufsteller"));
    expect(html).toContain("operationReplace(QR-Aufsteller)");
    expect(html).toContain("operationQuote");
    // The optional items carry no quantity badge.
    expect(html.match(/contentsQuantity/g)).toHaveLength(1);
  });

  it("shows the no-price wording and a form toggle, but no purchase control, for an unpriced bundle", async () => {
    const { BusinessKitEnquiryPanel } = await import("@/components/business-kits/BusinessKitProductSections");
    const html = renderToStaticMarkup(
      <BusinessKitEnquiryPanel product={{ id: 1487, slug: "barber-salon-kit", name: "Barber" } as never} state={{ kind: "enquiry" }} />,
    );

    expect(html).toContain("priceToBeConfirmed");
    expect(html).toContain('aria-controls="kit-enquiry-form"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("data-testid=\"enquiry-form\"");
    expect(html).not.toMatch(/€\s*0|0,00/);
  });

  it("formats a supplied starting price as a from-price", async () => {
    const { BusinessKitEnquiryPanel } = await import("@/components/business-kits/BusinessKitProductSections");
    const html = renderToStaticMarkup(
      <BusinessKitEnquiryPanel product={{ id: 1, slug: "s", name: "S" } as never} state={{ kind: "enquiry", startingPrice: 149 }} />,
    );

    expect(html).toContain("startingPrice(");
    expect(html).not.toContain("priceToBeConfirmed");
  });
});
