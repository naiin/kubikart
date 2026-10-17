"use client";

import { useTranslations } from "next-intl";
import { ProductEnquiryForm } from "@/components/ProductEnquiryForm";
import type { CustomSizeKind } from "@/lib/product-page";

const TEXT_KEYS = {
  overall: { title: "customSizeTitle", lead: "customSizeLead" },
  film: { title: "customSizeTitle", lead: "customSizeLeadFilm" },
  format: { title: "customFormatTitle", lead: "customFormatLead" },
  quote: { title: "quoteTitle", lead: "quoteLead" },
} as const;

/**
 * Shown instead of the purchase controls while a request-only variation is selected: a custom size (width and height
 * fields) or, for `quote`, a plain quotation request. `selection` lists the customer's choices for the owner.
 */
export function CustomSizeRequest({
  product,
  kind = "overall",
  selection = [],
}: {
  product: { id: number; slug: string; name: string };
  kind?: CustomSizeKind | "quote";
  selection?: string[];
}) {
  const t = useTranslations("productPage");
  const keys = TEXT_KEYS[kind];

  return (
    <section aria-labelledby="custom-size-heading" className="rounded-kubikart-lg border border-border bg-surface p-5 sm:p-6">
      <h2 id="custom-size-heading" className="font-heading text-xl font-bold text-brand">
        {t(keys.title)}
      </h2>
      <p className="mt-2 mb-5 text-sm leading-6 text-muted">{t(keys.lead)}</p>
      <ProductEnquiryForm
        product={product}
        customSize={kind !== "quote"}
        customSizeKind={kind === "quote" ? "overall" : kind}
        configuration={{ lines: selection, fileTokens: [], validate: () => true }}
        compact
      />
    </section>
  );
}
