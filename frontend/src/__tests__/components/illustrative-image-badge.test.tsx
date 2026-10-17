import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "illustrativeBadge" ? "Illustrative Darstellung" : key),
}));

describe("IllustrativeImageBadge", () => {
  it("shows the visible illustrative disclosure on kit images", async () => {
    const { IllustrativeImageBadge } = await import("@/components/business-kits/IllustrativeImageBadge");

    const html = renderToStaticMarkup(<IllustrativeImageBadge />);

    expect(html).toContain("Illustrative Darstellung");
    expect(html).toContain("pointer-events-none");
  });
});

describe("kit image messages", () => {
  it("keeps the approved gallery note and badge in both languages", async () => {
    const de = (await import("@/messages/de.json")).default as { businessKitProduct: Record<string, string> };
    const en = (await import("@/messages/en.json")).default as { businessKitProduct: Record<string, string> };

    expect(de.businessKitProduct.imageNote).toBe("Gestaltungsbeispiel. Lieferumfang und Maße siehe Paketinhalt. Dekoration und Glasflächen nicht enthalten.");
    expect(de.businessKitProduct.illustrativeBadge).toBe("Illustrative Darstellung");
    expect(en.businessKitProduct.imageNote).toMatch(/^Design example\./);
    expect(en.businessKitProduct.illustrativeBadge).toBe("Illustrative image");
  });
});
