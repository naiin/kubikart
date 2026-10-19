/** Shared URL minimization for Web Analytics and performance measurements. */
export function filterMeasurementUrl<T extends { url: string }>(event: T): T | null {
  try {
    const url = new URL(event.url);
    if (/^\/(?:de|en)\/(?:account|cart|checkout|search)(?:\/|$)/.test(url.pathname) || /^\/(?:api|_next)\//.test(url.pathname)) {
      return null;
    }
    // Queries may carry contact details, search text, order keys or payment
    // client secrets. No marketing/query parameter is worth leaking those.
    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}
