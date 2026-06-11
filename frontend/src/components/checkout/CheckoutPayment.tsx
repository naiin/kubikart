"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PaymentMethod = "card" | "klarna" | "paypal";

interface CheckoutPaymentProps {
  total: number; // in EUR, e.g. 49.99
  onSuccess: (details: { method: PaymentMethod; id: string }) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

/* ─── Stripe Form (card + klarna) ─── */
function StripeForm({ onSuccess, onError, method }: { onSuccess: (id: string) => void; onError: (msg: string) => void; method: "card" | "klarna" }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

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
      onError(error.message || "Payment failed");
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
        className="w-full rounded-lg bg-[royalblue] py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Verarbeitung…
          </span>
        ) : method === "klarna" ? (
          "Mit Klarna bezahlen"
        ) : (
          "Jetzt bezahlen"
        )}
      </button>
    </form>
  );
}

/* ─── Express Checkout (Apple Pay / Google Pay) ─── */
function ExpressCheckout({ onSuccess, onError }: { onSuccess: (id: string) => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();

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
          onError(error.message || "Payment failed");
        } else if (paymentIntent?.status === "succeeded") {
          onSuccess(paymentIntent.id);
        }
      }}
    />
  );
}

/* ─── Main Payment Component ─── */
export default function CheckoutPayment({ total, onSuccess, onError, disabled }: CheckoutPaymentProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Auto-initialize Stripe on mount for express checkout (Apple Pay/Google Pay)
  useEffect(() => {
    void initStripe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create Stripe PaymentIntent when card/klarna is selected
  async function initStripe() {
    setLoadingIntent(true);
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100), // cents
          currency: "eur",
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        onError("Failed to initialize payment");
      }
    } catch {
      onError("Network error initializing payment");
    }
    setLoadingIntent(false);
  }

  function selectMethod(m: PaymentMethod) {
    setMethod(m);
    if ((m === "card" || m === "klarna") && !clientSecret) {
      void initStripe();
    }
  }

  const methodOptions: { key: PaymentMethod; label: string; desc: string; icon: string }[] = [
    { key: "card", label: "Kreditkarte", desc: "Visa, Mastercard, AMEX", icon: "💳" },
    { key: "klarna", label: "Klarna", desc: "Sofort bezahlen oder in Raten", icon: "🟡" },
    { key: "paypal", label: "PayPal", desc: "Mit PayPal-Konto bezahlen", icon: "🅿️" },
  ];

  return (
    <div className="space-y-4">
      {/* Express Checkout: Apple Pay / Google Pay */}
      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: "stripe", variables: { colorPrimary: "#4169E1" } },
          }}
        >
          <ExpressCheckout onSuccess={(id) => onSuccess({ method: "card", id })} onError={onError} />
        </Elements>
      )}
      {!clientSecret && !loadingIntent && (
        <button
          type="button"
          onClick={() => void initStripe()}
          className="w-full rounded-lg border border-gray-200 py-3 text-sm text-gray-500 hover:border-gray-300 transition-colors"
        >
          Apple Pay / Google Pay laden…
        </button>
      )}
      {loadingIntent && !clientSecret && (
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
          <span className="bg-white px-3 text-gray-500">oder</span>
        </div>
      </div>

      {/* Method selector */}
      <div className="space-y-2">
        {methodOptions.map((opt) => (
          <label
            key={opt.key}
            className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              method === opt.key ? "border-[royalblue] bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={opt.key}
              checked={method === opt.key}
              onChange={() => selectMethod(opt.key)}
              className="text-[royalblue]"
              disabled={disabled}
            />
            <span className="text-lg">{opt.icon}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

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
            {clientSecret && !loadingIntent && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
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
              createOrder={(_data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "EUR",
                        value: total.toFixed(2),
                      },
                      description: "KubiKart Bestellung",
                    },
                  ],
                });
              }}
              onApprove={async (_data, actions) => {
                const details = await actions.order!.capture();
                if (details.status === "COMPLETED") {
                  onSuccess({ method: "paypal", id: details.id! });
                } else {
                  onError("PayPal payment was not completed");
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
