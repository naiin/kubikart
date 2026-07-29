import { getLocale, getTranslations } from "next-intl/server";
import { BusinessKitCard } from "@/components/business-kits/BusinessKitCard";
import { Link } from "@/i18n/navigation";
import { getBusinessKits } from "@/lib/business-kits";
import { normalizeLocale } from "@/lib/seo";
import type { WCProduct } from "@/lib/woocommerce";

export async function FeaturedKits() {
  const [t, rawLocale] = await Promise.all([getTranslations("homeRedesign.kits"), getLocale()]);
  const locale = normalizeLocale(rawLocale);
  let kits: WCProduct[] = [];

  try {
    const result = await getBusinessKits(locale);
    kits = result.products.slice(0, 3);
  } catch {
    kits = [];
  }

  return (
    <section className="kk-section-major">
      <div className="kk-container-full">
        <div className="max-w-3xl">
          <p className="kk-eyebrow">{t("eyebrow")}</p>
          <h2 className="kk-heading-2 mt-3">{t("title")}</h2>
          <p className="kk-body mt-4 text-muted">{t("body")}</p>
        </div>

        {kits.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {kits.map((kit) => <BusinessKitCard key={kit.id} product={kit} locale={locale} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-kubikart-lg border border-border bg-surface p-6">
            <p className="text-muted">{t("unavailable")}</p>
          </div>
        )}

        <div className="mt-8">
          <Link href="/services/brand-kit" className="kk-link inline-flex min-h-11 items-center gap-2 font-semibold">
            {t("allLink")}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
