/**
 * Server-side security utilities for form protection.
 * - Honeypot detection (bots fill hidden fields)
 * - Timestamp validation (forms submitted too fast = bot)
 * - Origin/Referer verification
 */

const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", "https://kubikart.de", "https://www.kubikart.de"];

/** Minimum time (ms) a human needs to fill a form. 2 seconds for newsletter, 5 for contact. */
const MIN_SUBMISSION_TIME_MS = 2000;

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

/**
 * Checks if a form submission is likely spam.
 * @param body - The parsed request body (should include _hp and _t fields)
 * @param request - The incoming Request object
 * @param minTime - Minimum ms between page load and submit (default: 2000)
 */
export function checkForSpam(body: Record<string, unknown>, request: Request, minTime = MIN_SUBMISSION_TIME_MS): SpamCheckResult {
  // 1. Honeypot check: if _hp (hidden field) is filled, it's a bot
  if (body._hp && String(body._hp).trim() !== "") {
    return { isSpam: true, reason: "honeypot" };
  }

  // 2. Timestamp check: if form was submitted too quickly, it's likely a bot
  if (body._t) {
    const submittedAt = Number(body._t);
    const now = Date.now();
    if (!isNaN(submittedAt) && now - submittedAt < minTime) {
      return { isSpam: true, reason: "too_fast" };
    }
  }

  // 3. Origin/Referer check
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
    if (!isAllowed) {
      return { isSpam: true, reason: "invalid_origin" };
    }
  } else if (referer) {
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed));
    if (!isAllowed) {
      return { isSpam: true, reason: "invalid_referer" };
    }
  }

  return { isSpam: false };
}
