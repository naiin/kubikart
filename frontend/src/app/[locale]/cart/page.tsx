"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCartLineId, readCart, useCart, useHasMounted, writeCart } from "@/lib/cart";

export default function CartPage() {
  const t = useTranslations("common");
  const cart = useCart();
  const hasMounted = useHasMounted();

  function updateQuantity(lineId: string, delta: number) {
    const updated = readCart()
      .map((item) => (getCartLineId(item) === lineId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
      .filter((item) => item.quantity > 0);

    writeCart(updated);
  }

  function removeItem(lineId: string) {
    writeCart(readCart().filter((item) => getCartLineId(item) !== lineId));
  }

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  if (!hasMounted) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("cart")}</h1>

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">{t("emptyCart")}</p>
          <Link href="/shop" className="mt-4 inline-flex items-center text-sm font-semibold text-[royalblue] hover:underline">
            ← {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div>
          {/* Cart Items */}
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {cart.map((item) => (
              <div key={getCartLineId(item)} className="flex items-center gap-4 py-4">
                {/* Image */}
                <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={80} height={80} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300">📦</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link href={item.slug ? `/shop/${item.slug}` : "/shop"} className="text-sm font-medium text-gray-900 hover:text-[royalblue]">
                    {item.name}
                  </Link>
                  {item.customizationSummary?.length ? (
                    <div className="mt-1 space-y-1">
                      {item.customizationSummary.map((line) => (
                        <p key={line} className="text-xs text-gray-500">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-sm text-gray-500 mt-1">€{item.price}</p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(getCartLineId(item), -1)}
                    className="h-8 w-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(getCartLineId(item), 1)}
                    className="h-8 w-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                {/* Line Total */}
                <div className="w-20 text-right">
                  <span className="text-sm font-semibold text-gray-900">€{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>

                {/* Remove */}
                <button onClick={() => removeItem(getCartLineId(item))} className="text-gray-400 hover:text-red-500 transition-colors" title={t("remove")}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
              <span>{t("subtotal")}</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t("shipping")} + {t("tax")} wird an der Kasse berechnet.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/checkout"
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-[royalblue] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                {t("proceedToCheckout")}
              </Link>
              <Link
                href="/shop"
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
