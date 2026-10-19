/** Minimal public-identity lookup before Next starts streaming a page. */
type Identity = { id: number; slug: string; status: string; lang?: string; translations?: Record<string, number> };
export type PublicRoute = { kind: "found"; pathname: string } | { kind: "missing" } | { kind: "unavailable" };

export async function resolvePublicRoute(pathname: string): Promise<PublicRoute | null> {
  const match = pathname.match(/^\/(de|en)\/(shop|businesses)\/([^/]+)\/?$/);
  if (!match) return null;
  const [, locale, family, encodedSlug] = match;
  let slug: string;
  try { slug = decodeURIComponent(encodedSlug); } catch { return { kind: "missing" }; }
  if (/[\/\\\u0000]/.test(slug)) return { kind: "missing" };
  const products = family === "shop";
  const base = products ? process.env.WC_API_URL : process.env.WORDPRESS_API_URL;
  const username = products ? process.env.WC_CONSUMER_KEY : process.env.WP_APP_USER;
  const password = products ? process.env.WC_CONSUMER_SECRET : process.env.WP_APP_PASSWORD;
  if (!base || !username || !password) return { kind: "unavailable" };
  const endpoint = products ? "products" : "business-industries";
  // One deadline covers direct and translated lookups; do not multiply timeouts.
  const signal = AbortSignal.timeout(8_000);
  const lookup = async (id?: number, language?: string): Promise<Identity[]> => {
    const url = new URL(`${base.replace(/\/$/, "")}/${endpoint}${id ? `/${id}` : ""}`);
    url.searchParams.set("_fields", "id,slug,status,lang,translations");
    if (!id) {
      url.searchParams.set("slug", slug);
      url.searchParams.set("status", "publish");
      url.searchParams.set("per_page", "1");
    }
    if (language) url.searchParams.set("lang", language);
    const response = await fetch(url, {
      cache: "no-store", signal,
      headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` },
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error("Public identity lookup unavailable");
    const data = await response.json();
    return (Array.isArray(data) ? data : [data]).filter((item: Identity) => item.status === "publish");
  };
  try {
    const direct = (await lookup(undefined, locale)).find((item) => !item.lang || item.lang === locale);
    if (direct) return { kind: "found", pathname: `/${locale}/${family}/${direct.slug}` };
    const other = (await lookup(undefined, locale === "de" ? "en" : "de"))[0];
    const translatedId = other?.translations?.[locale];
    if (!translatedId) return { kind: "missing" };
    const translated = (await lookup(translatedId, locale)).find((item) => !item.lang || item.lang === locale);
    return translated
      ? { kind: "found", pathname: `/${locale}/${family}/${translated.slug}` }
      : { kind: "missing" };
  } catch {
    // An outage is not a missing product and must never be permanently cached as one.
    return { kind: "unavailable" };
  }
}
