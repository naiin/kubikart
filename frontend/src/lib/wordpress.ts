import "server-only";

import sanitizeHtml from "sanitize-html";
import type { SiteLocale } from "@/lib/seo";

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL?.replace(/\/$/, "");
const WP_APP_USER = process.env.WP_APP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const REQUEST_TIMEOUT_MS = 8_000;
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export const WORDPRESS_CACHE_TAGS = {
  industries: "wp-business-industries",
  locale: (locale: SiteLocale) => `wp-business-industries-${locale}`,
  industry: (id: number) => `wp-business-industry-${id}`,
  slug: (locale: SiteLocale, slug: string) => `wp-business-industry-${locale}-${slug}`,
  sitemap: "wp-business-industries-sitemap",
} as const;

export type WordPressRendered = {
  rendered: string;
  protected?: boolean;
};

export type WordPressFeaturedMedia = {
  id: number;
  source_url: string;
  alt_text: string;
  media_details?: {
    width?: number;
    height?: number;
  };
};

export type BusinessIndustryRestRecord = {
  id: number;
  slug: string;
  status: "publish";
  modified: string;
  modified_gmt?: string;
  menu_order: number;
  title: WordPressRendered;
  excerpt: WordPressRendered;
  content: WordPressRendered;
  featured_media: number;
  lang?: SiteLocale;
  translations?: Partial<Record<SiteLocale, number>>;
  _kubikart_featured_kit_id?: number;
  _kubikart_related_product_ids?: number[];
  _embedded?: {
    "wp:featuredmedia"?: WordPressFeaturedMedia[];
  };
};

export type BusinessIndustry = {
  id: number;
  slug: string;
  locale: SiteLocale;
  modified: string;
  menuOrder: number;
  title: string;
  excerptHtml: string;
  excerptText: string;
  contentHtml: string;
  featuredMedia?: WordPressFeaturedMedia;
  translations: Partial<Record<SiteLocale, number>>;
  featuredKitId?: number;
  relatedProductIds: number[];
};

type WordPressRequestOptions = {
  params?: Record<string, string | number | boolean>;
  tags?: string[];
  revalidate?: number;
};

export class WordPressUnavailableError extends Error {
  constructor() {
    super("WordPress content is unavailable");
    this.name = "WordPressUnavailableError";
  }
}

function getWordPressAuthHeader() {
  if (!WORDPRESS_API_URL || !WP_APP_USER || !WP_APP_PASSWORD) {
    throw new WordPressUnavailableError();
  }
  return `Basic ${Buffer.from(`${WP_APP_USER}:${WP_APP_PASSWORD}`).toString("base64")}`;
}

