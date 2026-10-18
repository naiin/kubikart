import { describe, expect, it } from "vitest";
import { getDomesticShippingCharge, PARCEL_SHIPPING_CLASS as parcel, SMALL_PACKET_SHIPPING_CLASS as small } from "@/lib/shipping-policy";
import { calculateShippingRates, DHL_PRODUCTS } from "@/lib/shipping";

describe("merchant shipping class charges", () => {
  const tiny = { weight: 0.5, length: 20, width: 15, height: 5 };
  const large = { weight: 0.5, length: 45, width: 33, height: 5 };
  it("jar class wins in mixed carts regardless of order", () => {
    expect(getDomesticShippingCharge([small, parcel])).toBe("parcel");
    expect(getDomesticShippingCharge([parcel, small])).toBe("parcel");
  });
  it("only fully classified small-packet carts opt into the reduced charge", () => {
    expect(getDomesticShippingCharge([small, small])).toBe("small-packet");
    expect(getDomesticShippingCharge([small, ""])).toBeUndefined();
    expect(getDomesticShippingCharge([])).toBeUndefined();
  });
  it("forces jar Paket charge and carrier even when dimensions default to a tiny box", () => {
    expect(calculateShippingRates(tiny, 20, "DE", "parcel")[0]).toMatchObject({ id: "dhl_paket", price: 5.49, dhlProduct: DHL_PRODUCTS.PAKET_NATIONAL });
  });
  it("does not mislabel a physically large parcel as Kleinpaket to give the cheaper charge", () => {
    expect(calculateShippingRates(large, 20, "DE", "small-packet")[0]).toMatchObject({ id: "dhl_paket", price: 3.99, dhlProduct: DHL_PRODUCTS.PAKET_NATIONAL });
  });
  it("retains actual Kleinpaket for eligible small packages", () => {
    expect(calculateShippingRates(tiny, 20, "DE", "small-packet")[0]).toMatchObject({ id: "dhl_kleinpaket", price: 3.99 });
  });
  it("preserves free shipping at the configured threshold for both classes", () => {
    for (const charge of ["parcel", "small-packet"] as const) expect(calculateShippingRates(large, 50, "DE", charge)[0].price).toBe(0);
  });
  it("does not change international rates", () => {
    expect(calculateShippingRates(tiny, 20, "AT", "parcel")).toEqual(calculateShippingRates(tiny, 20, "AT"));
  });
});
