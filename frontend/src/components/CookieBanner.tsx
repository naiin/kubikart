"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getConsent, getServerConsent, setConsent, subscribeToConsent } from "@/lib/cookie-consent";
import { filterMeasurementUrl } from "@/lib/analytics-privacy";

export function CookieBanner() {
  const t = useTranslations("cookie");
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, getServerConsent);

  if (consent !== null) {
    // A previously loaded script can outlive the component after consent changes.
    return consent === "all" ? <Analytics beforeSend={(event) => getConsent() === "all" ? filterMeasurementUrl(event) : null} /> : null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
            <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
            <Link href="/legal/datenschutz#vercel-analytics" className="kk-link mt-2 inline-flex min-h-11 items-center text-sm">
              {t("privacyLink")}
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
            <button
              onClick={() => setConsent("essential")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("essentialOnly")}
            </button>
            <button onClick={() => setConsent("all")} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors">
              {t("acceptAll")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
