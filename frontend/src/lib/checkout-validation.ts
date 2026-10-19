import { isValidEmailAddress } from "@/lib/product-configuration";

export interface CheckoutAddress {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

export function isDomesticCountry(country: unknown): boolean {
  return typeof country === "string" && country.trim().toUpperCase() === "DE";
}

export function isValidCheckoutAddress(address: CheckoutAddress | undefined): boolean {
  return !!address && isDomesticCountry(address.country) &&
    [address.first_name, address.last_name, address.address_1, address.city].every(value => typeof value === "string" && value.trim().length > 0 && value.length <= 200) &&
    typeof address.postcode === "string" && /^\d{5}$/.test(address.postcode.trim()) &&
    (!address.address_2 || (typeof address.address_2 === "string" && address.address_2.length <= 200));
}

export function isValidCheckoutEmail(email: unknown): boolean {
  return typeof email === "string" && email.length <= 254 && isValidEmailAddress(email.trim());
}
