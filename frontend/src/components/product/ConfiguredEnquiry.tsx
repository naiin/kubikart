"use client";

import { useTranslations } from "next-intl";
import { ProductEnquiryForm } from "@/components/ProductEnquiryForm";

/** Shown instead of the purchase controls on an enquiry-only product that has its own fields. */
export function ConfiguredEnquiry({
  product,
  configuration,
}: {
  product: { id: number; slug: string; name: string };
  configuration: { lines: string[]; fileTokens: string[]; validate: () => boolean; busy?: boolean };
}) {
  const t = useTranslations("productPage");

  return (
    <section aria-labelledby="configured-enquiry-heading" className="rounded-kubikart-lg border border-border bg-surface p-5 sm:p-6">
      <h2 id="configured-enquiry-heading" className="mb-2 font-heading text-xl font-bold text-brand">
        {t("enquiryConfigTitle")}
      </h2>
      <ProductEnquiryForm product={product} configuration={configuration} compact />
    </section>
  );
}
