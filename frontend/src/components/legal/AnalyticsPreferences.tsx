"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getConsent, getServerConsent, setConsent, subscribeToConsent } from "@/lib/cookie-consent";

export function AnalyticsPreferences() {
  const t = useTranslations("vercelPrivacy.preferences");
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, getServerConsent);

  return (
    <div id="analytics-preferences" className="not-prose mt-6 rounded-kubikart-md border border-border bg-surface p-5">
      <h3 className="font-semibold text-brand">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted">{t("description")}</p>
      <p role="status" className="mt-3 text-sm text-brand">
        {t(consent === undefined ? "loading" : consent === "all" ? "enabled" : "disabled")}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => setConsent("essential")} className="kk-button kk-button-secondary">
          {t("reject")}
        </button>
        <button type="button" onClick={() => setConsent("all")} className="kk-button kk-button-secondary">
          {t("allow")}
        </button>
      </div>
    </div>
  );
}
