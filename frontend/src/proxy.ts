import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Simple in-memory rate limiter for API routes (per IP)
const apiRateLimit = new Map<string, { count: number; resetAt: number }>();
const API_RATE_LIMIT = 30; // max requests per window
const API_RATE_WINDOW = 60_000; // 1 minute

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API route protection
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();

    const entry = apiRateLimit.get(ip);
    if (entry && now < entry.resetAt) {
      entry.count++;
      if (entry.count > API_RATE_LIMIT) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
      }
    } else {
      apiRateLimit.set(ip, { count: 1, resetAt: now + API_RATE_WINDOW });
    }

    // Block requests with suspicious user agents
    const ua = request.headers.get("user-agent") || "";
    if (!ua || /curl|wget|python-requests|scrapy|bot(?!.*google)/i.test(ua)) {
      // Allow through but flag — don't outright block as it might be legitimate
      // The per-route spam checks handle the actual blocking
    }

    // Ensure only POST for form endpoints
    if ((pathname === "/api/contact" || pathname === "/api/newsletter") && request.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    return NextResponse.next();
  }

  // i18n routing for all non-API routes
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/api/:path*"],
};
