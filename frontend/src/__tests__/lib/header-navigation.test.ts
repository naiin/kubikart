import { describe, expect, it } from "vitest";
import {
  getActiveNavigationItem,
  headerNavigation,
  normalizeNavigationPath,
} from "@/lib/header-navigation";

function activeLabel(pathname: string) {
  return getActiveNavigationItem(pathname, headerNavigation)?.labelKey;
}

describe("header navigation resolution", () => {
  it("normalizes locale prefixes, query strings, hashes, and trailing slashes", () => {
    expect(normalizeNavigationPath("/de/services/brand-kit/?source=header#kits")).toBe(
      "/services/brand-kit",
    );
    expect(normalizeNavigationPath("/en/shop/?category=12")).toBe("/shop");
    expect(normalizeNavigationPath("/de")).toBe("/");
  });

  it("gives an exact child route priority over a broader parent prefix", () => {
    expect(activeLabel("/de/services/brand-kit")).toBe("nav.businessKits");
    expect(activeLabel("/en/services/brand-kit/")).toBe("nav.businessKits");
  });

  it("assigns the WordPress-managed Business Industry routes to For Businesses", () => {
    expect(activeLabel("/de/businesses")).toBe("nav.businesses");
    expect(activeLabel("/en/businesses/driving-schools")).toBe("nav.businesses");
    expect(activeLabel("/de/dienstleistungen")).toBeUndefined();
  });

  it("keeps shop descendants assigned to Shop", () => {
    expect(activeLabel("/de/shop")).toBe("nav.shop");
    expect(activeLabel("/de/shop/example-product")).toBe("nav.shop");
  });

  it("respects path-segment boundaries", () => {
    expect(activeLabel("/de/serviceship")).toBeUndefined();
    expect(activeLabel("/de/shopper")).toBeUndefined();
  });

  it("resolves the existing localized About and Contact routes", () => {
    expect(activeLabel("/de/ueber-uns")).toBe("nav.about");
    expect(activeLabel("/de/kontakt")).toBe("nav.contact");
  });
});
