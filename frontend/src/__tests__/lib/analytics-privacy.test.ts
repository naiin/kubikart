import { describe, expect, it } from "vitest";
import { filterMeasurementUrl } from "@/lib/analytics-privacy";

describe("Vercel measurement URL privacy", () => {
  it.each(["/de/account/reset-password?key=secret&login=person", "/en/checkout/success?payment_intent_client_secret=secret", "/de/cart", "/en/search?q=person@example.com", "/api/orders"])("drops protected URL %s", (path) => {
    expect(filterMeasurementUrl({ type: "pageview", url: `https://kubikart.de${path}` })).toBeNull();
  });
  it("keeps public page measurements without arbitrary queries or fragments", () => {
    expect(filterMeasurementUrl({ type: "pageview", url: "https://kubikart.de/en/shop?email=person@example.com#secret" })).toEqual({ type: "pageview", url: "https://kubikart.de/en/shop" });
    expect(filterMeasurementUrl({ type: "vital", url: "https://kubikart.de/de" })).toEqual({ type: "vital", url: "https://kubikart.de/de" });
    expect(filterMeasurementUrl({ url: "not a URL" })).toBeNull();
  });
});
