export type HeaderLinkItem = {
  labelKey: string;
  href: string;
  activePrefixes?: string[];
};

export const headerNavigation: HeaderLinkItem[] = [
  { labelKey: "nav.shop", href: "/shop", activePrefixes: ["/shop", "/search", "/personalisierte-geschenke"] },
  { labelKey: "nav.businessKits", href: "/services/brand-kit", activePrefixes: ["/services/brand-kit"] },
  { labelKey: "nav.services", href: "/dienstleistungen", activePrefixes: ["/dienstleistungen", "/services"] },
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
