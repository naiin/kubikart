import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductJsonLd } from "@/components/product/ProductJsonLd";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import {
  getOtherBusinessKits,
  isBusinessKitProduct,
  isWooCommercePlaceholderImage,
} from "@/lib/business-kits";
import {
  getProductAbsoluteUrl,
  getProductImageAbsoluteUrl,
  getProductPageProduct,
  getRelatedProducts,
  type ProductPageProduct,
} from "@/lib/product-page";
import { getProduct, getProductReviews, type WCProduct, type WCReview } from "@/lib/woocommerce";
import { getRobotsMetadata } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductPageProduct(slug, locale);

  if (!product) {
    notFound();
  }

  const canonical = getProductAbsoluteUrl(locale, product.slug);
  const siteLocale = locale === "en" ? "en" : "de";
  const businessKit = isBusinessKitProduct(product, siteLocale);
  const primaryImage = product.images.find(
    (image) => !businessKit || !isWooCommercePlaceholderImage(image),
  );
  const languages: Record<string, string> = {
    [locale]: canonical,
  };

  if (product.translations?.de && locale !== "de") {
    try {
      const germanProduct = await getProduct(product.translations.de, "de");
      languages.de = getProductAbsoluteUrl("de", germanProduct.slug);
    } catch {
      // Keep the available product URL only when the alternate lookup fails.
    }
  }

  if (product.translations?.en && locale !== "en") {
    try {
      const englishProduct = await getProduct(product.translations.en, "en");
      languages.en = getProductAbsoluteUrl("en", englishProduct.slug);
    } catch {
      // Keep the available product URL only when the alternate lookup fails.
    }
  }

  if (languages.de) {
    languages["x-default"] = languages.de;
  }

  return {
    title: product.seoTitle,
    description: product.seoDescription,
    alternates: {
      canonical,
      languages,
    },
    robots: getRobotsMetadata(),
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      url: canonical,
      siteName: "Kubikart",
      locale: locale === "de" ? "de_DE" : "en_US",
      type: "website",
      images: primaryImage
        ? [
            {
              url: getProductImageAbsoluteUrl(primaryImage.src),
              alt: primaryImage.alt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: primaryImage ? "summary_large_image" : "summary",
      title: product.seoTitle,
      description: product.seoDescription,
      images: primaryImage ? [getProductImageAbsoluteUrl(primaryImage.src)] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  const product = await getProductPageProduct(slug, locale);

  if (!product) {
    notFound();
  }

  // Redirect to the correct slug for this locale (e.g. English slug in German context)
  if (product.slug !== slug) {
    redirect(`/${locale}/shop/${product.slug}`);
  }

  const siteLocale = locale === "en" ? "en" : "de";
  const businessKit = isBusinessKitProduct(product, siteLocale);

  let reviews: WCReview[] = [];
  try {
    reviews = await getProductReviews(product.id);
  } catch {
    reviews = [];
  }

  let relatedProducts: ProductPageProduct[] = [];
  let otherBusinessKits: WCProduct[] = [];
  if (businessKit) {
    try {
      otherBusinessKits = await getOtherBusinessKits(
        siteLocale,
        product.id,
        product.relatedProductIds,
      );
    } catch (error) {
      console.error("Unable to load localized Business Kits for the product presentation.", error);
    }
  } else {
    try {
      relatedProducts = await getRelatedProducts(product, locale);
    } catch {
      relatedProducts = [];
    }
  }

  return (
    <>
      <ProductJsonLd product={product} locale={locale} businessKit={businessKit} />
      <ProductPageClient
        product={product}
        reviews={reviews}
        relatedProducts={relatedProducts}
        presentation={businessKit ? "business-kit" : "standard"}
        otherBusinessKits={otherBusinessKits}
      />
    </>
  );
}
