import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/auth-session";
import { GET } from "@/app/api/auth/session/route";
import { POST as logout } from "@/app/api/auth/logout/route";

const user = {
  id: 23,
  email: "session@example.com",
  firstName: "Session",
  lastName: "Customer",
  username: "session-customer",
};

describe("authentication session endpoints", () => {
  it("returns the signed-in user from the HTTP-only cookie", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/session", {
      headers: { cookie: `kubikart_session=${createSessionToken(user)}` },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user });
  });

  it("rejects an invalid cookie and expires it", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/session", {
      headers: { cookie: "kubikart_session=invalid" },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("kubikart_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("expires the cookie on logout", async () => {
    const response = await logout();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
