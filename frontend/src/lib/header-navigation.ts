import { routing } from "@/i18n/routing";

export type HeaderLinkItem = {
  labelKey: string;
  href: string;
  activePrefixes?: string[];
};

const localeSegments = new Set<string>(routing.locales);

export function normalizeNavigationPath(pathname: string) {
  const pathWithoutQueryOrHash = pathname.split(/[?#]/, 1)[0] || "/";
  const segments = pathWithoutQueryOrHash.split("/").filter(Boolean);

  if (segments[0] && localeSegments.has(segments[0])) {
    segments.shift();
  }

  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

function matchesPathSegment(currentPath: string, candidatePath: string) {
  if (candidatePath === "/") {
    return currentPath === "/";
  }

  return currentPath === candidatePath || currentPath.startsWith(`${candidatePath}/`);
}

export function getActiveNavigationItem<T extends HeaderLinkItem>(
  pathname: string,
  items: readonly T[],
): T | undefined {
  const currentPath = normalizeNavigationPath(pathname);
  let bestMatch:
    | {
        item: T;
        exact: boolean;
        matchLength: number;
        itemIndex: number;
      }
    | undefined;

  items.forEach((item, itemIndex) => {
    const candidates = item.activePrefixes ?? [item.href];

    for (const candidate of candidates) {
      const normalizedCandidate = normalizeNavigationPath(candidate);
      if (!matchesPathSegment(currentPath, normalizedCandidate)) {
        continue;
      }

      const match = {
        item,
        exact: currentPath === normalizedCandidate,
        matchLength: normalizedCandidate.length,
        itemIndex,
      };

      const isBetterMatch =
        !bestMatch ||
        Number(match.exact) > Number(bestMatch.exact) ||
        (match.exact === bestMatch.exact && match.matchLength > bestMatch.matchLength) ||
        (match.exact === bestMatch.exact &&
          match.matchLength === bestMatch.matchLength &&
          match.itemIndex < bestMatch.itemIndex);

      if (isBetterMatch) {
        bestMatch = match;
      }
    }
  });

  return bestMatch?.item;
}

export const headerNavigation: HeaderLinkItem[] = [
  { labelKey: "nav.shop", href: "/shop", activePrefixes: ["/shop", "/search", "/personalisierte-geschenke"] },
  { labelKey: "nav.businessKits", href: "/services/brand-kit", activePrefixes: ["/services/brand-kit"] },
  {
    labelKey: "nav.services",
    href: "/businesses",
    activePrefixes: ["/businesses", "/services", "/dienstleistungen"],
  },
  { labelKey: "nav.about", href: "/ueber-uns", activePrefixes: ["/ueber-uns"] },
  { labelKey: "nav.contact", href: "/kontakt", activePrefixes: ["/kontakt"] },
];

export const mobileUtilityNavigation: HeaderLinkItem[] = [
  { labelKey: "mobile.personalizedGifts", href: "/personalisierte-geschenke" },
  { labelKey: "mobile.customRequest", href: "/sonderanfertigung" },
  { labelKey: "mobile.search", href: "/search" },
  { labelKey: "mobile.account", href: "/account" },
  { labelKey: "mobile.faq", href: "/faq" },
];
