"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getCartLineId, readCart, useCart, useHasMounted, writeCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";

type Step = "information" | "shipping" | "payment";

export default function CheckoutPage() {
  const t = useTranslations("common");
  const { user } = useAuth();
  const cart = useCart();
  const hasMounted = useHasMounted();
  const [step, setStep] = useState<Step>("information");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    address: "",
    apartment: "",
    postalCode: "",
    city: "",
    country: "DE",
    phone: "",
    shippingMethod: "standard",
  });

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  // Dynamic shipping rate calculation
  const [shippingRates, setShippingRates] = useState<{ id: string; name: string; price: number; estimatedDays: string }[]>([]);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(90);

  const fetchShippingRates = useCallback(async () => {
    if (cart.length === 0) return;
    setShippingLoading(true);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity, price: item.price })),
          country: form.country,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShippingRates(data.rates || []);
        if (data.freeShippingThreshold) setFreeShippingThreshold(data.freeShippingThreshold);
        // Auto-select first rate if current selection is invalid
        if (data.rates?.length && !data.rates.find((r: { id: string }) => r.id === form.shippingMethod)) {
          setForm((f) => ({ ...f, shippingMethod: data.rates[0].id }));
        }
      }
    } catch {
      // Fallback rates if API fails
      setShippingRates([{ id: "dhl_paket", name: "DHL Paket", price: subtotal >= freeShippingThreshold ? 0 : 5.49, estimatedDays: "3–5" }]);
    } finally {
      setShippingLoading(false);
    }
  }, [cart, form.country, subtotal]);

  useEffect(() => {
    fetchShippingRates();
  }, [fetchShippingRates]);

  const selectedRate = shippingRates.find((r) => r.id === form.shippingMethod) || shippingRates[0];
  const shippingCost = selectedRate?.price ?? 5.49;
  const total = subtotal + shippingCost;

  if (!hasMounted) return null;

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-full bg-green-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bestellung aufgegeben!</h1>
          <p className="text-gray-600 mb-6">Vielen Dank für Ihre Bestellung. Sie erhalten eine Bestätigungsmail.</p>
          <Link href="/shop" className="inline-flex items-center rounded-lg bg-[royalblue] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">{t("emptyCart")}</p>
          <Link href="/shop" className="text-sm font-semibold text-[royalblue] hover:underline">
            ← {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handlePaymentSuccess(details: { method: string; id: string }) {
    // Create WooCommerce order
    try {
      await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            name: item.name,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            customizations: item.customizations,
          })),
          billing: {
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            phone: form.phone,
            address_1: form.address,
            city: form.city,
            postcode: form.postalCode,
            country: form.country,
          },
          shipping: {
            first_name: form.firstName,
            last_name: form.lastName,
            address_1: form.address,
            city: form.city,
            postcode: form.postalCode,
            country: form.country,
          },
          shipping_lines: [
            {
              method_id: selectedRate?.id || "dhl_paket",
              method_title: selectedRate?.name || "DHL Paket",
              total: shippingCost.toFixed(2),
            },
          ],
          payment_method: details.method === "paypal" ? "ppcp-gateway" : "stripe",
          payment_method_title: details.method === "paypal" ? "PayPal" : details.method === "klarna" ? "Klarna" : "Kreditkarte",
          transaction_id: details.id,
          set_paid: true,
        }),
      });
    } catch (err) {
      console.error("Failed to create WC order:", err);
    }

    // Clear cart and show success
    localStorage.removeItem("kubikart-cart");
    window.dispatchEvent(new Event("cart-updated"));
    setOrderPlaced(true);
  }

  const steps: { key: Step; label: string }[] = [
    { key: "information", label: "Information" },
    { key: "shipping", label: "Versand" },
    { key: "payment", label: "Zahlung" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Form */}
          <div className="lg:col-span-7 px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold text-[royalblue]">
              KubikArt
            </Link>

            {/* Breadcrumb Steps */}
            <nav className="mt-6 mb-8">
              <ol className="flex items-center gap-2 text-sm">
                {steps.map((s, i) => (
                  <li key={s.key} className="flex items-center gap-2">
                    {i > 0 && (
                      <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <button
                      onClick={() => {
                        // Only allow jumping to shipping/payment if info is filled
                        if (s.key !== "information" && (!form.email || !form.firstName || !form.lastName || !form.address || !form.postalCode || !form.city))
                          return;
                        setStep(s.key);
                      }}
                      className={`font-medium transition-colors ${step === s.key ? "text-[royalblue]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            <div>
              {/* Step 1: Information */}
              {step === "information" && (
                <div className="space-y-6">
                  {/* Contact */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-gray-900">Kontaktinformationen</h2>
                      {!user && (
                        <Link href="/account" className="text-sm text-[royalblue] hover:underline">
                          {t("login")}
                        </Link>
                      )}
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="E-Mail-Adresse"
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                    />
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Lieferadresse</h2>
                    <div className="space-y-3">
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none bg-white"
                      >
                        <option value="DE">Deutschland</option>
                        <option value="AT">Österreich</option>
                        <option value="CH">Schweiz</option>
                        <option value="NL">Niederlande</option>
                        <option value="FR">Frankreich</option>
                        <option value="BE">Belgien</option>
                      </select>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          placeholder={t("firstName")}
                          required
                          className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                        />
                        <input
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          placeholder={t("lastName")}
                          required
                          className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Straße und Hausnummer"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                      />

                      <input
                        type="text"
                        name="apartment"
                        value={form.apartment}
                        onChange={handleChange}
                        placeholder="Wohnung, Suite, etc. (optional)"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          name="postalCode"
                          value={form.postalCode}
                          onChange={handleChange}
                          placeholder={t("postalCode")}
                          required
                          className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                        />
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder={t("city")}
                          required
                          className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                        />
                      </div>

                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={`${t("phone")} (optional)`}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!form.email || !form.firstName || !form.lastName || !form.address || !form.postalCode || !form.city) return;
                      setStep("shipping");
                    }}
                    disabled={!form.email || !form.firstName || !form.lastName || !form.address || !form.postalCode || !form.city}
                    className="w-full rounded-lg bg-[royalblue] py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Weiter zum Versand →
                  </button>
                </div>
              )}

              {/* Step 2: Shipping */}
              {step === "shipping" && (
                <div className="space-y-6">
                  {/* Summary of address */}
                  <div className="rounded-lg border border-gray-200 p-4 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-500">Kontakt:</span> <span className="text-gray-900">{form.email}</span>
                      </div>
                      <button type="button" onClick={() => setStep("information")} className="text-[royalblue] text-xs hover:underline">
                        Ändern
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div>
                        <span className="text-gray-500">Lieferung an:</span>{" "}
                        <span className="text-gray-900">
                          {form.address}, {form.postalCode} {form.city}
                        </span>
                      </div>
                      <button type="button" onClick={() => setStep("information")} className="text-[royalblue] text-xs hover:underline">
                        Ändern
                      </button>
                    </div>
                  </div>

                  {/* Shipping methods */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Versandart</h2>
                    <div className="space-y-2">
                      {shippingLoading ? (
                        <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500 text-center">Versandkosten werden berechnet…</div>
                      ) : (
                        shippingRates.map((rate) => (
                          <label
                            key={rate.id}
                            className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${form.shippingMethod === rate.id ? "border-[royalblue] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shippingMethod"
                                value={rate.id}
                                checked={form.shippingMethod === rate.id}
                                onChange={handleChange}
                                className="text-[royalblue]"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{rate.name}</p>
                                <p className="text-xs text-gray-500">{rate.estimatedDays} Werktage</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{rate.price === 0 ? "Kostenlos" : `€${rate.price.toFixed(2)}`}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("information")}
                      className="flex-1 rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ← Zurück
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("payment")}
                      className="flex-1 rounded-lg bg-[royalblue] py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      Weiter zur Zahlung →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === "payment" && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="rounded-lg border border-gray-200 p-4 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-500">Kontakt:</span> <span className="text-gray-900">{form.email}</span>
                      </div>
                      <button type="button" onClick={() => setStep("information")} className="text-[royalblue] text-xs hover:underline">
                        Ändern
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div>
                        <span className="text-gray-500">Lieferung an:</span>{" "}
                        <span className="text-gray-900">
                          {form.address}, {form.postalCode} {form.city}
                        </span>
                      </div>
                      <button type="button" onClick={() => setStep("information")} className="text-[royalblue] text-xs hover:underline">
                        Ändern
                      </button>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div>
                        <span className="text-gray-500">Versand:</span>{" "}
                        <span className="text-gray-900">
                          {selectedRate ? `${selectedRate.name} (${selectedRate.estimatedDays} Werktage)` : "Standard (3–5 Werktage)"}
                        </span>
                      </div>
                      <button type="button" onClick={() => setStep("shipping")} className="text-[royalblue] text-xs hover:underline">
                        Ändern
                      </button>
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Zahlungsart</h2>
                    {paymentError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{paymentError}</div>}
                    <CheckoutPayment total={total} onSuccess={handlePaymentSuccess} onError={(msg) => setPaymentError(msg)} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("shipping")}
                    className="w-full rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ← Zurück
                  </button>
                </div>
              )}
            </div>

            {/* Footer links */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-500">
              <Link href="/legal/agb" className="hover:text-gray-700">
                AGB
              </Link>
              <Link href="/legal/datenschutz" className="hover:text-gray-700">
                Datenschutz
              </Link>
              <Link href="/legal/widerruf" className="hover:text-gray-700">
                Widerruf
              </Link>
              <Link href="/legal/impressum" className="hover:text-gray-700">
                Impressum
              </Link>
            </div>
          </div>

          {/* Right: Order Summary (sticky) */}
          <div className="lg:col-span-5 bg-gray-100 border-l border-gray-200 px-4 sm:px-8 lg:px-10 py-8 lg:py-12">
            <div className="lg:sticky lg:top-8">
              {/* Items */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={getCartLineId(item)} className="flex gap-3">
                    <Link
                      href={item.slug ? `/shop/${item.slug}` : "/shop"}
                      className="relative h-16 w-16 shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden"
                    >
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill unoptimized sizes="64px" className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-300">📦</div>
                      )}
                      <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={item.slug ? `/shop/${item.slug}` : "/shop"}
                          className="text-sm font-medium text-gray-900 truncate hover:text-navy-900 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => writeCart(readCart().filter((c) => getCartLineId(c) !== getCartLineId(item)))}
                          className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Entfernen"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {item.customizationSummary?.length ? (
                        <div className="mt-1 space-y-0.5">
                          {item.customizationSummary.map((line, i) => (
                            <p key={i} className="text-[11px] text-gray-500">
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium text-gray-900 shrink-0">€{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-gray-300 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("subtotal")}</span>
                  <span className="text-gray-900">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("shipping")}</span>
                  <span className="text-gray-900">
                    {shippingLoading ? "Wird berechnet…" : shippingCost === 0 ? t("freeShipping") : `€${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-300">
                  <span>{t("total")}</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-gray-500 pt-1">Gem. § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).</p>
              </div>

              {/* Free shipping notice */}
              {subtotal < freeShippingThreshold && shippingCost > 0 && (
                <p className="mt-4 text-xs text-gray-500 text-center">Noch €{(freeShippingThreshold - subtotal).toFixed(2)} bis zum kostenlosen Versand!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
