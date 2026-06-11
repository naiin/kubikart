import type { MetadataRoute } from "next";
import { getPlaceholderProducts } from "@/lib/product-page";
import { getProducts, type WCProduct } from "@/lib/woocommerce";
import {
  getAbsoluteUrl,
  getLocalizedPath,
  SEO_ROUTE_SEGMENTS,
  type LocalizedRouteSegments,
  type SiteLocale,
} from "@/lib/seo";

const SITEMAP_LOCALES: SiteLocale[] = ["de", "en"];
const PRODUCTS_PER_PAGE = 100;
const MAX_PRODUCT_PAGES = 10;

type StaticSitemapRoute = {
  route: LocalizedRouteSegments;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_SITEMAP_ROUTES: StaticSitemapRoute[] = [
  { route: SEO_ROUTE_SEGMENTS.home, changeFrequency: "weekly", priority: 1 },
  { route: SEO_ROUTE_SEGMENTS.shop, changeFrequency: "daily", priority: 0.95 },
  { route: SEO_ROUTE_SEGMENTS.personalizedGifts, changeFrequency: "weekly", priority: 0.8 },
  { route: SEO_ROUTE_SEGMENTS.services, changeFrequency: "weekly", priority: 0.85 },
  { route: SEO_ROUTE_SEGMENTS.laserService, changeFrequency: "weekly", priority: 0.8 },
  { route: SEO_ROUTE_SEGMENTS.laserCutting, changeFrequency: "weekly", priority: 0.75 },
  { route: SEO_ROUTE_SEGMENTS.printing3d, changeFrequency: "weekly", priority: 0.8 },
  { route: SEO_ROUTE_SEGMENTS.brandKit, changeFrequency: "monthly", priority: 0.7 },
  { route: SEO_ROUTE_SEGMENTS.printingMenus, changeFrequency: "monthly", priority: 0.7 },
  { route: SEO_ROUTE_SEGMENTS.customRequest, changeFrequency: "weekly", priority: 0.8 },
  { route: SEO_ROUTE_SEGMENTS.about, changeFrequency: "monthly", priority: 0.65 },
  { route: SEO_ROUTE_SEGMENTS.contact, changeFrequency: "monthly", priority: 0.7 },
  { route: SEO_ROUTE_SEGMENTS.faq, changeFrequency: "monthly", priority: 0.6 },
  { route: SEO_ROUTE_SEGMENTS.impressum, changeFrequency: "yearly", priority: 0.2 },
  { route: SEO_ROUTE_SEGMENTS.privacy, changeFrequency: "yearly", priority: 0.2 },
  { route: SEO_ROUTE_SEGMENTS.terms, changeFrequency: "yearly", priority: 0.2 },
  { route: SEO_ROUTE_SEGMENTS.shipping, changeFrequency: "monthly", priority: 0.35 },
  { route: SEO_ROUTE_SEGMENTS.withdrawal, changeFrequency: "yearly", priority: 0.2 },
];

async function fetchPublishedProducts(locale: SiteLocale) {
  const products: WCProduct[] = [];

  for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
    let batch: WCProduct[];

    try {
      batch = await getProducts(
        {
          per_page: PRODUCTS_PER_PAGE,
          page,
          status: "publish",
        },
        locale,
      );
    } catch {
      break;
    }

    if (!batch.length) {
      break;
    }

    products.push(...batch);

    if (batch.length < PRODUCTS_PER_PAGE) {
      break;
    }
  }

  return products;
}

function buildAlternates(route: Partial<Record<SiteLocale, string>>) {
  return {
    languages: Object.fromEntries(
      Object.entries(route).map(([locale, path]) => [locale, getAbsoluteUrl(path!)])
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { route, changeFrequency, priority } of STATIC_SITEMAP_ROUTES) {
    for (const locale of SITEMAP_LOCALES) {
      const segment = route[locale];
      if (!segment) {
        continue;
      }

      const localizedRoute = Object.fromEntries(
        SITEMAP_LOCALES.filter((availableLocale) => route[availableLocale]).map((availableLocale) => [
          availableLocale,
          getLocalizedPath(availableLocale, route[availableLocale]!),
        ]),
      ) as Partial<Record<SiteLocale, string>>;

      entries.push({
        url: getAbsoluteUrl(getLocalizedPath(locale, segment)),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: buildAlternates(localizedRoute),
      });
    }
  }

  const localizedProducts = await Promise.all(
    SITEMAP_LOCALES.map(async (locale) => [locale, await fetchPublishedProducts(locale)] as const),
  );
  const productEntries = Object.fromEntries(localizedProducts) as Record<SiteLocale, WCProduct[]>;

  if (!productEntries.de.length && !productEntries.en.length) {
    for (const product of getPlaceholderProducts()) {
      const alternates = {
        de: `/de/shop/${product.slug}`,
        en: `/en/shop/${product.slug}`,
      } satisfies Record<SiteLocale, string>;

      for (const locale of SITEMAP_LOCALES) {
        entries.push({
          url: getAbsoluteUrl(alternates[locale]),
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.9,
          alternates: buildAlternates(alternates),
        });
      }
    }

    return entries;
  }

  const slugById = new Map<number, Partial<Record<SiteLocale, string>>>();
  const modifiedBySlug = new Map<string, string | undefined>();

  for (const locale of SITEMAP_LOCALES) {
    for (const product of productEntries[locale]) {
      const localizedSlugs = slugById.get(product.id) || {};
      localizedSlugs[locale] = product.slug;
      slugById.set(product.id, localizedSlugs);
      modifiedBySlug.set(`${locale}:${product.slug}`, product.date_modified_gmt || product.date_modified);
    }
  }

  for (const locale of SITEMAP_LOCALES) {
    for (const product of productEntries[locale]) {
      const alternates: Partial<Record<SiteLocale, string>> = {
        [locale]: `/${locale}/shop/${product.slug}`,
      };

      for (const alternateLocale of SITEMAP_LOCALES) {
        const translatedId = product.translations?.[alternateLocale];
        if (!translatedId) {
          continue;
        }

        const translatedSlug = slugById.get(translatedId)?.[alternateLocale];
        if (translatedSlug) {
          alternates[alternateLocale] = `/${alternateLocale}/shop/${translatedSlug}`;
        }
      }

      entries.push({
        url: getAbsoluteUrl(`/${locale}/shop/${product.slug}`),
        lastModified: modifiedBySlug.get(`${locale}:${product.slug}`) || now,
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: buildAlternates(alternates),
      });
    }
  }

  return entries;
}
