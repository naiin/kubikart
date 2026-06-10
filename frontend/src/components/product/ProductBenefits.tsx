import { useTranslations } from "next-intl";
import type { ProductBenefit } from "@/lib/product-page";

export function ProductBenefits({ benefits }: { benefits: ProductBenefit[] }) {
  const t = useTranslations("productPage");

  return (
    <section aria-labelledby="produktvorteile">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-600">{t("benefitsLabel")}</p>
        <h2 id="produktvorteile" className="mt-3 text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[38px]">
          {t("benefitsTitle")}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {benefits.map((benefit) => (
          <article key={benefit.title} className="rounded-[28px] border border-gray-200 bg-cream-50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-accent-600 shadow-sm" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2l2.472 5.007L18 7.818l-4 3.898.944 5.532L10 14.7l-4.944 2.548L6 11.716 2 7.818l5.528-.811L10 2z" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-bold text-navy-900">{benefit.title}</h3>
            <p className="mt-3 text-sm leading-7 text-gray-700">{benefit.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
