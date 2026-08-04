import { describe, expect, it } from "vitest";
import { getRootLocaleRedirect, routing } from "@/i18n/routing";

describe("localized routing", () => {
  it("always sends unprefixed traffic to German without browser-language detection", () => {
    expect(routing.defaultLocale).toBe("de");
    expect(routing.localePrefix).toBe("always");
    expect(routing.localeDetection).toBe(false);
    expect(routing.locales).toEqual(["de", "en"]);
  });

  it("only selects /de for the bare root", () => {
    expect(getRootLocaleRedirect("/")).toBe("/de");
    expect(getRootLocaleRedirect("/de")).toBeNull();
    expect(getRootLocaleRedirect("/en")).toBeNull();
  });
});
