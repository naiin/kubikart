"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useProtectedFetch } from "@/components/CaptchaProvider";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 transition-colors";

const CUSTOM_SIZE_TEXT = {
  overall: { intro: "customSizeIntro", labelWidth: "labelSizeWidth", labelHeight: "labelSizeHeight", placeholderWidth: "placeholderSizeWidth", placeholderHeight: "placeholderSizeHeight" },
  film: { intro: "customFilmIntro", labelWidth: "labelFilmWidth", labelHeight: "labelFilmHeight", placeholderWidth: "placeholderFilmWidth", placeholderHeight: "placeholderFilmHeight" },
  format: { intro: "customFormatIntro", labelWidth: "labelFormatWidth", labelHeight: "labelFormatHeight", placeholderWidth: "placeholderFormatWidth", placeholderHeight: "placeholderFormatHeight" },
} as const;

/** Short enquiry for one product or bundle. The server re-validates the product and adds its id, URL and language. */
export function ProductEnquiryForm({
  product,
  customSize = false,
  customSizeKind = "overall",
  configuration,
  compact = false,
}: {
  product: { id: number; slug: string; name: string };
  /** Adds the width and maximum-height fields of a "Request custom size" enquiry. */
  customSize?: boolean;
  /** "film" asks for the film width and height, "format" for the finished width and height, instead of the overall width and maximum height. */
  customSizeKind?: "overall" | "film" | "format";
  /**
   * The customer's choices on the product page, sent along with the enquiry. `validate` runs first and returns false
   * (after showing its own field errors) when the choices are incomplete.
   */
  configuration?: { lines: string[]; fileTokens: string[]; validate: () => boolean; busy?: boolean };
  /** Embedded in the product page: no intro box and no link back to the same page. */
  compact?: boolean;
}) {
  const t = useTranslations("enquiryForm");
  const protectedFetch = useProtectedFetch();
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [privacyError, setPrivacyError] = useState(false);
  const [reference, setReference] = useState("");
  const loadedAt = useRef(0);

  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (configuration && !configuration.validate()) return;
    if (data.get("privacy") !== "on") {
      setPrivacyError(true);
      return;
    }
    setPrivacyError(false);
    setStatus("submitting");

    try {
      const response = await protectedFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          company: data.get("company"),
          message: data.get("message"),
          privacy: true,
          locale,
          context: { kind: "product", slug: product.slug },
          ...(customSize || configuration
            ? {
                details: {
                  ...(customSize ? { customSize: { kind: customSizeKind, width: data.get("sizeWidth"), height: data.get("sizeHeight") } } : {}),
                  ...(configuration ? { configuration: { lines: configuration.lines, fileTokens: configuration.fileTokens } } : {}),
                },
              }
            : {}),
          _hp: data.get("_hp"),
          _t: loadedAt.current,
        }),
      });
      if (response.ok) {
        setReference(String((await response.json().catch(() => null))?.reference ?? ""));
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
      <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-8">
        <h2 className="text-lg font-bold text-green-900">{t("successTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-green-800">{t("successText", { name: product.name })}</p>
        {reference ? <p className="mt-3 text-sm font-semibold text-green-900">{t("successReference", { reference })}</p> : null}
        {compact ? null : (
          <Link href={`/shop/${product.slug}`} className="mt-5 inline-flex text-sm font-semibold text-navy-900 underline underline-offset-2">
            {t("successBack", { name: product.name })}
          </Link>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
      <input type="text" name="_hp" autoComplete="off" tabIndex={-1} aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      {compact ? null : (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-navy-900">
          <span className="text-muted">{t("selectedLabel")}: </span>
          <strong>{product.name}</strong>
        </div>
      )}
      <p className="text-sm leading-6 text-gray-600">{customSize ? t(CUSTOM_SIZE_TEXT[customSizeKind].intro) : configuration ? t("configurationIntro") : t("intro")}</p>

      {customSize ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="enquiry-size-width" className="mb-1.5 block text-sm font-medium text-navy-900">
              {t(CUSTOM_SIZE_TEXT[customSizeKind].labelWidth)} <span className="text-red-500">*</span>
            </label>
            <input id="enquiry-size-width" name="sizeWidth" type="number" inputMode="decimal" min={1} max={500} step="any" required className={inputClass} placeholder={t(CUSTOM_SIZE_TEXT[customSizeKind].placeholderWidth)} />
          </div>
          <div>
            <label htmlFor="enquiry-size-height" className="mb-1.5 block text-sm font-medium text-navy-900">
              {t(CUSTOM_SIZE_TEXT[customSizeKind].labelHeight)} <span className="text-red-500">*</span>
            </label>
            <input id="enquiry-size-height" name="sizeHeight" type="number" inputMode="decimal" min={1} max={500} step="any" required className={inputClass} placeholder={t(CUSTOM_SIZE_TEXT[customSizeKind].placeholderHeight)} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="enquiry-name" className="mb-1.5 block text-sm font-medium text-navy-900">
            {t("labelName")} <span className="text-red-500">*</span>
          </label>
          <input id="enquiry-name" name="name" type="text" required autoComplete="name" className={inputClass} placeholder={t("placeholderName")} />
        </div>
        <div>
          <label htmlFor="enquiry-email" className="mb-1.5 block text-sm font-medium text-navy-900">
            {t("labelEmail")} <span className="text-red-500">*</span>
          </label>
          <input id="enquiry-email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder={t("placeholderEmail")} />
        </div>
        <div>
          <label htmlFor="enquiry-phone" className="mb-1.5 block text-sm font-medium text-navy-900">{t("labelPhone")}</label>
          <input id="enquiry-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder={t("placeholderPhone")} />
        </div>
        <div>
          <label htmlFor="enquiry-company" className="mb-1.5 block text-sm font-medium text-navy-900">{t("labelBusiness")}</label>
          <input id="enquiry-company" name="company" type="text" autoComplete="organization" className={inputClass} placeholder={t("placeholderBusiness")} />
        </div>
      </div>

      <div>
        <label htmlFor="enquiry-message" className="mb-1.5 block text-sm font-medium text-navy-900">{t("labelMessage")}</label>
        <textarea id="enquiry-message" name="message" rows={4} className={`${inputClass} resize-y`} placeholder={t("placeholderMessage")} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-gray-700">
          <input type="checkbox" name="privacy" aria-describedby={privacyError ? "enquiry-privacy-error" : undefined} className="mt-1.5 h-4 w-4 shrink-0 rounded border-gray-300" />
          <span>
            {t("privacyBefore")}{" "}
            <Link href="/legal/datenschutz" className="underline underline-offset-2 hover:text-navy-900">{t("privacyLink")}</Link>{" "}
            {t("privacyAfter")}
          </span>
        </label>
        {privacyError ? <p id="enquiry-privacy-error" role="alert" className="mt-1 text-sm font-medium text-red-600">{t("privacyRequired")}</p> : null}
      </div>

      {status === "error" ? <p role="alert" className="text-sm font-medium text-red-600">{t("errorText")}</p> : null}

      <button
        type="submit"
        disabled={status === "submitting" || Boolean(configuration?.busy)}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-navy-900 px-6 text-sm font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
