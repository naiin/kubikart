import "server-only";
import { wcApi } from "@/lib/woocommerce";
import { isValidCheckoutEmail } from "@/lib/checkout-validation";

type Coupon = {
  code: string; discount_type: string; amount: string; usage_limit: number | null; usage_count: number;
  date_expires_gmt?: string | null; date_expires?: string | null; email_restrictions?: string[];
  minimum_amount?: string; maximum_amount?: string; product_ids?: number[]; excluded_product_ids?: number[];
  product_categories?: number[]; excluded_product_categories?: number[]; exclude_sale_items?: boolean;
};

export class CartCouponError extends Error {}

/** Newsletter percentage coupons only; WooCommerce remains authoritative at order creation. */
export async function calculateCouponDiscount(code: string, email: string | undefined, subtotalCents: number) {
  const clean = code.trim().toLowerCase();
  if (!/^willkommen-[a-f0-9]{8}$/.test(clean) || !isValidCheckoutEmail(email)) throw new CartCouponError("Enter your newsletter coupon and the email address used to subscribe.");
  const coupons = await wcApi<Coupon[]>("coupons", { params: { code: clean }, revalidate: 0 });
  const coupon = coupons.find(item => item.code.toLowerCase() === clean);
  const expiry = coupon?.date_expires_gmt ? Date.parse(`${coupon.date_expires_gmt}Z`) : coupon?.date_expires ? Date.parse(coupon.date_expires) : null;
  const percentage = Number(coupon?.amount);
  if (!coupon || coupon.discount_type !== "percent" || !Number.isFinite(percentage) || percentage <= 0 || percentage > 100 ||
      (expiry !== null && (!Number.isFinite(expiry) || expiry <= Date.now())) ||
      (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) ||
      !coupon.email_restrictions?.some(value => value.toLowerCase() === email!.trim().toLowerCase()) ||
      subtotalCents < Number(coupon.minimum_amount || 0) * 100 ||
      (Number(coupon.maximum_amount) > 0 && subtotalCents > Number(coupon.maximum_amount) * 100) ||
      [coupon.product_ids, coupon.excluded_product_ids, coupon.product_categories, coupon.excluded_product_categories].some(value => value?.length) || coupon.exclude_sale_items) {
    throw new CartCouponError("This newsletter coupon is invalid, expired, already used, or does not match your email/cart.");
  }
  return { code: clean, discountCents: Math.min(subtotalCents, Math.round(subtotalCents * percentage / 100)) };
}
