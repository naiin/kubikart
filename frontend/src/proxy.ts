import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getRootLocaleRedirect, routing } from "./i18n/routing";
import { getClientIp } from "./lib/client-ip";
import { CAPTCHA_ACTIONS, verifyCaptcha } from "./lib/captcha";
import { applyRateLimit, getApiRateLimitPolicy, getRateLimitMessage, inferRequestLocale } from "./lib/rate-limit";

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
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.delete("x-kubikart-captcha-verified");
    const ip = getClientIp(request.headers);
    const rateLimit = await applyRateLimit(`${process.env.RATE_LIMIT_NAMESPACE || "kubikart"}:api:${pathname}:${ip}`, getApiRateLimitPolicy(pathname));
    if (!rateLimit.allowed) {
      const retryAfterSeconds = rateLimit.retryAfterSeconds;
      return NextResponse.json({
        error: getRateLimitMessage(inferRequestLocale(request.headers), retryAfterSeconds),
        code: "rate_limited",
        retryAfterSeconds,
      }, {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds), "X-RateLimit-Remaining": "0" },
      });
    }

    const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const isProviderWebhook = pathname.startsWith("/api/webhooks/");
    const isSignedMachineEndpoint = pathname === "/api/revalidate" || pathname === "/api/enquiries/retry";
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

    const captchaAction = CAPTCHA_ACTIONS[pathname];
    if (isUnsafeMethod && captchaAction) {
      let token: unknown;
      try {
        const copy = request.clone();
        token = request.headers.get("content-type")?.includes("multipart/form-data")
          ? (await copy.formData()).get("captchaToken")
          : (await copy.json()).captchaToken;
      } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      const verification = await verifyCaptcha(token, captchaAction);
      if (verification !== "valid") {
        const english = inferRequestLocale(request.headers) === "en";
        return NextResponse.json({
          code: verification === "unavailable" ? "captcha_unavailable" : "captcha_invalid",
          error: english ? "Security verification failed. Please try again." : "Die Sicherheitsprüfung ist fehlgeschlagen. Bitte versuche es erneut.",
        }, { status: verification === "unavailable" ? 503 : 403 });
      }
      forwardedHeaders.set("x-kubikart-captcha-verified", captchaAction);
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

    return NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  // The public root is always the German storefront. Keep explicit /en URLs
  // available through navigation, but never select them from headers/cookies.
  const rootLocaleRedirect = getRootLocaleRedirect(pathname);
  if (rootLocaleRedirect) {
    const germanHomepage = request.nextUrl.clone();
    germanHomepage.pathname = rootLocaleRedirect;
    return NextResponse.redirect(germanHomepage, 308);
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
