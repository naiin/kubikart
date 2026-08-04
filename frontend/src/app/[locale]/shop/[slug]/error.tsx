"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ProductUnavailable({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("productPage");

  return (
    <main className="kk-section min-h-[55vh] bg-page">
      <div className="kk-container-reading rounded-kubikart-lg border border-border bg-surface p-6 text-center shadow-kubikart-sm sm:p-10">
        <p className="kk-eyebrow">{t("unavailableEyebrow")}</p>
        <h1 className="kk-heading-2 mt-3">{t("unavailableTitle")}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">{t("unavailableText")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="kk-button-primary">
            {t("retry")}
          </button>
          <Link href="/shop" className="kk-button-secondary">
            {t("backToShop")}
          </Link>
        </div>
      </div>
    </main>
  );
}
