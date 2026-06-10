"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useHasMounted } from "@/lib/cart";

export function CookieBanner() {
  const t = useTranslations("cookie");
  const hasMounted = useHasMounted();
  const [dismissed, setDismissed] = useState(false);

  const visible = hasMounted && !dismissed && !localStorage.getItem("kubikart-cookie-consent");

  function acceptAll() {
    localStorage.setItem("kubikart-cookie-consent", "all");
    setDismissed(true);
  }

  function acceptEssential() {
    localStorage.setItem("kubikart-cookie-consent", "essential");
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
            <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
            <button
              onClick={acceptEssential}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("essentialOnly")}
            </button>
            <button onClick={acceptAll} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors">
              {t("acceptAll")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
