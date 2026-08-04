# Kubikart SEO audit — 2026-08-03

## Scope and evidence

This audit covers the Next.js App Router frontend, its WordPress/WooCommerce data contracts, the German and English route trees, rendered metadata, crawler controls, structured data, images, internal navigation, consent UI, and build/test behaviour. The repository has 32 page templates under `app/[locale]`. WordPress was not reachable through Lando during this pass, so no live product count, Search Console data, Analytics data, backlink data, or keyword-volume data is claimed. The code and existing WooCommerce fixtures are the evidence for implementation findings.

Primary guidance used: Google Search Central documentation for [helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [image SEO](https://developers.google.com/search/docs/appearance/google-images), and [product data](https://developers.google.com/search/docs/appearance/structured-data/product); Next.js [metadata guidance](https://nextjs.org/docs/app/getting-started/metadata-and-og-images); OpenAI's [publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq); and Bing's [IndexNow guidance](https://blogs.bing.com/webmaster/September-2024/IndexNow-When-and-How-Websites-Should-Notify-Search-Engines).

## Executive assessment

The site has a sound SEO foundation: server-rendered pages, localized self-canonicals and alternates, a dynamic sitemap, noindex controls for transactional/search pages, product and breadcrumb structured data, descriptive CMS image alt text, and semantic headings. The highest-risk issue was environmental: a preview or Lando deployment could inherit indexable metadata. This is now fixed in code. Remaining work is mostly operational or content-led rather than a reason to redesign the application.

## Findings by priority

### Critical — fixed

- **Preview/staging indexation:** crawler directives and page metadata now allow indexing only when the configured public URL is HTTPS on `kubikart.de`/`www.kubikart.de` and the Vercel environment, if present, is production. Other deployments disallow all crawling, emit no sitemap, and receive inherited `noindex`.
- **Unsafe or inconsistent schema data:** product offers are emitted only for genuinely purchasable products with a positive WooCommerce price. SKU, availability, rating, image, canonical URL, and locale all come from source data. No review, price, SKU, GTIN, address, service area, or business-result claim is invented.

### High — fixed

- Product and industry metadata now explicitly inherit environment-aware robots policy.
- Duplicate public utility routes canonicalize to the intended destination and are absent from the sitemap.
- Hidden WooCommerce products are excluded from the product sitemap.
- JSON-LD serialization escapes `<`, preventing CMS content from closing the script element.
- Production robots explicitly allows `OAI-SearchBot`; `/api/` remains blocked. GPTBot remains governed by the existing general crawler policy because the owner has not supplied a separate training-use decision.

### Medium — working foundation, operational follow-up needed

- **Merchant enrichment:** product pages expose valid core `Product`/`Offer` data, but global shipping and return-policy schema should not be added until the owner confirms the exact policy fields and that they match visible/legal content.
- **Product variants:** WooCommerce variations work, but variant-specific `ProductGroup` markup needs stable public variant URLs or a confirmed canonical variant model. Do not add speculative variant URLs.
- **Local SEO:** visible content supports Kubikart's real local direction around Ulm/Neu-Ulm. A Google Business Profile, exact service area, public phone, opening hours, and public storefront status were not verified and must not be added to schema until confirmed.
- **Content depth:** the strongest query-to-page fit is on service, business-kit, industry, shop, and product pages. Standalone product-category landing pages are intentionally deferred by `docs/redesign/04-content-model.md`; query parameters must not be indexed as substitute landing pages.
- **Measurement:** no Search Console, Bing Webmaster Tools, GA4, Merchant Center, or rank-tracking export was available. Baselines must be recorded after production verification.

### Low / monitor

- The homepage hero is a CSS background, so it cannot carry semantic alt text and does not use Next.js image negotiation. It is decorative in the current composition; monitor LCP and migrate to `next/image` only if lab/field evidence identifies it as the LCP bottleneck.
- WooCommerce media is currently `unoptimized` in product UI. Dimensions and responsive `sizes` avoid layout shift, but CDN format/caching should be verified in production before changing the working media contract.
- `llms.txt` is not added. There is no supported requirement demonstrating that it improves OpenAI search discovery; normal crawlability, sitemaps, accurate content, and citations remain the defensible approach.

## Crawl and indexation matrix

| URL family | Intended state | Mechanism |
|---|---|---|
| Home, shop, services, industries, products | Index | self-canonical, hreflang where equivalent, sitemap |
| Search, cart, checkout, account, success/reset flows | Noindex | route/layout metadata; crawlable so directives can be read |
| API routes | Not crawlable | robots disallow |
| Duplicate `/personalisierte-geschenke`, `/sonderanfertigung` utilities | Canonical/redirect destination | canonical metadata and sitemap exclusion |
| Preview, Lando, localhost, staging | No index | robots disallow all, no sitemap, inherited noindex |
| Missing products/industries | Not indexable | Next `notFound()`; verify final production status with representative URLs |

## Local and competitor research limitations

Live search results for broad Ulm signage terms were noisy and included municipal material rather than a reliable, complete competitor set. This is not evidence of volume or ranking difficulty. The page map therefore uses customer intent and Kubikart's documented capabilities, not fabricated Semrush metrics. A Semrush connector was not installed.

## Performance and consent

Images generally declare dimensions or use `fill` with `sizes`; local variable fonts use `display: swap`; pages remain server components except interactive commerce controls. No Google Analytics, advertising pixel, PostHog, or comparable tracker was found. The cookie banner stores an essential/all preference but currently gates no tracker because none is loaded. Do not install analytics until the owner chooses a provider, lawful configuration, retention settings, and consent mode.

## Launch blockers

Production launch still requires real-host validation of HTTP status codes, canonical/hreflang output, robots and sitemap, schema through Google's Rich Results Test, Search Console ownership, WooCommerce availability, and payment flows. These are manual because local Lando and external owner accounts were unavailable.
