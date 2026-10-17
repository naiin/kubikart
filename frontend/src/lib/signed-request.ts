import { createHmac, timingSafeEqual } from "node:crypto";

/** Header carrying the Unix time (seconds) at which the sender signed the request. */
export const SIGNATURE_TIMESTAMP_HEADER = "x-kubikart-timestamp";

/** A signed request older (or further in the future) than this is rejected. */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function hmac(secret: string, message: string) {
  return createHmac("sha256", secret).update(message).digest("base64");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verifies a machine-to-machine request. The signature is the base64 HMAC-SHA256 of `"<timestamp>.<body>"`, so a
 * captured request stops working after the tolerance window and cannot be re-dated.
 *
 * `allowUntimed` accepts the older body-only signature when no timestamp is sent. It exists only for senders that
 * cannot add a timestamp (native WooCommerce webhooks) and must stay off unless such a sender is configured.
 */
export function verifySignedRequest(options: {
  secret: string | undefined;
  signature: string | null;
  timestamp: string | null;
  body: string;
  allowUntimed?: boolean;
  nowSeconds?: number;
}): boolean {
  const { secret, signature, timestamp, body, allowUntimed = false, nowSeconds = Math.floor(Date.now() / 1000) } = options;
  if (!secret || !signature) return false;

  if (!timestamp) {
    return allowUntimed && safeEqual(signature, hmac(secret, body));
  }

  if (!/^\d{1,12}$/.test(timestamp)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return false;

  return safeEqual(signature, hmac(secret, `${timestamp}.${body}`));
}

/** Test and tooling helper: the signature a sender must produce. */
export function signRequest(secret: string, body: string, timestamp: number) {
  return hmac(secret, `${timestamp}.${body}`);
}
