"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function CheckoutSuccessPage() {
  const t = useTranslations("common");

  useEffect(() => {
    // Clear cart on success page load
    localStorage.removeItem("kubikart-cart");
    window.dispatchEvent(new Event("cart-updated"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-full bg-green-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("paymentSuccessTitle")}</h1>
        <p className="text-gray-600 mb-6">{t("paymentSuccessDesc")}</p>
        <Link href="/shop" className="inline-flex items-center rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-500">
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
