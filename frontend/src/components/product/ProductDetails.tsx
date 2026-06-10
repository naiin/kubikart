import { useTranslations } from "next-intl";
import type { ProductDetailSection } from "@/lib/product-page";

export function ProductDetails({ sections }: { sections: ProductDetailSection[] }) {
  const t = useTranslations("productPage");

  return (
    <section aria-labelledby="produktdetails">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-600">{t("detailsLabel")}</p>
        <h2 id="produktdetails" className="mt-3 text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[38px]">
          {t("detailsTitle")}
        </h2>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <details
            key={section.id}
            open={index === 0}
            className="group rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_12px_36px_rgba(6,20,38,0.04)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-navy-900">
              {section.title}
              <span className="rounded-full bg-cream-50 p-2 text-gray-500 transition group-open:rotate-45">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
                </svg>
              </span>
            </summary>
            <div className="mt-4 space-y-3 text-base leading-7 text-gray-700">
              {section.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
