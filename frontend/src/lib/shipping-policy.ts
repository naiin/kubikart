/** Merchant-controlled customer charges, separate from physical carrier-size eligibility. */
export type DomesticShippingCharge = "small-packet" | "parcel";
export const PARCEL_SHIPPING_CLASS = "kubikart-parcel";
export const SMALL_PACKET_SHIPPING_CLASS = "kubikart-small-packet";

export function getDomesticShippingCharge(classes: string[]): DomesticShippingCharge | undefined {
  if (classes.includes(PARCEL_SHIPPING_CLASS)) return "parcel";
  if (classes.length > 0 && classes.every(value => value === SMALL_PACKET_SHIPPING_CLASS)) return "small-packet";
  // Unclassified/third-party classes retain the existing dimension-based pricing.
  return undefined;
}
