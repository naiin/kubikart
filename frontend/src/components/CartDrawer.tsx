"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCartLineId, readCart, useCart, useHasMounted, writeCart } from "@/lib/cart";

export function CartDrawer() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const hasMounted = useHasMounted();

  useEffect(() => {
    function onCartUpdated() {
      const cart = JSON.parse(localStorage.getItem("kubikart-cart") || "[]");
      if (cart.length > 0) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    }

    function onToggleCart() {
      setOpen((prev) => !prev);
    }

    window.addEventListener("cart-updated", onCartUpdated);
    window.addEventListener("toggle-cart", onToggleCart);

    return () => {
      window.removeEventListener("cart-updated", onCartUpdated);
      window.removeEventListener("toggle-cart", onToggleCart);
    };
  }, []);

  function updateQuantity(lineId: string, delta: number) {
    const updated = readCart()
      .map((item) => (getCartLineId(item) === lineId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
      .filter((item) => item.quantity > 0);

    writeCart(updated);
  }

  function removeItem(lineId: string) {
    writeCart(readCart().filter((item) => getCartLineId(item) !== lineId));
  }

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price || "0") * item.quantity, 0);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Cart Icon Button for Header */}
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-cream-50 hover:text-navy-900"
        aria-label="Warenkorb öffnen"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
        {itemCount > 0 && (
          <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold leading-none text-white">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      {/* Portal: Overlay + Drawer rendered outside header */}
      {hasMounted &&
        createPortal(
          <>
            {/* Overlay */}
            {open && <div className="fixed inset-0 z-[9998] bg-black/40 transition-opacity" onClick={() => setOpen(false)} />}

            {/* Drawer */}
            <div
              className={`fixed top-0 right-0 z-[9999] h-full w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
                open ? "translate-x-0" : "translate-x-full pointer-events-none"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("cart")} ({itemCount})
                </h2>
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                    <p className="mt-4 text-gray-500">{t("emptyCart")}</p>
                    <button onClick={() => setOpen(false)} className="mt-4 text-sm font-medium text-[royalblue] hover:underline">
                      {t("continueShopping")}
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {cart.map((item) => (
                      <li key={getCartLineId(item)} className="relative flex gap-3 py-4">
                        {/* Image */}
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} width={64} height={64} unoptimized className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate pr-6">{item.name}</p>
                          {item.customizationSummary?.length ? (
                            <div className="mt-1 space-y-0.5">
                              {item.customizationSummary.map((line, i) => (
                                <p key={i} className="text-[11px] text-gray-500 line-clamp-1">
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(getCartLineId(item), -1)}
                                className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(getCartLineId(item), 1)}
                                className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">€{(parseFloat(item.price || "0") * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Remove button – top right */}
                        <button
                          onClick={() => removeItem(getCartLineId(item))}
                          className="absolute top-4 right-0 rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Entfernen"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                  <div className="flex justify-between text-base font-semibold text-gray-900 mb-1">
                    <span>{t("subtotal")}</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <p className="mb-4 text-[11px] text-gray-500">Alle Preise gem. § 19 UStG ohne MwSt. · zzgl. Versandkosten</p>
                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-lg bg-[royalblue] py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    {t("proceedToCheckout")}
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setOpen(false)}
                    className="block w-full mt-2 rounded-lg border border-gray-300 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t("cart")}
                  </Link>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
