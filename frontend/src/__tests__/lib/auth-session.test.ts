import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth-session";

const user = {
  id: 17,
  email: "customer@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  username: "ada",
};

describe("signed authentication session", () => {
  it("verifies a valid signed token", () => {
    const now = Date.UTC(2026, 7, 3);
    const token = createSessionToken(user, now);

    expect(verifySessionToken(token, now + 1000)?.user).toEqual(user);
  });

  it("rejects tampering", () => {
    const token = createSessionToken(user);
    const [payload, signature] = token.split(".");

    expect(verifySessionToken(`${payload}x.${signature}`)).toBeNull();
  });

  it("rejects expired sessions", () => {
    const issuedAt = Date.UTC(2026, 7, 3);
    const token = createSessionToken(user, issuedAt);

    expect(verifySessionToken(token, issuedAt + 8 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});
