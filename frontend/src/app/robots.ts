import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexableDeployment } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  if (!isIndexableDeployment()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private and internal-result pages remain crawlable so their page-level
        // noindex directives can be read. Only non-content API endpoints are blocked.
        disallow: ["/api/"],
      },
      {
        // OAI-SearchBot is the OpenAI search crawler. GPTBot remains governed
        // by the general owner policy above; the two crawlers serve different
        // purposes and should not be conflated.
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
