import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "always",
  localeDetection: false,
});

export function getRootLocaleRedirect(pathname: string) {
  return pathname === "/" ? "/de" : null;
}
