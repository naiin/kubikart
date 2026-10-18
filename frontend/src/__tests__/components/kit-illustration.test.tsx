import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BusinessKitContentItem } from "@/lib/business-kits";

const messages: Record<string, (values?: Record<string, string | number>) => string> = {
  illustrationCaption: () => "Paketübersicht – illustrative Darstellung",
  illustrationItem: (values) => `${values?.count}× ${values?.name}`,
  contentsQuantity: (values) => `${values?.count}×`,
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => (messages[key] ? messages[key](values) : key),
}));

function item(overrides: Partial<BusinessKitContentItem>): BusinessKitContentItem {
  return { id: "x", icon: "stand", quantity: 1, title: "Aufsteller", description: "", image: null, linkState: "unlinked", product: null, kind: "included", operation: "", replaces: null, ...overrides };
}

describe("KitIllustration", () => {
  it("draws the configured quantities (five table stands, two sheets, one counter stand) and labels itself illustrative", async () => {
    const { KitIllustration } = await import("@/components/business-kits/KitIllustration");
    const html = renderToStaticMarkup(
      <KitIllustration
        items={[
          item({ id: "a", icon: "stand", quantity: 1, title: "Thekenaufsteller" }),
          item({ id: "b", icon: "table-stand", quantity: 5, title: "Tischaufsteller" }),
          item({ id: "c", icon: "sheet", quantity: 2, title: "A3-Menüblätter" }),
        ]}
      />,
    );

    expect(html).toContain('role="img"');
    expect(html).toContain("Paketübersicht – illustrative Darstellung: 1× Thekenaufsteller, 5× Tischaufsteller, 2× A3-Menüblätter");
    expect(html.match(/<svg/g)).toHaveLength(1 + 5 + 2);
  });

  it("shows three separate decal groups for the window kit", async () => {
    const { KitIllustration } = await import("@/components/business-kits/KitIllustration");
    const html = renderToStaticMarkup(
      <KitIllustration
        items={[
          item({ id: "a", icon: "decal-logo", title: "Logo" }),
          item({ id: "b", icon: "decal-hours", title: "Öffnungszeiten" }),
          item({ id: "c", icon: "decal-text", title: "Angebotstext" }),
        ]}
      />,
    );

    expect(html.match(/<li/g)).toHaveLength(3);
    expect(html.match(/<svg/g)).toHaveLength(3);
  });

  it("caps very large quantities and renders nothing without items", async () => {
    const { KitIllustration } = await import("@/components/business-kits/KitIllustration");
    expect(renderToStaticMarkup(<KitIllustration items={[item({ quantity: 40 })]} />).match(/<svg/g)).toHaveLength(5);
    expect(renderToStaticMarkup(<KitIllustration items={[]} />)).toBe("");
  });
});
