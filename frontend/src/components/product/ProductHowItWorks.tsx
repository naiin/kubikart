import { useTranslations } from "next-intl";

/** `enquiry` swaps the cart-based steps for the quotation flow of enquiry-only products. */
export function ProductHowItWorks({ enquiry = false }: { enquiry?: boolean }) {
  const t = useTranslations("productPage");

  const prefix = enquiry ? "enquiryStep" : "step";
  const steps = [1, 2, 3, 4].map((number) => ({ title: t(`${prefix}${number}_title`), text: t(`${prefix}${number}_text`) }));

  return (
    <section aria-labelledby="bestellablauf">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-600">{t("orderLabel")}</p>
        <h2 id="bestellablauf" className="mt-3 text-[30px] font-extrabold tracking-[-0.03em] text-navy-900 sm:text-[38px]">
          {t(enquiry ? "enquiryOrderTitle" : "orderTitle")}
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_12px_36px_rgba(6,20,38,0.04)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">{index + 1}</span>
            <h3 className="mt-5 text-lg font-bold text-navy-900">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-gray-700">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
