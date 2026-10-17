const TEST_SECRETS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

export { CAPTCHA_ACTIONS } from "@/lib/captcha-actions";

/** The browser widget is not a trust boundary: every public form is verified here before its API handler runs. */
export async function verifyCaptcha(token: unknown, action: string): Promise<"valid" | "invalid" | "unavailable"> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET?.trim();
  const testing = Boolean(secret && TEST_SECRETS.has(secret));
  if (!secret || (testing && process.env.NODE_ENV === "production")) return "unavailable";
  if (typeof token !== "string" || !token.trim() || token.length > 2048) return "invalid";
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return "unavailable";
    const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
    if (!result.success) return "invalid";
    // Cloudflare's documented testing keys intentionally omit the action and return example.com.
    // They can only be used in a non-production process, and still call the real Siteverify service.
    if (testing) return "valid";
    const hostnames = new Set(["kubikart.de", "www.kubikart.de"]);
    if (process.env.NEXT_PUBLIC_SITE_URL) hostnames.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname);
    return result.action === action && Boolean(result.hostname && hostnames.has(result.hostname)) ? "valid" : "invalid";
  } catch {
    return "unavailable";
  }
}
