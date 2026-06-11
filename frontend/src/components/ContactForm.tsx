"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<FormStatus>("idle");
  const loadedAt = useRef(0);

  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          type: data.get("type"),
          message: data.get("message"),
          _hp: data.get("_hp"),
          _t: loadedAt.current,
        }),
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-green-900">{t("successTitle")}</h3>
        <p className="mt-2 text-sm text-green-700">{t("successText")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot field — hidden from humans, bots fill it */}
      <input type="text" name="_hp" autoComplete="off" tabIndex={-1} aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-navy-900 mb-1.5">
            {t("labelName")} <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 transition-colors"
            placeholder={t("placeholderName")}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-navy-900 mb-1.5">
            {t("labelEmail")} <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 transition-colors"
            placeholder={t("placeholderEmail")}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-navy-900 mb-1.5">
            {t("labelPhone")}
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 transition-colors"
            placeholder={t("placeholderPhone")}
          />
        </div>
        <div>
          <label htmlFor="contact-type" className="block text-sm font-medium text-navy-900 mb-1.5">
            {t("labelType")}
          </label>
          <select
            id="contact-type"
            name="type"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 transition-colors"
          >
            <option value="personal">{t("typePersonal")}</option>
            <option value="business">{t("typeBusiness")}</option>
            <option value="custom">{t("typeCustom")}</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-navy-900 mb-1.5">
          {t("labelMessage")} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 transition-colors resize-y"
          placeholder={t("placeholderMessage")}
        />
      </div>

      {status === "error" && <p className="text-sm text-red-600 font-medium">{t("errorText")}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-navy-900 px-6 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
      >
        {status === "submitting" ? t("submitting") : t("submitButton")}
      </button>
    </form>
  );
}
