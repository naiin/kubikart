import { describe, expect, it } from "vitest";
import {
  getActiveNavigationItem,
  getNavigationHref,
  headerNavigation,
  mobileUtilityNavigation,
  normalizeNavigationPath,
} from "@/lib/header-navigation";

function activeLabel(pathname: string) {
  return getActiveNavigationItem(pathname, headerNavigation)?.labelKey;
}

const forBusinesses = headerNavigation.find((item) => item.labelKey === "nav.forBusinesses");

function activeChildLabel(pathname: string) {
  return getActiveNavigationItem(pathname, forBusinesses?.children ?? [])?.labelKey;
}

describe("header navigation resolution", () => {
  it("normalizes locale prefixes, query strings, hashes, and trailing slashes", () => {
    expect(normalizeNavigationPath("/de/services/brand-kit/?source=header#kits")).toBe(
      "/services/brand-kit",
    );
    expect(normalizeNavigationPath("/en/shop/?category=12")).toBe("/shop");
    expect(normalizeNavigationPath("/de")).toBe("/");
  });

  it("has the five approved primary items in order", () => {
    expect(headerNavigation.map((item) => item.labelKey)).toEqual([
      "nav.shop",
      "nav.forBusinesses",
      "nav.personalizedGifts",
      "nav.about",
      "nav.contact",
    ]);
  });

  it("groups industries, Business Kits and the custom enquiry under For Businesses", () => {
    expect(forBusinesses?.children?.map((child) => [child.labelKey, child.href])).toEqual([
      ["nav.industries", "/businesses"],
      ["nav.businessKits", "/services/brand-kit"],
      ["nav.customEnquiry", "/sonderanfertigung"],
    ]);
  });

  it("marks the For Businesses group and the matching child as active", () => {
    for (const route of ["/de/businesses", "/en/businesses/driving-schools", "/de/services/brand-kit", "/de/sonderanfertigung"]) {
      expect(activeLabel(route)).toBe("nav.forBusinesses");
    }
    expect(activeChildLabel("/de/businesses")).toBe("nav.industries");
    expect(activeChildLabel("/en/businesses/driving-schools")).toBe("nav.industries");
    expect(activeChildLabel("/en/services/brand-kit/")).toBe("nav.businessKits");
    expect(activeChildLabel("/de/sonderanfertigung")).toBe("nav.customEnquiry");
  });

  it("keeps production services reachable from the utility links with localized hrefs", () => {
    const services = mobileUtilityNavigation.find((item) => item.labelKey === "mobile.productionServices");

    expect(services).toBeDefined();
    expect(getNavigationHref(services!, "de")).toBe("/dienstleistungen");
    expect(getNavigationHref(services!, "en")).toBe("/services");
    expect(getActiveNavigationItem("/de/dienstleistungen/lasergravur", mobileUtilityNavigation)).toBe(services);
  });

  it("keeps shop descendants assigned to Shop and gifts to their own item", () => {
    expect(activeLabel("/de/shop")).toBe("nav.shop");
    expect(activeLabel("/de/shop/example-product")).toBe("nav.shop");
    expect(activeLabel("/de/personalisierte-geschenke")).toBe("nav.personalizedGifts");
  });

  it("respects path-segment boundaries", () => {
    expect(activeLabel("/de/serviceship")).toBeUndefined();
    expect(activeLabel("/de/shopper")).toBeUndefined();
  });

  it("resolves the existing localized About and Contact routes", () => {
    expect(activeLabel("/de/ueber-uns")).toBe("nav.about");
    expect(activeLabel("/de/kontakt")).toBe("nav.contact");
  });

  it("returns at most one active primary item for every supported route family", () => {
    const routes = [
      "/de/businesses",
      "/en/businesses/restaurants-takeaways",
      "/de/services/brand-kit",
      "/en/services/brand-kit",
      "/de/sonderanfertigung",
      "/de/shop",
      "/de/shop/example-product",
    ];

    for (const route of routes) {
      const activeItem = getActiveNavigationItem(route, headerNavigation);
      expect(headerNavigation.filter((item) => item === activeItem)).toHaveLength(1);
    }
  });
});
