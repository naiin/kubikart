import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductJsonLd } from "@/components/product/ProductJsonLd";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { getProductAbsoluteUrl, getProductImageAbsoluteUrl, getProductPageProduct, getRelatedProducts } from "@/lib/product-page";
import { getProductReviews, type WCReview } from "@/lib/woocommerce";

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
    return {
      title: "Produkt | Kubikart",
    };
  }

  const canonical = getProductAbsoluteUrl(locale, product.slug);
  const primaryImage = product.images[0];

  return {
    title: product.seoTitle,
    description: product.seoDescription,
    alternates: {
      canonical,
    },
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

  let reviews: WCReview[] = [];
  try {
    reviews = await getProductReviews(product.id);
  } catch {
    reviews = [];
  }

  const relatedProducts = getRelatedProducts(product);

  return (
    <>
      <ProductJsonLd product={product} locale={locale} />
      <ProductPageClient product={product} reviews={reviews} relatedProducts={relatedProducts} />
    </>
  );
}
