import { describe, expect, it } from "vitest";

describe("product delivery-time copy", () => {
  it("uses the confirmed German delivery time on product pages in both languages", async () => {
    const de = (await import("@/messages/de.json")).default;
    const en = (await import("@/messages/en.json")).default;

    expect(de.productPage.shippingTimeNotice).toBe("Lieferzeit innerhalb Deutschlands: {time}");
    expect(de.shipping.domesticTime).toBe("3–5 Werktage");
    expect(en.productPage.shippingTimeNotice).toBe("Delivery time within Germany: {time}");
    expect(en.shipping.domesticTime).toBe("3–5 business days");
  });
});
