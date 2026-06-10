import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProductPageProduct } from "@/lib/product-page";

export function ProductLeadCTA({ product }: { product: ProductPageProduct }) {
  const t = useTranslations("productPage");

  return (
    <section id="sonderwunsch" aria-labelledby="sonderwunsch-heading" className="scroll-mt-28">
      <div className="overflow-hidden rounded-[32px] bg-navy-900 px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-500">{t("ctaLabel")}</p>
          <h2 id="sonderwunsch-heading" className="mt-4 text-[30px] font-extrabold tracking-[-0.03em] sm:text-[38px]">
            {t("ctaTitle")}
          </h2>
          <p className="mt-4 text-base leading-8 text-white/78">{t("ctaText", { name: product.name })}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={product.customRequestHref}
            className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3.5 text-sm font-bold text-navy-900 transition hover:bg-accent-600"
          >
            {t("ctaButton")}
          </a>
          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            {t("ctaServicesLink")}
          </Link>
        </div>
      </div>
    </section>
  );
}
