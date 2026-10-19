"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";

interface Order {
  id: number;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items: Array<{ id: number; name: string; quantity: number; total: string }>;
}

export default function OrdersPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { user, loading } = useAuth();
  const [ordersResult, setOrdersResult] = useState<{ customerId: number; orders: Order[]; error?: boolean } | null>(null);
  const activeCustomerId = user?.id ?? null;
  const orders = ordersResult?.customerId === activeCustomerId ? ordersResult.orders : [];
  const fetching = Boolean(activeCustomerId) && ordersResult?.customerId !== activeCustomerId;

  useEffect(() => {
    if (!activeCustomerId || ordersResult?.customerId === activeCustomerId) {
      return;
    }

    let cancelled = false;

    fetch("/api/orders", { credentials: "same-origin" })
      .then((res) => { if (!res.ok) throw new Error("Orders unavailable"); return res.json(); })
      .then((data) => {
        if (!cancelled) {
          setOrdersResult({
            customerId: activeCustomerId,
            orders: data.orders || [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrdersResult({
            customerId: activeCustomerId,
            orders: [],
            error: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCustomerId, ordersResult?.customerId]);

  if (loading || fetching) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-gray-500">{tc("loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{t("pleaseLogin")}</p>
        <Link href="/account" className="text-sm font-semibold text-navy-900 hover:underline">
          {tc("login")} →
        </Link>
      </div>
    );
  }

  if (ordersResult?.customerId === activeCustomerId && ordersResult.error) {
    return <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-brand">{t("orderHistory")}</h1>
      <p role="alert" className="my-4 text-danger">{locale === "en" ? "Your orders could not be loaded. Please retry, or sign in again if your session expired." : "Deine Bestellungen konnten nicht geladen werden. Bitte versuche es erneut oder melde dich bei abgelaufener Sitzung wieder an."}</p>
      <button type="button" onClick={() => setOrdersResult(null)} className="min-h-11 rounded-md border border-brand px-4 text-brand">{locale === "en" ? "Retry" : "Erneut versuchen"}</button>
      <Link href="/account" className="ml-4 underline">{tc("login")}</Link>
    </div>;
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    "on-hold": "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("orderHistory")}</h1>
        <Link href="/account" className="text-sm text-navy-900 hover:underline">
          ← {t("dashboard")}
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4 text-gray-500">{t("noOrders")}</p>
          <Link href="/shop" className="mt-4 inline-flex items-center text-sm font-semibold text-navy-900 hover:underline">
            {tc("continueShopping")} →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{new Date(order.date_created).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE")}</span>
                  <span className="font-semibold text-gray-900">€{order.total}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <ul className="space-y-1">
                  {order.line_items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-gray-900">€{item.total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
