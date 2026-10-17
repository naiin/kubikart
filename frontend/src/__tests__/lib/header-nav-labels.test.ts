import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

/**
 * The desktop header (from 1280 px, the container never grows beyond 1280 px) lays out logo, five nav items, language
 * switcher, icons and the CTA in a single row with no wrapping. Measured with the browser scan used for the 2026-10
 * responsive audit, the nav labels plus CTA have this much spare room at 1280 px with the current wording:
 *   de: 21 px  (about 1 more character, keeping a minimum 8 px gap to the language switcher)
 *   en: 85 px  (about 9 more characters)
 * If this test fails after a copy change, shorten the label or check the header in a browser at 1280-1920 px.
 */
const NAV_KEYS = ["shop", "forBusinesses", "personalizedGifts", "about", "contact"] as const;
const BUDGET = { de: 64 + 18 + 1, en: 51 + 17 + 9 };

function totalLength(messages: typeof de) {
  const { nav, cta } = messages.header;
  return NAV_KEYS.reduce((sum, key) => sum + nav[key].length, 0) + cta.freeMockup.length;
}

describe("desktop header label budget", () => {
  it("keeps the German labels within the measured room", () => {
    expect(totalLength(de)).toBeLessThanOrEqual(BUDGET.de);
  });

  it("keeps the English labels within the measured room", () => {
    expect(totalLength(en as typeof de)).toBeLessThanOrEqual(BUDGET.en);
  });
});
