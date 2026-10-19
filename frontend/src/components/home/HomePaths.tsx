import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { normalizeLocale } from "@/lib/seo";
import { canOptimizeImage } from "@/lib/image-optimization";
import { getCategories, getProducts, type WCCategory, type WCProduct } from "@/lib/woocommerce";

const BUSINESS_CATEGORY_SLUGS = new Set(["business-produkte", "business-products"]);
const PERSONAL_CATEGORY_SLUGS = new Set(["personalisierte-geschenke", "personalized-gifts"]);

/**
 * The two customer paths: businesses (packages, individual business products,
 * industry pages, custom enquiries) and personalised gifts. Category ids and
 * gift imagery come from live WooCommerce data; nothing here is hard-coded
 * commercial content.
 */
export async function HomePaths() {
  const [t, rawLocale] = await Promise.all([getTranslations("homeRedesign.paths"), getLocale()]);
  const locale = normalizeLocale(rawLocale);
  let categories: WCCategory[] = [];
  let gifts: WCProduct[] = [];

  try {
    categories = await getCategories(locale);
  } catch {
    categories = [];
  }

  const businessCategory = categories.find((category) => BUSINESS_CATEGORY_SLUGS.has(category.slug));
  const personalCategory = categories.find((category) => PERSONAL_CATEGORY_SLUGS.has(category.slug) && category.count > 0);

  if (personalCategory) {
    try {
      gifts = (await getProducts({ per_page: 3, category: personalCategory.id, status: "publish" }, locale)).filter((product) => product.images[0]);
    } catch {
      gifts = [];
    }
  }

  const productsHref = businessCategory ? `/shop?category=${businessCategory.id}` : "/shop";
  const businessLinks = [
    { href: "/services/brand-kit", title: t("kitsTitle"), text: t("kitsText") },
    { href: productsHref, title: t("productsTitle"), text: t("productsText") },
    { href: "/businesses", title: t("industriesTitle"), text: t("industriesText") },
  ];

  return (
    <section className="kk-section" aria-labelledby="home-paths-heading">
      <div className="kk-container-full">
        <h2 id="home-paths-heading" className="kk-heading-2 max-w-3xl">{t("title")}</h2>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="flex flex-col rounded-kubikart-xl bg-brand p-6 text-white sm:p-9">
            <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("businessEyebrow")}</p>
            <h3 className="mt-3 font-heading text-2xl leading-tight font-bold text-white sm:text-3xl">{t("businessTitle")}</h3>
            <p className="mt-3 max-w-xl leading-7 text-white/75">{t("businessText")}</p>

            <ul className="mt-7 grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {businessLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex h-full min-h-11 flex-col rounded-kubikart-md border border-white/20 p-4 transition-colors hover:border-accent"
                  >
                    <span className="font-heading text-base font-bold text-white">{link.title}</span>
                    <span className="mt-1.5 text-sm leading-6 text-white/70">{link.text}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/sonderanfertigung" className="kk-button kk-button-primary">{t("enquiryCta")}</Link>
              <span className="text-sm text-white/70">{t("enquiryText")}</span>
            </div>
          </article>

          <article className="flex flex-col rounded-kubikart-xl border border-border bg-surface-white p-6 sm:p-9">
            <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{t("giftsEyebrow")}</p>
            <h3 className="mt-3 font-heading text-2xl leading-tight font-bold text-brand sm:text-3xl">{t("giftsTitle")}</h3>
            <p className="mt-3 leading-7 text-muted">{t("giftsText")}</p>

            {gifts.length > 0 ? (
              <ul className="mt-6 grid grid-cols-3 gap-3" aria-label={t("giftsImagesLabel")}>
                {gifts.map((product) => (
                  <li key={product.id}>
                    <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-kubikart-md bg-surface">
                      <Image
                        src={product.images[0].src}
                        alt={product.images[0].alt || product.name}
                        fill
                        sizes="(min-width: 1024px) 9vw, 28vw"
                        className="object-cover"
                        unoptimized={!canOptimizeImage(product.images[0].src)}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <Link href="/personalisierte-geschenke" className="kk-button kk-button-secondary mt-7 self-start">
              {t("giftsCta")}
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
