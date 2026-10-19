// @vitest-environment jsdom
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Analytics } from "@vercel/analytics/next";
import { CookieBanner } from "@/components/CookieBanner";
import { setConsent } from "@/lib/cookie-consent";
import { AnalyticsPreferences } from "@/components/legal/AnalyticsPreferences";

const { analytics } = vi.hoisted(() => ({
  analytics: vi.fn<(props: ComponentProps<typeof Analytics>) => null>(() => null),
}));
vi.mock("@vercel/analytics/next", () => ({ Analytics: analytics }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const CONSENT_KEY = "kubikart-cookie-consent";
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  // Seed current-version consent metadata; individual tests set the choice.
  setConsent("essential");
  localStorage.removeItem(CONSENT_KEY);
  analytics.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

async function mount() {
  await act(async () => root.render(<CookieBanner />));
}

async function click(label: string) {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent === label);
  expect(button).toBeDefined();
  await act(async () => button!.click());
}

describe("Vercel Analytics consent", () => {
  it("asks again for legacy generic acceptance instead of silently enabling a new provider", async () => {
    localStorage.clear();
    localStorage.setItem(CONSENT_KEY, "all");
    await mount();
    expect(analytics).not.toHaveBeenCalled();
    expect(container.textContent).toContain("acceptAll");
  });
  it("does not render Analytics on the server", () => {
    localStorage.setItem(CONSENT_KEY, "all");
    expect(renderToString(<CookieBanner />)).toBe("");
    expect(analytics).not.toHaveBeenCalled();
  });

  it("waits for consent and keeps Analytics off for essential-only selection", async () => {
    await mount();
    expect(analytics).not.toHaveBeenCalled();
    await click("essentialOnly");
    expect(localStorage.getItem(CONSENT_KEY)).toBe("essential");
    expect(container.textContent).toBe("");
    expect(analytics).not.toHaveBeenCalled();
  });

  it("starts Analytics immediately after accepting all", async () => {
    await mount();
    await click("acceptAll");
    expect(localStorage.getItem(CONSENT_KEY)).toBe("all");
    expect(container.textContent).toBe("");
    expect(analytics).toHaveBeenCalled();
  });

  it("links the banner to the existing privacy page", async () => {
    await mount();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/legal/datenschutz#vercel-analytics");
  });

  it("withdraws and grants consent from privacy controls without reloading", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    await act(async () => root.render(<><CookieBanner /><AnalyticsPreferences /></>));
    const beforeSend = analytics.mock.calls[0][0].beforeSend;
    const event = { type: "pageview" as const, url: "https://example.com/en/shop" };
    expect(container.querySelector('[role="status"]')?.textContent).toBe("enabled");

    await click("reject");
    expect(localStorage.getItem(CONSENT_KEY)).toBe("essential");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("disabled");
    expect(beforeSend?.(event)).toBeNull();
    analytics.mockClear();

    await click("allow");
    expect(localStorage.getItem(CONSENT_KEY)).toBe("all");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("enabled");
    expect(analytics).toHaveBeenCalled();
    expect(beforeSend?.(event)).toEqual(event);
  });

  it("respects a saved essential-only preference", async () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    await mount();
    expect(container.textContent).toBe("");
    expect(analytics).not.toHaveBeenCalled();
  });

  it("restores saved consent and blocks already-loaded script events after cross-tab revocation", async () => {
    localStorage.setItem(CONSENT_KEY, "all");
    await mount();
    const beforeSend = analytics.mock.calls[0][0].beforeSend;
    const event = { type: "pageview" as const, url: "https://example.com/en/shop" };
    expect(beforeSend?.(event)).toEqual(event);

    await act(async () => {
      localStorage.setItem(CONSENT_KEY, "essential");
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY, newValue: "essential" }));
    });
    expect(beforeSend?.(event)).toBeNull();
    expect(container.textContent).toBe("");
    analytics.mockClear();

    await act(async () => {
      localStorage.setItem(CONSENT_KEY, "all");
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY, newValue: "all" }));
    });
    expect(analytics).toHaveBeenCalled();
  });
});
