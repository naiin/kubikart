"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success — no email enumeration
      setDone(true);
    } catch {
      setError(tc("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <Link href="/" className="text-3xl font-bold text-[royalblue]">
          KubikArt
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">{t("forgotPasswordTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("forgotPasswordDesc")}</p>
      </div>

      {done ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800 leading-relaxed">
          {t("forgotPasswordSuccess")}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tc("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[royalblue] py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t("forgotPasswordSending") : t("forgotPasswordSubmit")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link href="/account" className="font-semibold text-[royalblue] hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
