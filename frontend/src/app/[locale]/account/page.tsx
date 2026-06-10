"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

export default function AccountPage() {
  const t = useTranslations("common");
  const ta = useTranslations("account");
  const { user, loading, login, register, logout } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  // Logged in - show account dashboard
  if (user) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{ta("title")}</h1>
          <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
            {t("logout")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="space-y-1">
              <Link href="/account" className="block px-4 py-2.5 text-sm font-medium rounded-lg bg-[royalblue] text-white">
                {ta("dashboard")}
              </Link>
              <Link href="/account/orders" className="block px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                {ta("orderHistory")}
              </Link>
            </nav>
          </aside>

          {/* Dashboard */}
          <div className="md:col-span-3">
            <div className="rounded-xl border border-gray-200 p-6">
              <p className="text-gray-600">
                {ta("dashboard")} — {user.firstName} {user.lastName} ({user.email})
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-[royalblue] transition-colors"
                >
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ta("orderHistory")}</p>
                    <p className="text-xs text-gray-500">Bestellungen ansehen</p>
                  </div>
                </Link>
                <Link href="/shop" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-[royalblue] transition-colors">
                  <span className="text-2xl">🛍️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t("shop")}</p>
                    <p className="text-xs text-gray-500">{t("continueShopping")}</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - show login/register form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    let result;
    if (mode === "login") {
      result = await login(email, password);
    } else {
      result = await register({ email, password, firstName, lastName });
    }

    setSubmitting(false);
    if (result.success) {
      router.push("/account");
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="text-3xl font-bold text-[royalblue]">
          KubikArt
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">{mode === "login" ? t("login") : t("register")}</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("firstName")}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("lastName")}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">{t("password")}</label>
            {mode === "login" && (
              <Link href="/account/forgot-password" className="text-xs font-medium text-[royalblue] hover:underline">
                {ta("forgotPassword")}
              </Link>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[royalblue] py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t("loading") : mode === "login" ? t("login") : t("register")}
        </button>
      </form>

      {/* Toggle */}
      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === "login" ? (
          <>
            Noch kein Konto?{" "}
            <button
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className="font-semibold text-[royalblue] hover:underline"
            >
              {t("register")}
            </button>
          </>
        ) : (
          <>
            Bereits ein Konto?{" "}
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className="font-semibold text-[royalblue] hover:underline"
            >
              {t("login")}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
