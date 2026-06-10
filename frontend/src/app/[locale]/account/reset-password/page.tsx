"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";

export default function ResetPasswordPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const key = searchParams.get("key") ?? "";
  const login = searchParams.get("login") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!key || !login) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-12 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {t("invalidResetLink")}
        </div>
        <Link href="/account/forgot-password" className="mt-6 inline-block text-sm font-semibold text-[royalblue] hover:underline">
          {t("forgotPasswordTitle")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, login, password }),
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/account"), 2500);
      } else {
        setError(t("resetPasswordError"));
      }
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
        <h1 className="mt-4 text-xl font-semibold text-gray-900">{t("resetPasswordTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("resetPasswordDesc")}</p>
      </div>

      {done ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800 leading-relaxed">
          {t("resetPasswordSuccess")}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("newPassword")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("confirmPassword")}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[royalblue] focus:ring-1 focus:ring-[royalblue] outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[royalblue] py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t("resetPasswordSaving") : t("resetPasswordSubmit")}
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
