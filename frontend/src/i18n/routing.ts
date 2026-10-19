import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "always",
  localeDetection: false,
  // Page metadata/sitemap know the real translated slugs; generic same-path
  // Link headers would advertise incorrect product and service alternates.
  alternateLinks: false,
});

export function getRootLocaleRedirect(pathname: string) {
  return pathname === "/" ? "/de" : null;
}
