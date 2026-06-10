import { useTranslations } from "next-intl";
import type { ProductFaq } from "@/lib/product-page";

export function ProductFAQ({ faqs }: { faqs: ProductFaq[] }) {
  const t = useTranslations("productPage");

  return (
    <section aria-labelledby="faq-heading">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-600">FAQ</p>
        <h2 id="faq-heading" className="mt-3 text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[38px]">
          {t("faqTitle")}
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={faq.question}
            open={index === 0}
            className="rounded-[24px] border border-gray-200 bg-white px-6 py-5 shadow-[0_12px_36px_rgba(6,20,38,0.04)]"
          >
            <summary className="cursor-pointer list-none text-base font-bold text-navy-900">{faq.question}</summary>
            <p className="mt-3 text-sm leading-7 text-gray-700">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
