/** Hosts that Next's image optimizer cannot (or must not) fetch: local development stacks resolve to private addresses. */
const LOCAL_HOST = /(^|\.)lndo\.site$|^localhost$|^127\.|^\[?::1\]?$/i;

/**
 * Whether a product image can go through the Next image optimizer (resized WebP for the card size) instead of being
 * downloaded in full: true for relative URLs and any public host, false for local WordPress hosts such as `*.lndo.site`.
 */
export function canOptimizeImage(src: string) {
  try {
    return !LOCAL_HOST.test(new URL(src, "https://example.invalid").hostname);
  } catch {
    return false;
  }
}
