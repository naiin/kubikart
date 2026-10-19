// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConsent, getServerConsent, setConsent } from "@/lib/cookie-consent";

beforeEach(() => { localStorage.clear(); setConsent("essential"); localStorage.clear(); });
afterEach(() => { localStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("versioned analytics consent", () => {
  it("requires an explicit current-provider choice, retaining legacy rejections", () => {
    localStorage.setItem("kubikart-cookie-consent", "all");
    expect(getConsent()).toBeNull();
    setConsent("all");
    expect(getConsent()).toBe("all");
    expect(getServerConsent()).toBeUndefined();
    localStorage.clear();
    localStorage.setItem("kubikart-cookie-consent", "essential");
    expect(getConsent()).toBe("essential");
  });
  it("expires opt-in, does not accept future timestamps, and fails closed for unavailable storage", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T00:00:00Z"));
    setConsent("all");
    vi.setSystemTime(new Date("2027-05-19T00:00:00Z"));
    expect(getConsent()).toBeNull();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    expect(getConsent()).toBeNull();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    expect(getConsent()).toBeNull();
    expect(() => setConsent("essential")).not.toThrow();
  });
  it("stops measurement immediately if withdrawal cannot be written", () => {
    setConsent("all");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    setConsent("essential");
    expect(getConsent()).toBeNull();
    expect(localStorage.getItem("kubikart-cookie-consent")).toBeNull();
  });
});