async function wordpressApi<T>(endpoint: string, options: WordPressRequestOptions = {}): Promise<T> {
  if (!WORDPRESS_API_URL) {
    throw new WordPressUnavailableError();
  }

  const url = new URL(`${WORDPRESS_API_URL}/${endpoint.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(options.params || {})) {
    url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: getWordPressAuthHeader(),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: {
        revalidate: options.revalidate ?? 300,
        tags: options.tags,
      },
    });
  } catch {
    throw new WordPressUnavailableError();
  }

  if (!response.ok) {
    if (response.status === 404) {
      return null as T;
    }
    console.error("Authenticated WordPress content request failed.", {
      endpoint,
      status: response.status,
    });
    throw new WordPressUnavailableError();
  }

  return response.json() as Promise<T>;
}

const CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
    "strong", "b", "em", "i", "u", "s", "a", "blockquote", "figure",
    "figcaption", "img", "table", "thead", "tbody", "tfoot", "tr", "th",
    "td", "caption", "hr", "code", "pre", "sup", "sub",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    h1: "h2",
    a: (_tagName, attribs) => ({
      tagName: "a",
      attribs: attribs.target === "_blank"
        ? { ...attribs, rel: "noopener noreferrer" }
        : attribs,
    }),
  },
};

export function sanitizeWordPressContent(html: string) {
  return sanitizeHtml(html || "", CONTENT_SANITIZE_OPTIONS);
}

export function wordpressText(html: string) {
  return decodeWordPressEntities(
    sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} }),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function decodeWordPressEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    "#039": "'",
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (entity, code: string) => {
    const normalized = code.toLowerCase();
    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }
    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }
    return named[normalized] ?? entity;
  });
}

export function removeDuplicateLeadingExcerpt(contentHtml: string, excerptText: string) {
  if (!contentHtml || !excerptText) {
    return contentHtml;
  }
  if (wordpressText(contentHtml) === excerptText) {
    return "";
  }

  const firstParagraph = contentHtml.match(/^\s*<p>([\s\S]*?)<\/p>/i);
  if (firstParagraph && wordpressText(firstParagraph[0]) === excerptText) {
    return contentHtml.slice(firstParagraph[0].length).trim();
  }
  return contentHtml;
}

function adaptIndustry(record: BusinessIndustryRestRecord, requestedLocale: SiteLocale): BusinessIndustry {
  const locale = record.lang === "en" ? "en" : record.lang === "de" ? "de" : requestedLocale;
  const excerptHtml = sanitizeWordPressContent(record.excerpt?.rendered || "");

  const excerptText = wordpressText(excerptHtml);
  const contentHtml = removeDuplicateLeadingExcerpt(
    sanitizeWordPressContent(record.content?.rendered || ""),
    excerptText,
  );

  return {
    id: record.id,
    slug: record.slug,
    locale,
    modified: record.modified_gmt || record.modified,
    menuOrder: Number(record.menu_order) || 0,
    title: wordpressText(record.title?.rendered || ""),
    excerptHtml,
    excerptText,
    contentHtml,
    featuredMedia: record._embedded?.["wp:featuredmedia"]?.[0],
    translations: record.translations || {},
    featuredKitId: Number(record._kubikart_featured_kit_id) || undefined,
    relatedProductIds: Array.from(
      new Set((record._kubikart_related_product_ids || []).map(Number).filter((id) => id > 0)),
    ),
  };
}

function sortIndustries(industries: BusinessIndustry[]) {
  return industries.sort(
    (left, right) =>
      left.menuOrder - right.menuOrder ||
      left.title.localeCompare(right.title, left.locale === "de" ? "de-DE" : "en-GB"),
  );
}

export async function getBusinessIndustries(locale: SiteLocale): Promise<BusinessIndustry[]> {
  const records: BusinessIndustryRestRecord[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await wordpressApi<BusinessIndustryRestRecord[]>("business-industries", {
      params: {
        context: "view",
        status: "publish",
        lang: locale,
        page,
        per_page: PAGE_SIZE,
        order: "asc",
        orderby: "menu_order",
        _embed: "wp:featuredmedia",
      },
      tags: [
        WORDPRESS_CACHE_TAGS.industries,
        WORDPRESS_CACHE_TAGS.locale(locale),
        WORDPRESS_CACHE_TAGS.sitemap,
      ],
    });

    records.push(...batch.filter((record) => record.status === "publish" && (!record.lang || record.lang === locale)));
    if (batch.length < PAGE_SIZE) {
      break;
    }
  }

  return sortIndustries(records.map((record) => adaptIndustry(record, locale)));
}

export async function getBusinessIndustryById(id: number, locale: SiteLocale) {
  const record = await wordpressApi<BusinessIndustryRestRecord | null>(`business-industries/${id}`, {
    params: { context: "view", _embed: "wp:featuredmedia" },
    tags: [
      WORDPRESS_CACHE_TAGS.industries,
      WORDPRESS_CACHE_TAGS.locale(locale),
      WORDPRESS_CACHE_TAGS.industry(id),
    ],
  });
  if (!record || record.status !== "publish" || (record.lang && record.lang !== locale)) {
    return undefined;
  }
  return adaptIndustry(record, locale);
}

export async function getBusinessIndustryBySlug(slug: string, locale: SiteLocale) {
  const records = await wordpressApi<BusinessIndustryRestRecord[]>("business-industries", {
    params: {
      context: "view",
      status: "publish",
      slug,
      lang: locale,
      per_page: 1,
      _embed: "wp:featuredmedia",
    },
    tags: [
      WORDPRESS_CACHE_TAGS.industries,
      WORDPRESS_CACHE_TAGS.locale(locale),
      WORDPRESS_CACHE_TAGS.slug(locale, slug),
    ],
  });
  const record = records.find((item) => item.status === "publish" && (!item.lang || item.lang === locale));
  return record ? adaptIndustry(record, locale) : undefined;
}

export async function resolveBusinessIndustrySlug(slug: string, locale: SiteLocale) {
  const direct = await getBusinessIndustryBySlug(slug, locale);
  if (direct) {
    return { industry: direct, redirected: false };
  }

  const otherLocale: SiteLocale = locale === "de" ? "en" : "de";
  const alternate = await getBusinessIndustryBySlug(slug, otherLocale);
  const translatedId = alternate?.translations[locale];
  if (!translatedId) {
    return undefined;
  }
  const translated = await getBusinessIndustryById(translatedId, locale);
  return translated ? { industry: translated, redirected: true } : undefined;
}

export async function getIndustryTranslationSlugs(industry: BusinessIndustry) {
  const entries = await Promise.all(
    (["de", "en"] as const).map(async (locale) => {
      if (locale === industry.locale) {
        return [locale, industry.slug] as const;
      }
      const translatedId = industry.translations[locale];
      if (!translatedId) {
        return undefined;
      }
      const translated = await getBusinessIndustryById(translatedId, locale);
      return translated ? ([locale, translated.slug] as const) : undefined;
    }),
  );

  return Object.fromEntries(entries.filter(Boolean) as Array<readonly [SiteLocale, string]>) as Partial<
    Record<SiteLocale, string>
  >;
}
