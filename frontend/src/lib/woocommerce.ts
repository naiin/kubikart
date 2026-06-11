const WC_API_URL = process.env.WC_API_URL!;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY!;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET!;

/** Cache tags for targeted revalidation */
export const CACHE_TAGS = {
  products: "wc-products",
  categories: "wc-categories",
  product: (slug: string) => `wc-product-${slug}`,
} as const;

interface WCRequestOptions {
  params?: Record<string, string | number | boolean>;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  revalidate?: number;
  tags?: string[];
}

export async function wcApi<T>(endpoint: string, options: WCRequestOptions = {}): Promise<T> {
  const { params = {}, method = "GET", body, revalidate = 300, tags } = options;

  const url = new URL(`${WC_API_URL}/${endpoint}`);
  url.searchParams.set("consumer_key", WC_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", WC_CONSUMER_SECRET);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const fetchOptions: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method,
    headers: { "Content-Type": "application/json" },
    next: { revalidate, ...(tags?.length ? { tags } : {}) },
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`WC API ${method} ${endpoint} failed:`, errorBody);
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/** Decode common HTML entities returned by WooCommerce */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

// Product types
export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: string;
  date_modified?: string;
  date_modified_gmt?: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  weight: string;
  dimensions: { length: string; width: string; height: string };
  shipping_class: string;
  shipping_class_id: number;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  attributes: { id: number; name: string; slug?: string; variation?: boolean; options: string[] }[];
  default_attributes?: { id: number; name: string; option: string }[];
  variations?: number[];
  meta_data: { id: number; key: string; value: unknown }[];
  average_rating: string;
  rating_count: number;
  translations?: Record<string, number>;
  lang?: string;
}

export interface WCVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  image?: {
    id: number;
    src: string;
    alt?: string;
  };
  attributes: {
    id: number;
    name: string;
    slug?: string;
    option: string;
  }[];
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
  image: { src: string; alt: string } | null;
}

export interface WCOrder {
  id: number;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  line_items: {
    id: number;
    name: string;
    quantity: number;
    total: string;
    image: { src: string };
  }[];
}

// API helper functions
export async function getProducts(params?: Record<string, string | number | boolean>, lang?: string) {
  const products = await wcApi<WCProduct[]>("products", {
    params: { per_page: 20, ...(lang ? { lang } : {}), ...params },
    tags: [CACHE_TAGS.products],
  });
  return products.map((p) => ({ ...p, name: decodeEntities(p.name) }));
}

export async function getProduct(idOrSlug: string | number, lang?: string) {
  const langParam: Record<string, string> = lang ? { lang } : {};
  const slug = String(idOrSlug);
  const tags = [CACHE_TAGS.products, CACHE_TAGS.product(slug)];

  if (typeof idOrSlug === "number" || !isNaN(Number(idOrSlug))) {
    return wcApi<WCProduct>(`products/${idOrSlug}`, { params: langParam, tags });
  }

  // Try finding product by slug in the requested language
  const products = await wcApi<WCProduct[]>("products", {
    params: { slug, ...langParam },
    tags,
  });
  if (products.length > 0) return products[0];

  // Slug not found in this language — look it up without language filter
  // to find the other-language version, then get its translation
  if (lang) {
    const allLangProducts = await wcApi<WCProduct[]>("products", {
      params: { slug },
      tags,
    });
    if (allLangProducts.length > 0) {
      const found = allLangProducts[0];
      const translatedId = found.translations?.[lang];
      if (translatedId) {
        return wcApi<WCProduct>(`products/${translatedId}`, { params: { lang }, tags });
      }
      // If no translation mapping, return the found product as-is
      return found;
    }
  }

  throw new Error("Product not found");
}

export async function getProductVariations(productId: number, lang?: string, productSlug?: string) {
  const tags: string[] = [CACHE_TAGS.products];

  if (productSlug) {
    tags.push(CACHE_TAGS.product(productSlug));
  }

  return wcApi<WCVariation[]>(`products/${productId}/variations`, {
    params: { per_page: 100, ...(lang ? { lang } : {}) },
    tags,
  });
}

export async function getCategories(lang?: string) {
  const categories = await wcApi<WCCategory[]>("products/categories", {
    params: { per_page: 100, hide_empty: false, ...(lang ? { lang } : {}) },
    tags: [CACHE_TAGS.categories],
  });
  return categories.map((cat) => ({
    ...cat,
    name: decodeEntities(cat.name),
    description: decodeEntities(cat.description),
  }));
}

export async function getProductsByCategory(categoryId: number, lang?: string) {
  return wcApi<WCProduct[]>("products", {
    params: { category: categoryId, per_page: 50, ...(lang ? { lang } : {}) },
    tags: [CACHE_TAGS.products],
  });
}

// Reviews
export interface WCReview {
  id: number;
  date_created: string;
  product_id: number;
  product_name: string;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
}

export async function getProductReviews(productId: number) {
  return wcApi<WCReview[]>("products/reviews", {
    params: { product: productId, per_page: 20, status: "approved" },
    tags: [CACHE_TAGS.products],
  });
}

export async function getAllReviews(perPage = 10) {
  return wcApi<WCReview[]>("products/reviews", {
    params: { per_page: perPage, status: "approved" },
    tags: [CACHE_TAGS.products],
  });
}
