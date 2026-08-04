"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Step = "start" | "details" | "review" | "success";

type Receipt = {
  receiptId: string;
  receivedAt: string;
  name: string;
  email: string;
  contractReference: string;
  scope: string;
  emailSent: boolean;
};

function downloadReceipt(receipt: Receipt, labels: { title: string; received: string; reference: string; scope: string }) {
  const lines = [
    labels.title,
    "",
    `${labels.received}: ${new Date(receipt.receivedAt).toLocaleString()}`,
    `ID: ${receipt.receiptId}`,
    `Name: ${receipt.name}`,
    `E-Mail: ${receipt.email}`,
    `${labels.reference}: ${receipt.contractReference}`,
    `${labels.scope}: ${receipt.scope || "—"}`,
  ];
  const blobUrl = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = `kubikart-widerruf-${receipt.receiptId}.txt`;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
}

export function WithdrawalFunction() {
  const t = useTranslations("withdrawal");
  const locale = useLocale();
  const [step, setStep] = useState<Step>("start");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [formValues, setFormValues] = useState({ name: "", email: "", contractReference: "", scope: "" });
  const loadedAt = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (step !== "start") {
      headingRef.current?.focus();
    }
  }, [step]);

  async function submitWithdrawal() {
    setStatus("submitting");
    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formValues,
          locale,
          _hp: "",
          _t: loadedAt.current,
        }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const result = (await response.json()) as Receipt;
      setReceipt(result);
      setStatus("idle");
      setStep("success");
      downloadReceipt(result, {
        title: t("receiptTitle"),
        received: t("receivedAt"),
        reference: t("contractReference"),
        scope: t("scope"),
      });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="withdraw-contract" aria-labelledby="withdrawal-function-heading" className="rounded-kubikart-xl border border-border bg-surface p-6 sm:p-8">
      {step === "start" ? (
        <>
          <p className="kk-eyebrow">{t("functionEyebrow")}</p>
          <h2 id="withdrawal-function-heading" className="kk-heading-2 mt-3">{t("functionTitle")}</h2>
          <p className="mt-4 max-w-3xl text-muted">{t("functionIntro")}</p>
          <button type="button" className="kk-button kk-button-primary mt-6" onClick={() => setStep("details")}>
            {t("startButton")}
          </button>
        </>
      ) : null}

      {step === "details" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setStatus("idle");
            setStep("review");
          }}
          className="space-y-5"
        >
          <h2 ref={headingRef} tabIndex={-1} id="withdrawal-function-heading" className="kk-heading-2 outline-none">
            {t("detailsTitle")}
          </h2>
          <p className="text-sm text-muted">{t("requiredNote")}</p>
          <input name="_hp" className="absolute -left-[9999px]" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <div>
            <label htmlFor="withdrawal-name" className="mb-2 block text-sm font-semibold text-brand">{t("name")} *</label>
            <input id="withdrawal-name" className="kk-form-control" required autoComplete="name" value={formValues.name} onChange={(event) => setFormValues({ ...formValues, name: event.target.value })} />
          </div>
          <div>
            <label htmlFor="withdrawal-email" className="mb-2 block text-sm font-semibold text-brand">{t("email")} *</label>
            <input id="withdrawal-email" type="email" className="kk-form-control" required autoComplete="email" value={formValues.email} onChange={(event) => setFormValues({ ...formValues, email: event.target.value })} />
            <p className="mt-2 text-sm text-muted">{t("emailHelp")}</p>
          </div>
          <div>
            <label htmlFor="withdrawal-reference" className="mb-2 block text-sm font-semibold text-brand">{t("contractReference")} *</label>
            <input id="withdrawal-reference" className="kk-form-control" required value={formValues.contractReference} onChange={(event) => setFormValues({ ...formValues, contractReference: event.target.value })} />
            <p className="mt-2 text-sm text-muted">{t("contractReferenceHelp")}</p>
          </div>
          <div>
            <label htmlFor="withdrawal-scope" className="mb-2 block text-sm font-semibold text-brand">{t("scope")}</label>
            <textarea id="withdrawal-scope" className="kk-form-control min-h-32 resize-y" rows={4} maxLength={1500} value={formValues.scope} onChange={(event) => setFormValues({ ...formValues, scope: event.target.value })} />
            <p className="mt-2 text-sm text-muted">{t("scopeHelp")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="kk-button kk-button-primary">{t("reviewButton")}</button>
            <button type="button" className="kk-button kk-button-secondary" onClick={() => setStep("start")}>{t("cancelButton")}</button>
          </div>
        </form>
      ) : null}

      {step === "review" ? (
        <div>
          <h2 ref={headingRef} tabIndex={-1} id="withdrawal-function-heading" className="kk-heading-2 outline-none">{t("reviewTitle")}</h2>
          <p className="mt-3 text-muted">{t("reviewIntro")}</p>
          <dl className="mt-6 grid gap-4 rounded-kubikart-md border border-border bg-page p-5 sm:grid-cols-[12rem_1fr]">
            <dt className="font-semibold text-brand">{t("name")}</dt><dd className="break-words">{formValues.name}</dd>
            <dt className="font-semibold text-brand">{t("email")}</dt><dd className="break-words">{formValues.email}</dd>
            <dt className="font-semibold text-brand">{t("contractReference")}</dt><dd className="break-words">{formValues.contractReference}</dd>
            <dt className="font-semibold text-brand">{t("scope")}</dt><dd className="break-words">{formValues.scope || t("entireContract")}</dd>
          </dl>
          {status === "error" ? <p className="mt-5 text-sm font-semibold text-danger" role="alert">{t("error")}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="kk-button kk-button-primary" disabled={status === "submitting"} onClick={submitWithdrawal}>
              {status === "submitting" ? t("submitting") : t("confirmButton")}
            </button>
            <button type="button" className="kk-button kk-button-secondary" disabled={status === "submitting"} onClick={() => setStep("details")}>{t("editButton")}</button>
          </div>
        </div>
      ) : null}

      {step === "success" && receipt ? (
        <div role="status">
          <h2 ref={headingRef} tabIndex={-1} id="withdrawal-function-heading" className="kk-heading-2 outline-none">{t("successTitle")}</h2>
          <p className="mt-4 text-muted">{t("successText")}</p>
          <p className="mt-3 text-sm text-muted">{t(receipt.emailSent ? "emailSent" : "downloadNotice")}</p>
          <dl className="mt-6 grid gap-3 rounded-kubikart-md border border-border bg-page p-5 sm:grid-cols-[12rem_1fr]">
            <dt className="font-semibold text-brand">{t("receiptId")}</dt><dd className="break-all">{receipt.receiptId}</dd>
            <dt className="font-semibold text-brand">{t("receivedAt")}</dt><dd>{new Date(receipt.receivedAt).toLocaleString(locale)}</dd>
          </dl>
          <button
            type="button"
            className="kk-button kk-button-secondary mt-6"
            onClick={() => downloadReceipt(receipt, { title: t("receiptTitle"), received: t("receivedAt"), reference: t("contractReference"), scope: t("scope") })}
          >
            {t("downloadReceipt")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
