import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ShopBusinessKitsPromo() {
  const t = useTranslations("shopPage");

  return (
    <section className="kk-section bg-brand text-white">
      <div className="kk-container-full grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">{t("kitsEyebrow")}</p>
          <h2 className="mt-2 font-heading text-2xl leading-tight font-bold text-white sm:text-3xl">{t("kitsTitle")}</h2>
          <p className="mt-3 text-base leading-7 text-white/75">{t("kitsText")}</p>
        </div>
        <Link href="/services/brand-kit" className="kk-button kk-button-primary justify-self-start md:justify-self-end">
          {t("kitsCta")}
        </Link>
      </div>
    </section>
  );
}
