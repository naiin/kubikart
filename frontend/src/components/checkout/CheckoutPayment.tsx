"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PaymentMethod = "card" | "klarna" | "paypal";

interface CheckoutPaymentProps {
  orderId: number;
  orderKey: string;
  onSuccess: (details: { method: PaymentMethod; id: string }) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

/* ─── Stripe Form (card + klarna) ─── */
function StripeForm({ onSuccess, onError, method }: { onSuccess: (id: string) => void; onError: (msg: string) => void; method: "card" | "klarna" }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const t = useTranslations("common");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || t("paymentFailed"));
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      // For Klarna, redirect happens automatically
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
          defaultValues: { billingDetails: { address: { country: "DE" } } },
          paymentMethodOrder: method === "klarna" ? ["klarna", "card"] : ["card", "klarna"],
        }}
      />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-accent-600 py-3.5 text-sm font-semibold text-white hover:bg-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("processing")}
          </span>
        ) : method === "klarna" ? (
          t("payWithKlarna")
        ) : (
          t("payNow")
        )}
      </button>
    </form>
  );
}

/* ─── Express Checkout (Apple Pay / Google Pay) ─── */
function ExpressCheckout({ onSuccess, onError }: { onSuccess: (id: string) => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("common");

  return (
    <ExpressCheckoutElement
      options={{
        buttonType: { applePay: "buy", googlePay: "buy" },
      }}
      onConfirm={async () => {
        if (!stripe || !elements) return;
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: `${window.location.origin}/checkout/success` },
          redirect: "if_required",
        });
        if (error) {
          onError(error.message || t("paymentFailed"));
        } else if (paymentIntent?.status === "succeeded") {
          onSuccess(paymentIntent.id);
        }
      }}
    />
  );
}

/* ─── Main Payment Component ─── */
export default function CheckoutPayment({ orderId, orderKey, onSuccess, onError, disabled }: CheckoutPaymentProps) {
  const t = useTranslations("common");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [clientSecretKey, setClientSecretKey] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const pricingKey = JSON.stringify({ orderId, orderKey });
  const activeClientSecret = clientSecretKey === pricingKey ? clientSecret : null;

  // Auto-initialize Stripe on mount for express checkout (Apple Pay/Google Pay)
  useEffect(() => {
    void initStripe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingKey]);

  // Create Stripe PaymentIntent when card/klarna is selected
  async function initStripe() {
    setLoadingIntent(true);
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderKey,
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setClientSecretKey(pricingKey);
      } else {
        onError(t("paymentInitializationFailed"));
      }
    } catch {
      onError(t("paymentNetworkError"));
    }
    setLoadingIntent(false);
  }

  function selectMethod(m: PaymentMethod) {
    setMethod(m);
    if ((m === "card" || m === "klarna") && !activeClientSecret) {
      void initStripe();
    }
  }

  const methodOptions: { key: PaymentMethod; label: string; desc: string; icon: string }[] = [
    { key: "card", label: t("paymentCard"), desc: t("paymentCardDescription"), icon: "💳" },
    { key: "klarna", label: "Klarna", desc: t("paymentKlarnaDescription"), icon: "🟡" },
    { key: "paypal", label: "PayPal", desc: t("paymentPayPalDescription"), icon: "🅿️" },
  ];

  return (
    <div className="space-y-4">
      {/* Express Checkout: Apple Pay / Google Pay */}
      {activeClientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: activeClientSecret,
            appearance: { theme: "stripe", variables: { colorPrimary: "#4169E1" } },
          }}
        >
          <ExpressCheckout onSuccess={(id) => onSuccess({ method: "card", id })} onError={onError} />
        </Elements>
      )}
      {!activeClientSecret && !loadingIntent && (
        <button
          type="button"
          onClick={() => void initStripe()}
          className="w-full rounded-lg border border-gray-200 py-3 text-sm text-gray-500 hover:border-gray-300 transition-colors"
        >
          {t("paymentLoadingWallets")}
        </button>
      )}
      {loadingIntent && !activeClientSecret && (
        <div className="flex items-center justify-center py-3">
          <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-500">{t("paymentOr")}</span>
        </div>
      </div>

      {/* Method selector */}
      <fieldset className="space-y-2">
        <legend className="sr-only">{t("checkoutPaymentMethod")}</legend>
        {methodOptions.map((opt) => (
          <label
            key={opt.key}
            className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              method === opt.key ? "border-accent-600 bg-accent-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={opt.key}
              checked={method === opt.key}
              onChange={() => selectMethod(opt.key)}
              className="text-navy-900"
              disabled={disabled}
            />
            <span className="text-lg" aria-hidden="true">{opt.icon}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </fieldset>

      {/* Payment form area */}
      <div className="mt-4">
        {/* Stripe (card / klarna) */}
        {(method === "card" || method === "klarna") && (
          <>
            {loadingIntent && (
              <div className="flex items-center justify-center py-8">
                <svg className="h-6 w-6 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
            {activeClientSecret && !loadingIntent && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: activeClientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: { colorPrimary: "#4169E1" },
                  },
                }}
              >
                <StripeForm method={method} onSuccess={(id) => onSuccess({ method, id })} onError={onError} />
              </Elements>
            )}
          </>
        )}

        {/* PayPal */}
        {method === "paypal" && (
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
              currency: "EUR",
              intent: "capture",
            }}
          >
            <PayPalButtons
              fundingSource={FUNDING.PAYPAL}
              style={{ layout: "vertical", shape: "rect", label: "pay" }}
              disabled={disabled}
              createOrder={async () => {
                const response = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId, orderKey }),
                });
                const order = await response.json();
                if (!response.ok || !order.id) throw new Error(t("paymentInitializationFailed"));
                return order.id;
              }}
              onApprove={async (data) => {
                const response = await fetch("/api/paypal/capture-order", {
                  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderID: data.orderID }),
                });
                const details = await response.json();
                if (response.ok && details.status === "COMPLETED") {
                  onSuccess({ method: "paypal", id: details.id });
                } else {
                  onError(t("paymentPayPalIncomplete"));
                }
              }}
              onError={(err) => {
                onError(String(err));
              }}
            />
          </PayPalScriptProvider>
        )}
      </div>
    </div>
  );
}
