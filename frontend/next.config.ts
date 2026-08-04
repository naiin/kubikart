import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function wordpressImagePatterns() {
  const urls = [process.env.NEXT_PUBLIC_WORDPRESS_URL, "https://kubikart-backend.lndo.site"];
  return urls.flatMap((value) => {
    if (!value) return [];
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      return [{ protocol: url.protocol.slice(0, -1) as "http" | "https", hostname: url.hostname, port: url.port, pathname: "/wp-content/**" }];
    } catch {
      return [];
    }
  });
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://*.paypal.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: wordpressImagePatterns(),
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Prevent clickjacking
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
        // Prevent MIME type sniffing
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Control referrer information
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        // Restrict permissions
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(self)",
        },
        // Strict Transport Security (HTTPS only in production)
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        // Disable the obsolete auditor; CSP is the modern XSS control.
        { key: "X-XSS-Protection", value: "0" },
      ],
    },
    {
      // No caching for API routes
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
    },
  ],
};

export default withNextIntl(nextConfig);
