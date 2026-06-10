"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

const faqKeys = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

export function ShopFAQ() {
  const t = useTranslations("shopPage");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-navy-900 text-center mb-10">{t("faqTitle")}</h2>
        <div className="space-y-3">
          {faqKeys.map((key, i) => (
            <div key={key} className="rounded-[14px] border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-navy-900 hover:bg-cream-50 transition-colors"
                aria-expanded={openIndex === i}
              >
                {t(`${key}_q`)}
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{t(`${key}_a`)}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
