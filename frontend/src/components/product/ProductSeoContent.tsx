import { useTranslations } from "next-intl";
import type { ProductSeoContent as ProductSeoContentData } from "@/lib/product-page";

export function ProductSeoContent({ content }: { content: ProductSeoContentData }) {
  const t = useTranslations("productPage");

  return (
    <section aria-labelledby="seo-content-heading" className="rounded-[32px] border border-gray-200 bg-cream-50 p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-600">{t("seoLabel")}</p>
      <h2 id="seo-content-heading" className="mt-3 text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[38px]">
        {content.title}
      </h2>
      <div className="mt-5 max-w-4xl space-y-4 text-base leading-8 text-gray-700">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
