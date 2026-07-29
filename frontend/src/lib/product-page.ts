import { getTranslations } from "next-intl/server";
import { getProduct, getProducts, getProductsByIds, getProductVariations, type WCProduct, type WCVariation } from "@/lib/woocommerce";

export type ProductAvailability = "in_stock" | "made_to_order" | "out_of_stock";

export interface ProductPrice {
  amount: number;
  currency: "EUR";
  prefix?: "ab";
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductPersonalizationOption {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  defaultValue?: string;
  price?: number;
  isMigrationCompatibility?: boolean;
  options?: {
    label: string;
    value: string;
  }[];
}

export interface ProductVariation {
  id: number;
  attributes: Record<string, string>;
  price: ProductPrice;
  availability: ProductAvailability;
  image?: ProductImage;
}

export interface ProductDetailSection {
  id: string;
  title: string;
  content: string[];
}

export interface ProductBenefit {
  title: string;
  text: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProductQuickFact {
  label: string;
  value: string;
}

export interface ProductSeoContent {
  title: string;
  paragraphs: string[];
}

export interface ProductPageProduct {
  id: number;
  slug: string;
  translations?: Record<string, number>;
  name: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  category: {
    id?: number;
    name: string;
    slug: string;
  };
  categories: {
    id?: number;
    name: string;
    slug: string;
  }[];
  images: ProductImage[];
  price: ProductPrice;
  priceNote: string;
  availability: ProductAvailability;
  productionTime: string;
  shippingNote: string;
  badges: string[];
  trustItems: string[];
  paymentHints: string[];
  quickFacts: ProductQuickFact[];
  personalizationOptions: ProductPersonalizationOption[];
  defaultOptionValues?: Record<string, string>;
  variations?: ProductVariation[];
  detailSections: ProductDetailSection[];
  benefits: ProductBenefit[];
  faqs: ProductFaq[];
  seoContent: ProductSeoContent;
  relatedProductSlugs: string[];
  relatedProductIds?: number[];
  descriptionHtml?: string;
  attributes?: { name: string; values: string[] }[];
  customRequestHref: string;
  supportHref: string;
  sku?: string;
  averageRating?: number;
  reviewCount?: number;
  weight?: number; // kg
  dimensions?: { length: number; width: number; height: number }; // cm
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kubikart.de").replace(/\/$/, "");

function buildMailtoHref(subject: string, body: string) {
  return `mailto:info@kubikart.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildCustomRequestHref(productName: string, productSlug: string) {
  return buildMailtoHref(
    `Sonderwunsch zu ${productName}`,
    `Hallo Kubikart,\n\nich interessiere mich fuer ${productName}.\nProdukt: ${SITE_URL}/de/shop/${productSlug}\n\nMein Wunsch:`,
  );
}

function buildSupportHref(productName: string, productSlug: string) {
  return buildMailtoHref(
    `Frage zu ${productName}`,
    `Hallo Kubikart,\n\nich habe eine Frage zu ${productName}.\nProdukt: ${SITE_URL}/de/shop/${productSlug}\n\nMeine Frage:`,
  );
}

function hasWooCommerceConfig() {
  return Boolean(process.env.WC_API_URL && process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET);
}

export function parseProductCustomFields(metaData: { key: string; value: unknown }[]): ProductPersonalizationOption[] | null {
  const entry = metaData?.find((m) => m.key === "_kubikart_custom_fields");
  if (!entry) return null;

  let storedValue: unknown = entry.value;
  if (typeof entry.value === "string") {
    try {
      storedValue = JSON.parse(entry.value);
    } catch {
      return null;
    }
  }

  const fields = Array.isArray(storedValue)
    ? storedValue
    : storedValue &&
        typeof storedValue === "object" &&
        "fields" in storedValue &&
        Array.isArray((storedValue as { fields?: unknown }).fields)
      ? (storedValue as { fields: unknown[] }).fields
      : null;

  if (!Array.isArray(fields) || fields.length === 0) return null;

  return fields
    .filter((field): field is Record<string, unknown> => typeof field === "object" && field !== null && "id" in field && "label" in field)
    .flatMap((field) => {
      const rawType = String(field.type || "");
      const type = rawType === "color" ? "select" : rawType;

      if (!["text", "textarea", "select", "checkbox"].includes(type)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`Unsupported Kubikart product field type "${rawType}" for field "${String(field.id)}".`);
        }
        return [];
      }

      const parsedField: ProductPersonalizationOption = {
        id: String(field.id),
        label: String(field.label),
        type: type as ProductPersonalizationOption["type"],
        required: field.required === true || field.required === "true",
        helperText: field.helperText ? String(field.helperText) : undefined,
      };

      if (type === "text" || type === "textarea") {
        parsedField.placeholder = field.placeholder ? String(field.placeholder) : undefined;
        parsedField.maxLength =
          Number.isFinite(Number(field.maxLength)) && Number(field.maxLength) > 0
            ? Number(field.maxLength)
            : undefined;
      }

      if (type === "select") {
        parsedField.options = Array.isArray(field.options)
          ? (field.options as { label: string; value: string }[])
              .filter((option) => option && option.label && option.value)
              .map((option) => ({ label: String(option.label), value: String(option.value) }))
          : [];
        const defaultValue = field.defaultValue ? String(field.defaultValue) : undefined;
        parsedField.defaultValue = parsedField.options.some((option) => option.value === defaultValue)
          ? defaultValue
          : undefined;
      }

      if (type === "checkbox") {
        parsedField.price =
          Number.isFinite(Number(field.price)) && Number(field.price) >= 0
            ? Number(field.price)
            : 0;
      }

      return [parsedField];
    });
}

function stripHtml(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function createParagraphs(text: string, limit = 2) {
  if (!text) {
    return [];
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((paragraphs, sentence) => {
      if (!sentence) {
        return paragraphs;
      }

      if (paragraphs.length === 0) {
        return [sentence];
      }

      const lastIndex = paragraphs.length - 1;
      const candidate = `${paragraphs[lastIndex]} ${sentence}`.trim();
      if (candidate.length <= 210) {
        paragraphs[lastIndex] = candidate;
      } else if (paragraphs.length < limit) {
        paragraphs.push(sentence);
      }

      return paragraphs;
    }, [])
    .slice(0, limit);
}

function parsePriceAmount(rawValue: string | undefined, fallbackAmount: number) {
  const parsed = Number.parseFloat(rawValue || "");
  return Number.isFinite(parsed) ? parsed : fallbackAmount;
}

function toOptionId(rawValue: string | undefined) {
  return (rawValue || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function toOptionValue(rawValue: string | undefined) {
  return (rawValue || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function mapAvailability(stockStatus: string | undefined, fallbackAvailability: ProductAvailability): ProductAvailability {
  if (stockStatus === "outofstock") {
    return "out_of_stock";
  }

  if (stockStatus === "instock") {
    return fallbackAvailability === "made_to_order" ? "made_to_order" : "in_stock";
  }

  return fallbackAvailability;
}

interface MappingLabels {
  fallbackCategory: string;
  factCategory: string;
  factProduction: string;
  factShipping: string;
  detailDescription: string;
  detailPersonalization: string;
  detailMaterial: string;
  detailShipping: string;
  detailCare: string;
  personalizationFallback1: string;
  personalizationFallback2: string;
  genericSubtitle: (productName: string, categoryName: string) => string;
  genericSeoDescription: (productName: string) => string;
  badges: string[];
  trustItems: string[];
  paymentHints: string[];
  priceNote: string;
  productionTime: string;
  shippingNote: string;
  legacyGiftWrapLabel: string;
  legacyGiftWrapHelper: string;
  benefits: ProductBenefit[];
  faqs: ProductFaq[];
}

function mapAttributePersonalizationOptions(product: WCProduct): ProductPersonalizationOption[] {
  return product.attributes
    .filter((attr) => attr.variation === true && attr.options.length > 0)
    .map((attr) => ({
      id: toOptionId(attr.slug || attr.name),
      label: attr.name,
      type: "select" as const,
      required: true,
      options: attr.options.map((opt) => ({ label: opt, value: toOptionValue(opt) })),
    }));
}

function mergePersonalizationOptions(primaryOptions: ProductPersonalizationOption[], secondaryOptions: ProductPersonalizationOption[]) {
  const mergedOptions = new Map<string, ProductPersonalizationOption>();

  for (const option of [...primaryOptions, ...secondaryOptions]) {
    if (!mergedOptions.has(option.id)) {
      mergedOptions.set(option.id, option);
    }
  }

  return Array.from(mergedOptions.values());
}

export function resolveProductPersonalizationOptions(
  attributeOptions: ProductPersonalizationOption[],
  metaOptions: ProductPersonalizationOption[] | null,
  migrationPresetOptions: ProductPersonalizationOption[] = [],
) {
  if (metaOptions) {
    return mergePersonalizationOptions(attributeOptions, metaOptions);
  }

  return migrationPresetOptions.length > 0 ? migrationPresetOptions : attributeOptions;
}

function mapWooVariations(variations: WCVariation[] | undefined, fallbackAvailability: ProductAvailability): ProductVariation[] | undefined {
  if (!variations?.length) {
    return undefined;
  }

  return variations.map((variation) => ({
    id: variation.id,
    attributes: variation.attributes.reduce<Record<string, string>>((mappedAttributes, attribute) => {
      mappedAttributes[toOptionId(attribute.slug || attribute.name)] = toOptionValue(attribute.option);
      return mappedAttributes;
    }, {}),
    price: {
      amount: parsePriceAmount(variation.price || variation.regular_price || variation.sale_price, 0),
      currency: "EUR",
    },
    availability: mapAvailability(variation.stock_status, fallbackAvailability),
    image: variation.image?.src
      ? {
          src: variation.image.src,
          alt: variation.image.alt || "",
        }
      : undefined,
  }));
}

function mapWooDefaultOptionValues(product: WCProduct) {
  const defaultOptionValues = product.default_attributes?.reduce<Record<string, string>>((mappedDefaults, attribute) => {
    mappedDefaults[toOptionId(attribute.name)] = toOptionValue(attribute.option);
    return mappedDefaults;
  }, {});

  return defaultOptionValues && Object.keys(defaultOptionValues).length > 0 ? defaultOptionValues : undefined;
}

function mapWooProductToProductPageProduct(
  product: WCProduct,
  labels: MappingLabels,
  variations?: WCVariation[],
): ProductPageProduct {
  const primaryCategory = product.categories[0]
    ? {
        id: product.categories[0].id,
        name: product.categories[0].name,
        slug: product.categories[0].slug,
      }
    : { id: 0, name: labels.fallbackCategory, slug: "produkte" };
  const plainShortDescription = stripHtml(product.short_description || product.description);
  const plainDescription = stripHtml(product.description || product.short_description);
  const descriptionParagraphs = createParagraphs(plainDescription, 2);
  const personalizationParagraphs = [
    labels.personalizationFallback1,
    labels.personalizationFallback2,
  ];
  const materialParagraphs =
    product.attributes.map((attribute) => `${attribute.name}: ${attribute.options.join(", ")}`).slice(0, 3);

  const priceAmount = parsePriceAmount(product.price || product.regular_price || product.sale_price, 0);
  const mappedVariations = mapWooVariations(variations, "in_stock");
  const defaultOptionValues = mapWooDefaultOptionValues(product);
  const attributePersonalizationOptions = mapAttributePersonalizationOptions(product);
  const metaCustomFields = parseProductCustomFields(product.meta_data);
  const configuredPersonalizationOptions = resolveProductPersonalizationOptions(
    attributePersonalizationOptions,
    metaCustomFields,
  );

  return {
    id: product.id,
    slug: product.slug,
    translations: product.translations,
    name: product.name,
    subtitle: plainShortDescription,
    shortDescription: plainShortDescription,
    description: plainDescription,
    descriptionHtml: product.description || product.short_description || "",
    seoTitle: `${product.name} | Kubikart`,
    seoDescription: plainShortDescription || labels.genericSeoDescription(product.name),
    category: primaryCategory,
    categories: product.categories.length
        ? product.categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }))
      : [primaryCategory],
    images: product.images.length
      ? product.images.map((image) => ({
          src: image.src,
          alt: image.alt || `${product.name} – Kubikart`,
        }))
      : [],
    price: {
      amount: priceAmount,
      currency: "EUR",
    },
    priceNote: labels.priceNote,
    availability: mapAvailability(product.stock_status, "in_stock"),
    productionTime: "",
    shippingNote: "",
    badges: [],
    trustItems: [],
    paymentHints: [],
    quickFacts: [
      { label: labels.factCategory, value: primaryCategory.name },
      ...(product.weight ? [{ label: "Weight", value: `${product.weight} kg` }] : []),
    ],
    personalizationOptions: configuredPersonalizationOptions,
    defaultOptionValues,
    variations: mappedVariations,
    detailSections: [
      {
        id: "beschreibung",
        title: labels.detailDescription,
        content: descriptionParagraphs,
      },
      {
        id: "personalisierung",
        title: labels.detailPersonalization,
        content: personalizationParagraphs,
      },
      {
        id: "material-und-masse",
        title: labels.detailMaterial,
        content: materialParagraphs,
      },
      {
        id: "versand-und-fertigung",
        title: labels.detailShipping,
        content: [],
      },
      {
        id: "pflegehinweise",
        title: labels.detailCare,
        content: [],
      },
    ].filter((section) => section.content.length > 0),
    benefits: [],
    faqs: [],
    seoContent: { title: product.name, paragraphs: descriptionParagraphs },
    relatedProductSlugs: [],
    relatedProductIds: [...(product.upsell_ids || []), ...(product.related_ids || [])],
    attributes: product.attributes.map((attribute) => ({ name: attribute.name, values: attribute.options })),
    customRequestHref: buildCustomRequestHref(product.name, product.slug),
    supportHref: buildSupportHref(product.name, product.slug),
    sku: product.id ? `KB-${product.id}` : undefined,
    averageRating: Number.parseFloat(product.average_rating || "0") || 0,
    reviewCount: product.rating_count || 0,
    weight: parseFloat(product.weight) || undefined,
    dimensions:
      product.dimensions?.length || product.dimensions?.width || product.dimensions?.height
        ? {
            length: parseFloat(product.dimensions.length) || 0,
            width: parseFloat(product.dimensions.width) || 0,
            height: parseFloat(product.dimensions.height) || 0,
          }
        : undefined,
  };
}

export async function getProductPageProduct(slug: string, lang?: string) {
  if (hasWooCommerceConfig()) {
    try {
      const t = await getTranslations("productPage");
      const labels: MappingLabels = {
        fallbackCategory: t("fallbackCategory"),
        factCategory: t("factCategory"),
        factProduction: t("factProduction"),
        factShipping: t("factShipping"),
        detailDescription: t("detailDescription"),
        detailPersonalization: t("detailPersonalization"),
        detailMaterial: t("detailMaterial"),
        detailShipping: t("detailShipping"),
        detailCare: t("detailCare"),
        personalizationFallback1: t("personalizationFallback1"),
        personalizationFallback2: t("personalizationFallback2"),
        genericSubtitle: (productName, categoryName) => t("genericSubtitle", { productName, categoryName }),
        genericSeoDescription: (productName) => t("genericSeoDescription", { productName }),
        badges: [t("badgePersonalized"), t("badgeHandmade"), t("badgeMadeInGermany")],
        trustItems: [t("trustSecurePayment"), t("trustFastProduction"), t("trustPersonalSupport"), t("trustCarefullyPackaged")],
        paymentHints: [t("paymentHint1"), t("paymentHint2"), t("paymentHint3")],
        priceNote: t("priceNote"),
        productionTime: t("productionTime"),
        shippingNote: t("shippingNote"),
        legacyGiftWrapLabel: t("legacyGiftWrapLabel"),
        legacyGiftWrapHelper: t("legacyGiftWrapHelper"),
        benefits: [
          { title: t("benefit1_title"), text: t("benefit1_text") },
          { title: t("benefit2_title"), text: t("benefit2_text") },
          { title: t("benefit3_title"), text: t("benefit3_text") },
          { title: t("benefit4_title"), text: t("benefit4_text") },
        ],
        faqs: [
          { question: t("faq1_question"), answer: t("faq1_answer") },
          { question: t("faq2_question"), answer: t("faq2_answer") },
          { question: t("faq3_question"), answer: t("faq3_answer") },
          { question: t("faq4_question"), answer: t("faq4_answer") },
          { question: t("faq5_question"), answer: t("faq5_answer") },
        ],
      };
      const product = await getProduct(slug, lang);
      const variations = product.type === "variable" ? await getProductVariations(product.id, lang, product.slug) : undefined;
      return mapWooProductToProductPageProduct(product, labels, variations);
    } catch (error) {
      if (error instanceof Error && (error.message === "Product not found" || error.message.includes("404"))) {
        return null;
      }
      throw error;
    }
  }

  throw new Error("WooCommerce is unavailable");
}

export async function getRelatedProducts(product: ProductPageProduct, lang?: string, limit = 4) {
  let candidates = await getProductsByIds(product.relatedProductIds || [], lang);
  if (candidates.length < limit && (product.category.id || 0) > 0) {
    const categoryProducts = await getProducts({ category: product.category.id || 0, per_page: limit + 1, status: "publish" }, lang);
    candidates = [...candidates, ...categoryProducts];
  }

  const unique = new Map<number, WCProduct>();
  for (const candidate of candidates) {
    if (candidate.id !== product.id && candidate.status === "publish") unique.set(candidate.id, candidate);
  }

  const related = await Promise.all(
    Array.from(unique.values())
      .slice(0, limit)
      .map((candidate) => getProductPageProduct(candidate.slug, lang)),
  );
  return related.filter((candidate): candidate is ProductPageProduct => Boolean(candidate?.images.length));
}

export function formatProductPrice(price: ProductPrice) {
  const formattedAmount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);

  return price.prefix ? `${price.prefix} ${formattedAmount}` : formattedAmount;
}

export function getAvailabilityLabel(availability: ProductAvailability) {
  switch (availability) {
    case "in_stock":
      return "Auf Lager";
    case "out_of_stock":
      return "Aktuell nicht verfügbar";
    default:
      return "Individuell gefertigt nach Bestellung";
  }
}

export function getAvailabilitySchema(availability: ProductAvailability) {
  switch (availability) {
    case "in_stock":
      return "https://schema.org/InStock";
    case "out_of_stock":
      return "https://schema.org/OutOfStock";
    default:
      return "https://schema.org/PreOrder";
  }
}

export function getSiteUrl() {
  return SITE_URL;
}

export function getProductAbsoluteUrl(locale: string, slug: string) {
  return `${SITE_URL}/${locale}/shop/${slug}`;
}

export function getProductImageAbsoluteUrl(src: string) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}
