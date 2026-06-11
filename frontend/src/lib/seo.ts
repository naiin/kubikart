import type { Metadata } from "next";

export type SiteLocale = "de" | "en";
export type LocalizedRouteSegments = Partial<Record<SiteLocale, string>>;

const DEFAULT_SITE_URL = "https://kubikart.de";
const DEFAULT_LOCALE: SiteLocale = "de";

export const NO_INDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: true,
  googleBot: {
    index: false,
    follow: true,
  },
};

export const SEO_ROUTE_SEGMENTS = {
  home: { de: "/", en: "/" },
  shop: { de: "/shop", en: "/shop" },
  personalizedGifts: { de: "/personalisierte-geschenke", en: "/personalisierte-geschenke" },
  search: { de: "/search", en: "/search" },
  contact: { de: "/kontakt", en: "/kontakt" },
  customRequest: { de: "/sonderanfertigung", en: "/sonderanfertigung" },
  faq: { de: "/faq", en: "/faq" },
  about: { de: "/ueber-uns", en: "/ueber-uns" },
  services: { de: "/dienstleistungen", en: "/services" },
  laserService: { de: "/dienstleistungen/lasergravur", en: "/services/laser" },
  laserCutting: { de: "/dienstleistungen/laserschnitt" },
  printing3d: { de: "/dienstleistungen/3d-druck", en: "/services/3d-printing" },
  brandKit: { de: "/services/brand-kit", en: "/services/brand-kit" },
  printingMenus: { de: "/services/printing-menus", en: "/services/printing-menus" },
  impressum: { de: "/legal/impressum" },
  privacy: { de: "/legal/datenschutz" },
  terms: { de: "/legal/agb" },
  shipping: { de: "/legal/versand", en: "/legal/versand" },
  withdrawal: { de: "/legal/widerruf" },
  cart: { de: "/cart", en: "/cart" },
  account: { de: "/account", en: "/account" },
  checkout: { de: "/checkout", en: "/checkout" },
} as const satisfies Record<string, LocalizedRouteSegments>;

export function normalizeLocale(locale: string): SiteLocale {
  return locale === "en" ? "en" : "de";
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

function normalizeSegment(segment: string) {
  if (segment === "/") {
    return "";
  }

  return segment.startsWith("/") ? segment : `/${segment}`;
}

export function getLocalizedPath(locale: SiteLocale, segment: string) {
  return `/${locale}${normalizeSegment(segment)}`;
}

function getCanonicalLocale(locale: SiteLocale, routeSegments: LocalizedRouteSegments) {
  return routeSegments[locale] ? locale : DEFAULT_LOCALE;
}

function getCanonicalPath(locale: SiteLocale, routeSegments: LocalizedRouteSegments) {
  const canonicalLocale = getCanonicalLocale(locale, routeSegments);
  const canonicalSegment = routeSegments[canonicalLocale] || routeSegments[DEFAULT_LOCALE] || "/";

  return getLocalizedPath(canonicalLocale, canonicalSegment);
}

function getLanguageAlternates(routeSegments: LocalizedRouteSegments) {
  const languages: Record<string, string> = {};

  for (const locale of ["de", "en"] as const) {
    const segment = routeSegments[locale];
    if (!segment) {
      continue;
    }

    languages[locale] = getAbsoluteUrl(getLocalizedPath(locale, segment));
  }

  if (routeSegments[DEFAULT_LOCALE]) {
    languages["x-default"] = getAbsoluteUrl(getLocalizedPath(DEFAULT_LOCALE, routeSegments[DEFAULT_LOCALE]));
  }

  return languages;
}

export function buildPageMetadata({
  locale,
  routeSegments,
  title,
  description,
  index = true,
}: {
  locale: SiteLocale;
  routeSegments: LocalizedRouteSegments;
  title: string;
  description: string;
  index?: boolean;
}): Metadata {
  const canonicalLocale = getCanonicalLocale(locale, routeSegments);
  const canonicalUrl = getAbsoluteUrl(getCanonicalPath(locale, routeSegments));

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(routeSegments),
    },
    robots: index ? undefined : NO_INDEX_ROBOTS,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Kubikart",
      locale: canonicalLocale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
  };
}
