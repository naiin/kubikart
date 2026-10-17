"use client";

import Script from "next/script";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CAPTCHA_ACTIONS } from "@/lib/captcha-actions";

type Challenge = { action: string; resolve: (token: string) => void; reject: (error: Error) => void };
type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

const CaptchaContext = createContext<((action: string) => Promise<string>) | null>(null);

function ChallengeDialog({ challenge, siteKey, close }: { challenge: Challenge; siteKey: string; close: () => void }) {
  const t = useTranslations("captcha");
  const locale = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const cancel = () => { challenge.reject(new Error(t("cancelled"))); close(); };

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    if (!ready || !siteKey || !container.current || !window.turnstile) return;
    const api = window.turnstile;
    widget.current = api.render(container.current, {
      sitekey: siteKey, action: challenge.action, language: locale, theme: "light", size: "compact",
      callback: (token: string) => { challenge.resolve(token); close(); },
      "error-callback": () => setError(t("failed")),
      "expired-callback": () => { if (widget.current) api.reset(widget.current); },
    });
    return () => { if (widget.current) api.remove(widget.current); };
  }, [ready, siteKey, challenge, close, locale, t]);

  return (
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); cancel(); }} aria-labelledby="captcha-heading" className="m-auto w-[calc(100%-40px)] max-w-sm rounded-kubikart-lg border border-border bg-surface-white p-6 text-brand backdrop:bg-brand/40">
      <h2 id="captcha-heading" className="font-heading text-lg font-bold">{t("title")}</h2>
      <p className="mt-2 text-sm text-muted">{t("body")}</p>
      {siteKey ? <Script id="cloudflare-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setError(t("failed"))} /> : null}
      <div ref={container} className="mt-4 flex justify-center" />
      {!siteKey || error ? <p role="alert" className="mt-3 text-sm text-danger">{error || t("unavailable")}</p> : <p role="status" className="mt-3 text-sm text-muted">{t("checking")}</p>}
      {error && ready ? <button type="button" className="kk-button kk-button-secondary mt-4" onClick={() => { setError(""); if (widget.current) window.turnstile?.reset(widget.current); }}>{t("retry")}</button> : null}
      <button type="button" className="kk-link mt-4 block min-h-11" onClick={cancel}>{t("cancel")}</button>
    </dialog>
  );
}

export function CaptchaProvider({ siteKey, children }: { siteKey: string; children: ReactNode }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const active = useRef<Challenge | null>(null);
  const close = useCallback(() => { active.current = null; setChallenge(null); }, []);
  const requestToken = useCallback((action: string) => new Promise<string>((resolve, reject) => {
    if (active.current) { reject(new Error("Verification is already in progress")); return; }
    const next = { action, resolve, reject };
    active.current = next;
    setChallenge(next);
  }), []);
  useEffect(() => () => { active.current?.reject(new Error("Verification cancelled")); }, []);
  return <CaptchaContext.Provider value={requestToken}>{children}{challenge ? <ChallengeDialog challenge={challenge} siteKey={siteKey} close={close} /> : null}</CaptchaContext.Provider>;
}

/** One fresh, single-use challenge per submission, including uploads and express checkout. */
export function useProtectedFetch() {
  const requestToken = useContext(CaptchaContext);
  const locale = useLocale();
  return useCallback(async (url: string, init: RequestInit) => {
    if (!requestToken || !CAPTCHA_ACTIONS[url]) throw new Error("Form protection is unavailable");
    const captchaToken = await requestToken(CAPTCHA_ACTIONS[url]);
    let body = init.body;
    if (body instanceof FormData) {
      body.set("captchaToken", captchaToken);
      body.set("locale", locale);
    } else {
      body = JSON.stringify({ ...JSON.parse(String(body || "{}")), locale, captchaToken });
    }
    const headers = new Headers(init.headers);
    headers.set("Accept-Language", locale);
    return fetch(url, { ...init, headers, body });
  }, [requestToken, locale]);
}
