import { describe, it, expect } from "vitest";
import { getDHLProductForPackage, calculateShippingRates, DHL_CONSTRAINTS } from "@/lib/shipping";

describe("getDHLProductForPackage", () => {
  it("classifies a small, light package as KLEINPAKET", () => {
    expect(getDHLProductForPackage({ weight: 0.5, length: 20, width: 15, height: 5 })).toBe("KLEINPAKET");
  });

  it("classifies package exactly at Kleinpaket limits as KLEINPAKET", () => {
    expect(
      getDHLProductForPackage({
        weight: DHL_CONSTRAINTS.KLEINPAKET.maxWeight,
        length: DHL_CONSTRAINTS.KLEINPAKET.maxLength,
        width: DHL_CONSTRAINTS.KLEINPAKET.maxWidth,
        height: DHL_CONSTRAINTS.KLEINPAKET.maxHeight,
      })
    ).toBe("KLEINPAKET");
  });

  it("classifies a heavier package as PAKET_NATIONAL", () => {
    expect(getDHLProductForPackage({ weight: 2, length: 30, width: 20, height: 15 })).toBe("PAKET_NATIONAL");
  });

  it("classifies large but light package (exceeds Kleinpaket height) as PAKET_NATIONAL", () => {
    // Height exceeds KLEINPAKET limit (8cm) but weight is fine
    expect(getDHLProductForPackage({ weight: 0.5, length: 30, width: 20, height: 12 })).toBe("PAKET_NATIONAL");
  });

  it("returns null for package exceeding all DHL limits", () => {
    expect(getDHLProductForPackage({ weight: 50, length: 200, width: 100, height: 100 })).toBeNull();
  });

  it("classifies package exactly at Paket National limits as PAKET_NATIONAL", () => {
    expect(
      getDHLProductForPackage({
        weight: DHL_CONSTRAINTS.PAKET_NATIONAL.maxWeight,
        length: DHL_CONSTRAINTS.PAKET_NATIONAL.maxLength,
        width: DHL_CONSTRAINTS.PAKET_NATIONAL.maxWidth,
        height: DHL_CONSTRAINTS.PAKET_NATIONAL.maxHeight,
      })
    ).toBe("PAKET_NATIONAL");
  });
});

describe("calculateShippingRates", () => {
  const smallPkg = { weight: 0.3, length: 20, width: 10, height: 3 };
  const mediumPkg = { weight: 1.5, length: 40, width: 30, height: 20 };

  describe("domestic (DE)", () => {
    it("returns Kleinpaket rate for small package below free threshold", () => {
      const rates = calculateShippingRates(smallPkg, 20, "DE");
      expect(rates).toHaveLength(1);
      expect(rates[0].id).toBe("dhl_kleinpaket");
      expect(rates[0].price).toBe(3.99);
    });

    it("returns free shipping for small package above free threshold (€50)", () => {
      const rates = calculateShippingRates(smallPkg, 55, "DE");
      expect(rates[0].price).toBe(0);
    });

    it("returns Paket rate for medium package below free threshold", () => {
      const rates = calculateShippingRates(mediumPkg, 30, "DE");
      expect(rates[0].id).toBe("dhl_paket");
      expect(rates[0].price).toBe(5.49);
    });

    it("returns free Paket shipping above threshold", () => {
      const rates = calculateShippingRates(mediumPkg, 60, "DE");
      expect(rates[0].price).toBe(0);
    });

    it("returns at least one rate (fallback) for oversized package", () => {
      const hugePkg = { weight: 50, length: 200, width: 100, height: 100 };
      const rates = calculateShippingRates(hugePkg, 10, "DE");
      expect(rates.length).toBeGreaterThan(0);
    });

    it("returns correct DHL product codes", () => {
      const kleinpaket = calculateShippingRates(smallPkg, 10, "DE");
      expect(kleinpaket[0].dhlProduct).toBe("V62WP");

      const paket = calculateShippingRates(mediumPkg, 10, "DE");
      expect(paket[0].dhlProduct).toBe("V01PAK");
    });
  });

  describe("international", () => {
    it("returns international rate for non-DE destination", () => {
      const rates = calculateShippingRates(smallPkg, 20, "AT");
      expect(rates).toHaveLength(1);
      expect(rates[0].id).toBe("dhl_international");
      expect(rates[0].dhlProduct).toBe("V66WPI");
    });

    it("international rate does not apply free shipping threshold", () => {
      const rates = calculateShippingRates(smallPkg, 100, "AT");
      // International shipping always has its base price
      expect(rates[0].price).toBeGreaterThan(0);
    });
  });
});
