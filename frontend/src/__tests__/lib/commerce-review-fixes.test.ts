import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidCheckoutAddress, isValidCheckoutEmail } from "@/lib/checkout-validation";
import { getApiRateLimitPolicy } from "@/lib/rate-limit";
import { requireStripeSecretKey } from "@/lib/stripe-config";
import { calculateCouponDiscount } from "@/lib/cart-coupon";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("production Stripe mode guard", () => {
  it("rejects test secrets and mixed modes in Vercel production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_live_fixture");
    expect(() => requireStripeSecretKey()).toThrow("live-mode");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_fixture");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_fixture");
    expect(() => requireStripeSecretKey()).toThrow("live-mode");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_live_fixture");
    expect(requireStripeSecretKey()).toBe("sk_live_fixture");
  });
  it("keeps isolated preview testing available", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture");
    expect(requireStripeSecretKey()).toBe("sk_test_fixture");
  });
});

describe("checkout validation and session limits", () => {
  const address = { first_name: "QA", last_name: "Fixture", address_1: "Testweg 1", address_2: "Floor 2", postcode: "10115", city: "Berlin", country: "DE" };
  it("requires a complete German address and valid email", () => {
    expect(isValidCheckoutAddress(address)).toBe(true);
    expect(isValidCheckoutAddress({ ...address, country: "AT" })).toBe(false);
    expect(isValidCheckoutAddress({ ...address, postcode: "invalid" })).toBe(false);
    expect(isValidCheckoutAddress({ ...address, first_name: "  " })).toBe(false);
    expect(isValidCheckoutEmail("bad-email")).toBe(false);
    expect(isValidCheckoutEmail("qa@example.com")).toBe(true);
  });
  it("allows session refreshes without weakening login protection", () => {
    expect(getApiRateLimitPolicy("/api/auth/session").limit).toBe(120);
    expect(getApiRateLimitPolicy("/api/auth/login").limit).toBe(10);
  });
});

describe("newsletter coupon quote validation", () => {
  const coupon = { code: "willkommen-1234abcd", discount_type: "percent", amount: "10", usage_count: 0, usage_limit: 1, email_restrictions: ["qa@example.com"], date_expires_gmt: "2099-01-01T00:00:00" };
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [coupon] })); });
  it("reads the actual WooCommerce discount and restricts it to the subscriber", async () => {
    await expect(calculateCouponDiscount("WILLKOMMEN-1234ABCD", "qa@example.com", 3500)).resolves.toEqual({ code: "willkommen-1234abcd", discountCents: 350 });
    await expect(calculateCouponDiscount("WILLKOMMEN-1234ABCD", "other@example.com", 3500)).rejects.toThrow("does not match");
  });
  it.each([{ usage_count: 1 }, { date_expires_gmt: "2000-01-01T00:00:00" }, { excluded_product_ids: [1] }])("rejects used, expired or unsupported restricted coupons: %j", async override => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ ...coupon, ...override }] }));
    await expect(calculateCouponDiscount("WILLKOMMEN-1234ABCD", "qa@example.com", 3500)).rejects.toThrow();
  });
});
