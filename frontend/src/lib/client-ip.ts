import { isIP } from "node:net";

/**
 * Client address for rate limiting.
 *
 * `X-Forwarded-For` is client-controlled unless it was written by infrastructure
 * we operate. The header is therefore only used when TRUSTED_PROXY_HOPS (the
 * number of trusted reverse proxies in front of the app, each appending one
 * entry) is set to a positive integer; the address is then read from the right
 * of the list, which a client cannot forge. Without it every request shares the
 * "unknown" bucket (safe default, never keyed by a spoofable header).
 */
export function getClientIp(headers: Pick<Headers, "get">, env: Record<string, string | undefined> = process.env): string {
  const hops = Number.parseInt(env.TRUSTED_PROXY_HOPS ?? "0", 10);
  if (!Number.isInteger(hops) || hops <= 0) return "unknown";

  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const candidate = entries[entries.length - hops];

  return candidate && isIP(candidate) ? candidate : "unknown";
}
