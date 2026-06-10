export type HeaderNavChild = {
  labelKey: string;
  href: string;
  descriptionKey: string;
};

export type HeaderNavItem = {
  labelKey: string;
  href: string;
  activePrefixes?: string[];
  children?: HeaderNavChild[];
};

export type HeaderLinkItem = {
  labelKey: string;
  href: string;
};

export type TrustItem = {
  labelKey: string;
  icon: "origin" | "heart" | "shield" | "truck";
};

export const headerNavigation: HeaderNavItem[] = [
  { labelKey: "nav.shop", href: "/shop", activePrefixes: ["/shop", "/search"] },
  { labelKey: "nav.personalize", href: "/personalisierte-geschenke", activePrefixes: ["/personalisierte-geschenke"] },
  {
    labelKey: "nav.laserService",
    href: "/dienstleistungen",
    activePrefixes: ["/dienstleistungen", "/services/laser"],
    children: [
      {
        labelKey: "submenu.laserEngraving.title",
        href: "/dienstleistungen/lasergravur",
        descriptionKey: "submenu.laserEngraving.description",
      },
      {
        labelKey: "submenu.laserCutting.title",
        href: "/dienstleistungen/laserschnitt",
        descriptionKey: "submenu.laserCutting.description",
      },
      {
        labelKey: "submenu.acrylicSigns.title",
        href: "/shop/acryl-schilder",
        descriptionKey: "submenu.acrylicSigns.description",
      },
      {
        labelKey: "submenu.customRequest.title",
        href: "/sonderanfertigung",
        descriptionKey: "submenu.customRequest.description",
      },
    ],
  },
  { labelKey: "nav.printing3d", href: "/dienstleistungen/3d-druck", activePrefixes: ["/dienstleistungen/3d-druck", "/services/3d-printing"] },
  { labelKey: "nav.about", href: "/ueber-uns", activePrefixes: ["/ueber-uns"] },
  { labelKey: "nav.contact", href: "/kontakt", activePrefixes: ["/kontakt"] },
];

export const trustItems: TrustItem[] = [
  { labelKey: "trust.madeInGermany", icon: "origin" },
  { labelKey: "trust.handmade", icon: "heart" },
  { labelKey: "trust.quality", icon: "shield" },
  { labelKey: "trust.shipping", icon: "truck" },
];

export const topBarLinks: HeaderLinkItem[] = [
  { labelKey: "links.faq", href: "/faq" },
  { labelKey: "links.about", href: "/ueber-uns" },
];

export const mobileNavigation: HeaderLinkItem[] = [
  { labelKey: "nav.shop", href: "/shop" },
  { labelKey: "mobile.personalizedGifts", href: "/personalisierte-geschenke" },
  { labelKey: "submenu.laserEngraving.title", href: "/dienstleistungen/lasergravur" },
  { labelKey: "submenu.laserCutting.title", href: "/dienstleistungen/laserschnitt" },
  { labelKey: "nav.printing3d", href: "/dienstleistungen/3d-druck" },
  { labelKey: "submenu.acrylicSigns.title", href: "/shop/acryl-schilder" },
  { labelKey: "submenu.customRequest.title", href: "/sonderanfertigung" },
  { labelKey: "nav.about", href: "/ueber-uns" },
  { labelKey: "nav.contact", href: "/kontakt" },
  { labelKey: "links.faq", href: "/faq" },
];
