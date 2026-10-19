import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { VercelPrivacyNotice } from "@/components/legal/VercelPrivacyNotice";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async ({ locale }: { locale: "de" | "en" }) => createTranslator({
      locale,
      messages: locale === "de" ? de : en,
      namespace: "vercelPrivacy",
    }),
  };
});
vi.mock("@/components/legal/AnalyticsPreferences", () => ({
  AnalyticsPreferences: () => <div id="analytics-preferences" />,
}));

describe("Vercel privacy disclosure", () => {
  it.each(["de", "en"] as const)("renders the disclosure and one set of preferences (%s)", async (locale) => {
    const html = renderToStaticMarkup(await VercelPrivacyNotice({ locale }));
    expect(html).toContain('id="vercel-analytics"');
    expect(html).toContain('lang="de"');
    expect(html.includes('lang="en"')).toBe(locale === "en");
    expect(html.match(/id="analytics-preferences"/g)).toHaveLength(1);
    expect(html).not.toContain("<script");
    for (const path of [
      "docs/analytics/privacy-policy", "docs/speed-insights/privacy-policy", "legal/privacy-notice", "legal/dpa",
    ]) {
      expect(html).toContain(`href="https://vercel.com/${path}"`);
    }
  });

  it("keeps both translations aligned with separate service controls and qualified retention", () => {
    expect(Object.keys(en.vercelPrivacy)).toEqual(Object.keys(de.vercelPrivacy));
    expect(de.vercelPrivacy.consent.body).toContain("Art. 6 Abs. 1 Buchst. a DSGVO");
    expect(en.vercelPrivacy.consent.body).toContain("Article 6(1)(a) GDPR");
    expect(de.vercelPrivacy.speed.body).toContain("schalten Speed Insights nicht aus");
    expect(en.vercelPrivacy.speed.body).toContain("do not disable Speed Insights");
    expect(de.vercelPrivacy.retention.body).toContain("keine Löschfrist");
    expect(en.vercelPrivacy.retention.body).toContain("not a deletion deadline");
    for (const messages of [de, en]) {
      expect(messages.vercelPrivacy.storage.body).toContain("kubikart-cookie-consent");
      expect(messages.vercelPrivacy.speedBasis.body).toContain("TDDDG");
      expect(messages.vercelPrivacy.speedBasis.body).toContain("info@kubikart.de");
    }
  });
});
