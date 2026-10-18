import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TurnstilePrivacyNotice } from "@/components/legal/TurnstilePrivacyNotice";
import { turnstilePrivacy, turnstilePrivacyLinks } from "@/content/turnstile-privacy";

describe("Turnstile privacy disclosure", () => {
  it("has a stable notice anchor and German disclosure", () => {
    const html = renderToStaticMarkup(<TurnstilePrivacyNotice locale="de" />);
    expect(html).toContain('id="cloudflare-turnstile"');
    expect(html).toContain('lang="de"');
    expect(html).not.toContain('lang="en"');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<iframe");
  });
  it("adds the English courtesy translation without dropping the German legal text", () => {
    const html = renderToStaticMarkup(<TurnstilePrivacyNotice locale="en" />);
    expect(html).toContain('lang="de"');
    expect(html).toContain('lang="en"');
    expect(html).toContain("German text is authoritative");
    expect(html.match(/id="cloudflare-turnstile"/g)).toHaveLength(1);
    for (const href of turnstilePrivacyLinks) expect(html).toContain(`href="${href}"`);
  });
  it.each(["de", "en"] as const)("covers separate legal bases, cookie configuration and independent processing (%s)", (locale) => {
    const sections = turnstilePrivacy[locale].sections;
    expect(sections).toHaveLength(9);
    expect(sections.map((section) => section.body).join(" ")).toContain("cf_clearance");
    expect(sections.map((section) => section.body).join(" ")).toContain("TDDDG");
    expect(sections.map((section) => section.body).join(" ")).toContain("Data Privacy Framework");
    expect(sections.map((section) => section.body).join(" ")).toContain("info@kubikart.de");
    expect(sections[5].body).toContain(locale === "de" ? "eigenständig Verantwortlicher" : "independent controller");
    expect(sections[7].body).toContain(locale === "de" ? "ist in unserer Widget-Konfiguration deaktiviert" : "is disabled in our widget configuration"); // Pre-clearance confirmed off in the Cloudflare widget (owner, 18 Oct 2026).
  });
});
