import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kubikart-backend.lndo.site",
        pathname: "/wp-content/**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Prevent clickjacking
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        // Prevent MIME type sniffing
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Control referrer information
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
        // XSS Protection (legacy browsers)
        { key: "X-XSS-Protection", value: "1; mode=block" },
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
