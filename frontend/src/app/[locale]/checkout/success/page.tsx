"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { paymentReturnStateFromIntentStatus, shouldClearCartAfterPayment, type PaymentReturnState } from "@/lib/payment-return";

async function readPaymentState(): Promise<PaymentReturnState> {
  const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!clientSecret || !publishableKey) return "unknown";
  try {
    const stripe = await loadStripe(publishableKey);
    // The query string alone can be edited by anyone; the client secret lets Stripe report the real status.
    const result = await stripe?.retrievePaymentIntent(clientSecret);
    return paymentReturnStateFromIntentStatus(result?.paymentIntent?.status);
  } catch {
    return "unknown";
  }
}

export default function CheckoutSuccessPage() {
  const t = useTranslations("common");
  const [state, setState] = useState<PaymentReturnState>("loading");

  useEffect(() => {
    let active = true;
    void readPaymentState().then((next) => {
      if (!active) return;
      if (shouldClearCartAfterPayment(next)) {
        localStorage.removeItem("kubikart-cart");
        window.dispatchEvent(new Event("cart-updated"));
      }
      setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const paid = state === "succeeded";
  const failed = state === "failed";
  const title = paid ? t("paymentSuccessTitle") : failed ? t("paymentFailed") : state === "processing" ? t("processing") : state === "unknown" ? t("paymentUnknownTitle") : t("checkout");
  const description = paid ? t("paymentSuccessDesc") : state === "processing" ? t("orderPlacedDesc") : failed ? t("paymentFailedDesc") : state === "unknown" ? t("paymentUnknownDesc") : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-20 text-center" aria-live="polite" data-payment-state={state}>
        {paid && (
          <div className="rounded-full bg-green-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {failed && (
          <div className="rounded-full bg-red-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && <p className="text-gray-600 mb-6">{description}</p>}
        {state !== "loading" && (
          <Link
            href={failed ? "/checkout" : "/shop"}
            className="inline-flex items-center rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-500"
          >
            {failed ? t("checkout") : t("continueShopping")}
          </Link>
        )}
      </div>
    </div>
  );
}
