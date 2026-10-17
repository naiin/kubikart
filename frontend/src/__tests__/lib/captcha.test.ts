import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyCaptcha } from "@/lib/captcha";

beforeEach(() => {
  vi.stubEnv("CLOUDFLARE_TURNSTILE_SECRET", "private-provider-key");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kubikart.de");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, action: "contact", hostname: "kubikart.de" }) }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("server CAPTCHA verification", () => {
  it("requires configured credentials", async () => {
    vi.stubEnv("CLOUDFLARE_TURNSTILE_SECRET", "");
    expect(await verifyCaptcha("token", "contact")).toBe("unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([undefined, "", {}, "a".repeat(2049)])("rejects malformed token %s", async (token) => {
    expect(await verifyCaptcha(token, "contact")).toBe("invalid");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("validates the token with Cloudflare before accepting it", async () => {
    expect(await verifyCaptcha("single-use-token", "contact")).toBe("valid");
    expect(fetch).toHaveBeenCalledWith("https://challenges.cloudflare.com/turnstile/v0/siteverify", expect.objectContaining({ method: "POST", cache: "no-store" }));
  });
  it.each([
    { success: false, action: "contact", hostname: "kubikart.de" },
    { success: true, action: "checkout", hostname: "kubikart.de" },
    { success: true, action: "contact", hostname: "attacker.example" },
  ])("rejects expiry/replay, action mismatch, and foreign hostnames", async (result) => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => result } as Response);
    expect(await verifyCaptcha("token", "contact")).toBe("invalid");
  });
  it("fails closed when the provider is unreachable", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network unavailable"));
    expect(await verifyCaptcha("token", "contact")).toBe("unavailable");
  });
  it("never accepts official test keys in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CLOUDFLARE_TURNSTILE_SECRET", "1x0000000000000000000000000000000AA");
    expect(await verifyCaptcha("token", "contact")).toBe("unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
});
