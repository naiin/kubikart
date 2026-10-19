import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getRootLocaleRedirect, routing } from "./i18n/routing";
import { getClientIp } from "./lib/client-ip";
import { CAPTCHA_ACTIONS, verifyCaptcha } from "./lib/captcha";
import { applyRateLimit, getApiRateLimitPolicy, getRateLimitMessage, inferRequestLocale } from "./lib/rate-limit";
import { resolvePublicRoute } from "./lib/public-route";
import { getSiteUrl, isIndexableDeployment } from "./lib/seo";

const intlMiddleware = createMiddleware(routing);

function protectNonCanonicalHost(response: NextResponse, request: NextRequest) {
  if (!isIndexableDeployment() || request.nextUrl.hostname !== new URL(getSiteUrl()).hostname) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

function missingPublicPage(pathname: string) {
  const english = pathname.startsWith("/en/");
  const locale = english ? "en" : "de";
  const title = english ? "Page not found" : "Seite nicht gefunden";
  // A static /_not-found rewrite can replace no-store with a year-long CDN
  // cache lifetime. Respond here so a future publication cannot inherit it.
  return new NextResponse(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 – ${title} | Kubikart</title></head><body style="margin:0;background:#F7F4EF;color:#0C2D48;font-family:system-ui,sans-serif"><main style="max-width:760px;margin:10vh auto;padding:24px"><p>404</p><h1>${title}</h1><p><a href="/${locale}/shop" style="color:inherit">${english ? "Back to the shop" : "Zurück zum Shop"}</a></p></main></body></html>`, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
  });
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
    return protectNonCanonicalHost(NextResponse.redirect(germanHomepage, 308), request);
  }

  const identity = await resolvePublicRoute(pathname);
  if (identity?.kind === "missing") {
    return missingPublicPage(pathname);
  }
  if (identity?.kind === "unavailable") {
    return new NextResponse(pathname.startsWith("/en/") ? "Temporarily unavailable. Please try again later." : "Vorübergehend nicht verfügbar. Bitte versuche es später erneut.", {
      status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }
  if (identity?.kind === "found" && identity.pathname !== pathname.replace(/\/$/, "")) {
    const destination = request.nextUrl.clone();
    destination.pathname = identity.pathname;
    return protectNonCanonicalHost(NextResponse.redirect(destination, 308), request);
  }

  // i18n routing for all non-API routes
  return protectNonCanonicalHost(intlMiddleware(request), request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|_not-found|.*\\..*).*)", "/:locale(de|en)/shop/:path*", "/:locale(de|en)/businesses/:path*", "/api/:path*"],
};
