const CONSENT_KEY = "kubikart-cookie-consent";
const CONSENT_EVENT = "kubikart-cookie-consent-change";
const CONSENT_DETAILS_KEY = "kubikart-cookie-consent-details";
const CONSENT_VERSION = "vercel-web-analytics-v1";
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
let storageFailed = false;

export function getConsent() {
  if (storageFailed) return null;
  try {
    const choice = localStorage.getItem(CONSENT_KEY);
    // A previous rejection remains a rejection. Legacy generic "all" values
    // are not evidence of permission for a newly introduced analytics service.
    if (choice === "essential") return "essential";
    if (choice !== "all") return null;
    const details = JSON.parse(localStorage.getItem(CONSENT_DETAILS_KEY) || "null");
    const age = Date.now() - Number(details?.at);
    return details?.version === CONSENT_VERSION && Number.isFinite(age) && age >= 0 && age < MAX_AGE_MS ? "all" : null;
  } catch {
    // Storage denied/corrupted must never silently enable measurement.
    return null;
  }
}

export function subscribeToConsent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}

export function setConsent(value: "all" | "essential") {
  try {
    localStorage.setItem(CONSENT_DETAILS_KEY, JSON.stringify({ version: CONSENT_VERSION, at: Date.now() }));
    localStorage.setItem(CONSENT_KEY, value);
    storageFailed = false;
  } catch {
    storageFailed = true;
    // A failed withdrawal must not leave a stale opt-in active. Removing our
    // own preference can still work when storage writes fail due to quota.
    try {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_DETAILS_KEY);
    } catch { /* Unavailable storage remains opted out in this tab. */ }
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function getServerConsent() {
  return undefined;
}
