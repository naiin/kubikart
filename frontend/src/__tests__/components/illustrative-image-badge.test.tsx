import { describe, expect, it } from "vitest";

describe("kit image messages", () => {
  it("keeps the gallery scope note and shows no illustrative badge text", async () => {
    const de = (await import("@/messages/de.json")).default as { businessKitProduct: Record<string, string> };
    const en = (await import("@/messages/en.json")).default as { businessKitProduct: Record<string, string> };

    expect(de.businessKitProduct.imageNote).toBe("Gestaltungsbeispiel. Lieferumfang und Maße siehe Paketinhalt. Dekoration und Glasflächen nicht enthalten.");
    expect(en.businessKitProduct.imageNote).toMatch(/^Design example\./);
    expect(de.businessKitProduct.illustrativeBadge).toBeUndefined();
    expect(en.businessKitProduct.illustrativeBadge).toBeUndefined();
  });
});
