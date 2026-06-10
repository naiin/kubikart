import { describe, it, expect } from "vitest";
import { checkForSpam } from "@/lib/security";

function makeRequest(overrides: { origin?: string; referer?: string } = {}): Request {
  const headers = new Headers();
  if (overrides.origin) headers.set("origin", overrides.origin);
  if (overrides.referer) headers.set("referer", overrides.referer);
  return new Request("http://localhost:3000/api/contact", { headers });
}

describe("checkForSpam", () => {
  describe("honeypot detection", () => {
    it("flags filled honeypot field", () => {
      const result = checkForSpam({ _hp: "bot content", _t: Date.now() - 3000 }, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.isSpam).toBe(true);
      expect(result.reason).toBe("honeypot");
    });

    it("passes empty honeypot field", () => {
      const result = checkForSpam({ _hp: "", _t: Date.now() - 3000 }, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.isSpam).toBe(false);
    });

    it("passes missing honeypot field", () => {
      const result = checkForSpam({ _t: Date.now() - 3000 }, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.isSpam).toBe(false);
    });
  });

  describe("timestamp validation", () => {
    it("flags submission faster than minTime (default 2000ms)", () => {
      const result = checkForSpam({ _t: Date.now() - 500 }, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.isSpam).toBe(true);
      expect(result.reason).toBe("too_fast");
    });

    it("flags submission with custom minTime (5000ms for contact form)", () => {
      const result = checkForSpam({ _t: Date.now() - 2000 }, makeRequest({ origin: "http://localhost:3000" }), 5000);
      expect(result.isSpam).toBe(true);
      expect(result.reason).toBe("too_fast");
    });

    it("passes submission after minTime", () => {
      const result = checkForSpam({ _t: Date.now() - 6000 }, makeRequest({ origin: "http://localhost:3000" }), 5000);
      expect(result.isSpam).toBe(false);
    });

    it("ignores missing timestamp field", () => {
      const result = checkForSpam({}, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.isSpam).toBe(false);
    });

    it("ignores non-numeric timestamp", () => {
      const result = checkForSpam({ _t: "not-a-number" }, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.isSpam).toBe(false);
    });
  });

  describe("origin/referer validation", () => {
    it("passes request from localhost:3000", () => {
      const result = checkForSpam({ _t: Date.now() - 3000 }, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.isSpam).toBe(false);
    });

    it("passes request from kubikart.de", () => {
      const result = checkForSpam({ _t: Date.now() - 3000 }, makeRequest({ origin: "https://kubikart.de" }));
      expect(result.isSpam).toBe(false);
    });

    it("flags request from unknown origin", () => {
      const result = checkForSpam({ _t: Date.now() - 3000 }, makeRequest({ origin: "https://evil.com" }));
      expect(result.isSpam).toBe(true);
      expect(result.reason).toBe("invalid_origin");
    });

    it("falls back to referer when origin missing", () => {
      const result = checkForSpam({ _t: Date.now() - 3000 }, makeRequest({ referer: "https://kubikart.de/kontakt" }));
      expect(result.isSpam).toBe(false);
    });

    it("flags request with bad referer and no origin", () => {
      const result = checkForSpam({ _t: Date.now() - 3000 }, makeRequest({ referer: "https://spam.net/form" }));
      expect(result.isSpam).toBe(true);
      expect(result.reason).toBe("invalid_referer");
    });

    it("passes request with no origin or referer (direct API call from trusted server)", () => {
      // No origin/referer → not checked (trusted — e.g. server-to-server)
      const result = checkForSpam({ _t: Date.now() - 3000 }, makeRequest());
      expect(result.isSpam).toBe(false);
    });
  });

  describe("combined checks", () => {
    it("honeypot takes priority over timing", () => {
      // Honeypot filled AND submitted fast — honeypot check runs first
      const result = checkForSpam({ _hp: "bot", _t: Date.now() }, makeRequest({ origin: "http://localhost:3000" }));
      expect(result.reason).toBe("honeypot");
    });
  });
});
