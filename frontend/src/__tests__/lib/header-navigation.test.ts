import { describe, expect, it } from "vitest";
import {
  getActiveNavigationItem,
  getNavigationHref,
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

  it("uses Solutions as the gateway to the WordPress-managed Industry routes", () => {
    const solutions = headerNavigation.find((item) => item.labelKey === "nav.services");

    expect(solutions?.href).toBe("/businesses");
    expect(activeLabel("/de/businesses")).toBe("nav.services");
    expect(activeLabel("/en/businesses/driving-schools")).toBe("nav.services");
  });

  it("keeps existing service routes in a distinct Services active group", () => {
    expect(activeLabel("/de/services")).toBe("nav.productionServices");
    expect(activeLabel("/de/services/custom-order")).toBe("nav.productionServices");
    expect(activeLabel("/de/dienstleistungen")).toBe("nav.productionServices");
    expect(activeLabel("/de/dienstleistungen/lasergravur")).toBe("nav.productionServices");
  });

  it("uses the localized service overview destination", () => {
    const services = headerNavigation.find(
      (item) => item.labelKey === "nav.productionServices",
    );

    expect(services).toBeDefined();
    expect(getNavigationHref(services!, "de")).toBe("/dienstleistungen");
    expect(getNavigationHref(services!, "en")).toBe("/services");
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

  it("returns at most one active primary item for every supported route family", () => {
    const routes = [
      "/de/businesses",
      "/en/businesses/restaurants-takeaways",
      "/de/services/custom-order",
      "/de/services/brand-kit",
      "/en/services/brand-kit",
      "/de/shop",
      "/de/shop/example-product",
    ];

    for (const route of routes) {
      const activeItem = getActiveNavigationItem(route, headerNavigation);
      expect(headerNavigation.filter((item) => item === activeItem)).toHaveLength(1);
    }
  });
});
