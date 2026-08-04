import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { applyRateLimit, getApiRateLimitPolicy } from "./lib/rate-limit";

const intlMiddleware = createMiddleware(routing);

async function dynamicResourceExists(pathname: string): Promise<boolean | null> {
  const productMatch = pathname.match(/^\/(?:de|en)\/shop\/([^/]+)\/?$/);
  const industryMatch = pathname.match(/^\/(?:de|en)\/businesses\/([^/]+)\/?$/);
  try {
    if (productMatch && process.env.WC_API_URL && process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET) {
      const url = new URL(`${process.env.WC_API_URL}/products`);
      url.searchParams.set("slug", decodeURIComponent(productMatch[1]));
      url.searchParams.set("status", "publish");
      url.searchParams.set("per_page", "1");
      const authorization = `Basic ${Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64")}`;
      const response = await fetch(url, { cache: "no-store", headers: { Authorization: authorization } });
      if (!response.ok) return null;
      return ((await response.json()) as unknown[]).length > 0;
    }
    if (industryMatch && process.env.WORDPRESS_API_URL) {
      const url = new URL(`${process.env.WORDPRESS_API_URL}/business-industries`);
      url.searchParams.set("slug", decodeURIComponent(industryMatch[1]));
      url.searchParams.set("status", "publish");
      url.searchParams.set("per_page", "1");
      const headers = process.env.WP_APP_USER && process.env.WP_APP_PASSWORD
        ? { Authorization: `Basic ${Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64")}` }
        : undefined;
      const response = await fetch(url, { cache: "no-store", headers });
      if (!response.ok) return null;
      return ((await response.json()) as unknown[]).length > 0;
    }
  } catch (error) {
    console.error("Dynamic route existence check failed:", error);
  }
  return null;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API route protection
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await applyRateLimit(`kubikart:api:${pathname}:${ip}`, getApiRateLimitPolicy(pathname));
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds), "X-RateLimit-Remaining": "0" },
      });
    }

    const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const isProviderWebhook = pathname.startsWith("/api/webhooks/");
    const isSignedMachineEndpoint = pathname === "/api/revalidate";
    if (isUnsafeMethod && !isProviderWebhook && !isSignedMachineEndpoint) {
      const origin = request.headers.get("origin");
      const fetchSite = request.headers.get("sec-fetch-site");
      const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000", "https://kubikart.de", "https://www.kubikart.de"]
        .filter((value): value is string => Boolean(value))
        .map((value) => {
          try { return new URL(value).origin; } catch { return ""; }
        });
      let requestOrigin = "";
      try { requestOrigin = origin ? new URL(origin).origin : ""; } catch { requestOrigin = ""; }
      if ((origin && !allowedOrigins.includes(requestOrigin)) || fetchSite === "cross-site") {
        return NextResponse.json({ error: "Cross-site request rejected" }, { status: 403 });
      }
    }

    // Block requests with suspicious user agents
    const ua = request.headers.get("user-agent") || "";
    if (!ua || /curl|wget|python-requests|scrapy|bot(?!.*google)/i.test(ua)) {
      // Allow through but flag — don't outright block as it might be legitimate
      // The per-route spam checks handle the actual blocking
    }

    // Ensure only POST for form endpoints
    if ((pathname === "/api/contact" || pathname === "/api/newsletter" || pathname === "/api/withdrawal") && request.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    return NextResponse.next();
  }

  const exists = await dynamicResourceExists(pathname);
  if (exists === false) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  }

  // i18n routing for all non-API routes
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/api/:path*"],
};
