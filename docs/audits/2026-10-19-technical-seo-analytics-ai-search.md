# Kubikart technical SEO, analytics and AI-search audit

Audit date: 19 October 2026, Europe/Berlin. Repository baseline: `4a4f8ef`.

## Scope, authority and evidence

Read-only audit of the actual public Vercel frontend at `https://kubikart.de`, the STRATO backend at `https://kubikart-werbetechnik.de`, and the Next.js/WordPress source. No application fixes, production configuration changes, deployments, indexing submissions, analytics installation, purchases, customer-account creation or form submissions were performed. Browser automation blocked non-GET/HEAD requests. Existing owner-authorized SSH access was used only for WordPress option/plugin/catalog reads and file hashes; no customer/order records were retrieved.

The repository was clean at the initial inspection. Concurrent changes subsequently appeared in homepage documentation, `BusinessKitCard.tsx`, `HomePaths.tsx`, a home-image test, a temporary performance directory, the locale layout, package/lock files and launch documentation. These are not this audit's changes and were preserved. Deployed measurements below are not claims about those unpublished changes. Next.js review guidance, browser-verification guidance and official OpenAI documentation informed the audit; no framework, styling or commerce migration was undertaken.

### Verified inventory

| Check | Observed result |
| --- | --- |
| Frontend sitemap | 91 URLs: 29 static pages, 46 localized product pages, 16 industry pages |
| Complete sitemap crawl | 91/91 HTTP 200; one self-canonical and one H1 per URL; descriptions present; HTML hreflang reciprocal between available translations |
| Published WooCommerce catalog | 46 localized parents: 23 DE/EN pairs; 444 published variation records |
| Purchase/enquiry split | 34 purchasable localized parents / 12 enquiry-only localized parents: 17 purchasable products / 6 enquiry bundles, each in both languages |
| Parent and variation SKUs | No missing SKUs in the inspected published inventory |
| Price-less variations | 56/444 have blank prices; these must not be treated as free purchasable variants |
| Product structured data | 46 Product entities, 34 with Offers; the 12 enquiry pages have no Offer |
| Normal nonexistent dynamic URLs | Product and industry probes returned real HTTP 404 |
| Private URL shells | DE/EN account, cart and checkout returned `noindex, follow`, private/no-store HTTP caching; absent from sitemap |
| Protected API | Anonymous `/api/orders` returned 401 and no order data; public WP pages API returned 401 |
| Crawler smoke checks | Homepage returned 200 to synthetic Googlebot, bingbot, OAI-SearchBot, GPTBot and ChatGPT-User user agents |
| Real-browser coverage | DE/EN home, shop, business cards, cart and checkout; DE acrylic stand; EN enquiry bundle |
| Responsive sample | DE/EN home and business cards: 360, 768, 1024 and 1440 px; no horizontal overflow |
| Current analytics | No GA4/GTM integration found in source; no analytics requests or `gtag` observed in the initial browser runs |

These counts describe translated records, not 46 different physical products. SKU presence is not proof of GTIN assignment, feed eligibility or full variant data quality.

## Priority summary

No **confirmed critical** site-wide indexing failure, public customer-order exposure or fake commercial schema was found. This is not a security certification or a full authenticated checkout regression. Preview protection and verified-crawler firewall behavior remain external verification gates, not passed checks.

| Priority | ID | Finding | Evidence level |
| --- | --- | --- | --- |
| High | H1 | Public WordPress storefront duplicates the frontend and advertises its own sitemaps | Production HTTP + SSH |
| High | H2 | HTTP hreflang headers disagree with correct HTML/sitemap alternates | Entire deployed sitemap crawl |
| High | H3 | Account orders inherit the catalog's five-minute upstream fetch cache | Code; anonymous protection verified separately |
| High | H4 | Product galleries and thumbnails load full-size multi-megabyte originals | Code + browser + media HEAD requests |
| High, before feed launch | H5 | Variable-product offers/feed landing-page model is incomplete | Catalog + schema + purchase-form code |
| High, measurement gap | H6 | GA4/conversions absent; current banner is not an analytics consent system | Code + browser |
| Medium | M1 | Uncached proxy existence checks, no WooCommerce timeout, and dynamic public HTML add avoidable latency | Code + deployed headers/timings |
| Medium | M2 | Sitemap generation can silently publish partial inventories during backend failure | Code; no production outage induced |
| Medium | M3 | Header subnavigation is interaction-only; several internal links target duplicate localized service URLs | Code + source crawl + HTTP |
| Medium, content opportunity | M4 | Categories are filters, not indexable category landing pages; catalog pagination has a fixed ceiling | Code + HTTP; intentional current design |
| Medium | M5 | Image alt localization and source filenames remain inconsistent | Rendered DE/EN pages + catalog |
| Medium | M6 | Product metadata is often overlong; generic social images absent | Entire sitemap crawl |
| Medium, verification gate | M7 | Preview/alias noindex and production project settings not verified in Vercel dashboard | Code tests only; external access gap |
| Medium, setup gap | M8 | Search Console/Bing ownership, indexing and field-performance baselines unavailable | Source + public DNS; accounts not connected |
| Medium, optional enhancement | M9 | No IndexNow publication pipeline; training-crawler policy still needs owner choice | Source + production robots |
| Medium | M10 | Dotted unknown slugs bypass proxy checks and produce streamed HTTP-200 not-found responses | Production probe + proxy matcher |

## High-priority findings and acceptance checks

### H1 — Backend duplication is active, not merely a launch-checklist item

STRATO's `blog_public` is `1`. Backend `/robots.txt` permits ordinary public content and advertises `/wp-sitemap.xml`. Its sitemap index lists DE/EN products, pages, categories, tags, shipping classes and author URLs. The German product sitemap contains 23 products. The backend product `/product/personalisierter-qr-code-aufsteller-nfc/` returns 200, a backend self-canonical, and `max-image-preview:large` without `noindex`. This competes with the frontend URL for the same product. Actual Google indexing was not established without Search Console.

Files: `backend/wordpress/.htaccess:1`; `backend/wordpress/wp-content/plugins/kubikart-security/kubikart-security.php:92` only redirects author archives, not general storefront HTML. The deployed security plugin hash matches the local file. Industry CPT registration already uses `publicly_queryable=false`; preserve that distinction.

Proposed action, approval required: define a headless HTML policy. Map genuine legacy product URLs to matching localized frontend URLs using permanent redirects where appropriate; otherwise make backend HTML explicitly noindex and remove unnecessary backend sitemap exposure. Do not globally redirect the backend domain or block public product-media URLs: REST, WooCommerce, WordPress admin, payment callbacks and `/wp-content/uploads/` must remain usable. Do not rely solely on robots disallow to remove previously discoverable URLs. [Google robots guidance](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

Acceptance: crawl backend home/product/category/page/author examples and verify the chosen redirect/noindex behavior; inspect image and authenticated REST availability; submit only the frontend sitemap and review backend indexing in an owner-controlled Search Console property.

### H2 — Two conflicting hreflang systems are deployed

HTML and XML alternates passed the translation/reciprocity checks. However, all 91 sitemap pages have at least one HTTP `Link` alternate differing from their HTML declaration: 159 differing declarations in total, including x-default differences. On 34 pages the HTTP English alternate differs from the HTML English alternate. Middleware derives same-path locale links, which cannot describe translated product/industry slugs or `/de/dienstleistungen` versus `/en/services` correctly.

Example, German business cards:

- Correct HTML English URL: `/en/shop/custom-business-cards`.
- HTTP header English URL: `/en/shop/personalisierte-visitenkarten`.
- HTTP x-default: `/shop/personalisierte-visitenkarten`; HTML x-default: `/de/shop/personalisierte-visitenkarten`.

The wrong-language product and industry targets respond with HTTP 200 plus streamed `NEXT_REDIRECT`/meta refresh to their real localized URLs, rather than a direct permanent HTTP redirect. They are not genuine alternate landing pages and should not be advertised as such. They are redirects, not confirmed soft-404s.

Files: `frontend/src/i18n/routing.ts:1`, `frontend/src/proxy.ts:8`; correct product metadata in `frontend/src/app/[locale]/shop/[slug]/page.tsx:28`; industry metadata in `frontend/src/app/[locale]/businesses/[industrySlug]/page.tsx:33`; static mapping in `frontend/src/lib/seo.ts:30`.

Proposed action: use the existing translation-aware HTML/sitemap implementation as the authority; either suppress middleware-generated alternate headers or generate identical, validated translation-aware headers. Resolve legacy/wrong-language slugs before streaming when permanent redirects are intended. Do not rename existing routes or WooCommerce slugs.

Acceptance: repeat DE/EN home, service, product and industry header/source comparisons; every advertised alternate should resolve directly to its own canonical HTTP-200 URL; retain reciprocity and the intended German x-default.

### H3 — Private orders use the public catalog cache default

`frontend/src/app/api/orders/route.ts:21` calls `wcApi("orders", ...)` without overriding caching. `frontend/src/lib/woocommerce.ts:23` defaults all calls to `revalidate=300` and sets `next.revalidate`. The customer ID is derived from a verified signed session and included in the upstream URL, so this is **not evidence of cross-user access**. However, private order responses should not inherit a shared server Data Cache policy or remain stale after payment. Browser/API response `Cache-Control: no-store` does not itself disable an upstream Next.js fetch cache.

Proposed action: explicitly use uncached private reads, preferably a helper policy distinguishing public catalog reads from customers/orders. Keep endpoint HTTP no-store and session ownership checks. Existing payment-order and server-cart reads already use `revalidate:0`; preserve those.

Acceptance on approved test accounts: two different sessions and an anonymous session; verify separate orders, no customer content in public HTML/RSC payloads, uncached upstream order reads, immediate status freshness, and 401 without authentication. This audit did not create/log into production accounts or retrieve their orders.

### H4 — Gallery delivery bypasses optimization even for thumbnails

`frontend/src/components/product/ProductGallery.tsx:66` and `:115` use `unoptimized` for the main image and 88 px thumbnails. Public product cards already use `canOptimizeImage`, so the project has an existing compatible approach. Some homepage/industry media consumers also serve originals; industry example: `frontend/src/components/business-industries/IndustryMedia.tsx:34`. Concurrent unpublished homepage media edits were not attributed to production.

Advertised original Content-Length totals from production HEAD requests, decimal MB:

| Gallery | Originals | Total original bytes | Main image |
| --- | --- | --- | --- |
| Business cards | 6 | 12,927,887 | 2,587,148 bytes |
| Acrylic QR/NFC stand | 11 | 22,471,996 | 2,460,575 bytes |
| 3D-printed QR/NFC stand | 15 | 36,124,005 | 2,521,360 bytes |

Browser confirmed the 1254 px business-card main image rendered at about 348 px on mobile and requests for original gallery PNGs. Totals above are gallery inventories, not a claim that every lazy image transfers on every page view. Sample origin PNG HEAD responses lacked explicit Cache-Control and Timing-Allow-Origin; zero cross-origin Resource Timing transfer sizes therefore do not mean zero downloaded bytes.

Proposed action: serve properly sized modern-format main images/thumbnails through the existing image contract; keep high-resolution originals for intentional zoom; tune lazy loading and accurate `sizes`; retain local-development image exceptions, alt text and reserved aspect ratios. Check origin media cache policy without caching private uploads publicly.

Acceptance: cold-cache throttled mobile traces for all three galleries, thumbnail payloads proportional to display size, no broken zoom or layout shift, and clear before/after transfer totals. No paid image service is required or approved by this audit.

### H5 — Merchant/variant readiness needs a separate implementation phase

`frontend/src/components/product/ProductJsonLd.tsx:71` correctly gates Offers on purchase eligibility, but emits one parent-level Offer using `product.price.amount`. A business-card page advertises EUR 35.00 while the actual purchasable configuration depends on paper, quantity and other selections. This can be a truthful entry price; the audit does not establish that this Offer is invalid. It does not describe the other variants or give a crawler a stable preselected variant URL. No ProductGroup/hasVariant implementation or Merchant feed endpoint was found. Current product routing takes locale/slug, not a validated variant selection URL contract.

All 444 published variation records have SKUs, but 56 have blank prices. `frontend/src/lib/server-cart.ts:198` explicitly treats unpriced size variants as enquiry-only. Those are **not EUR 0 products**. The 12 enquiry parent pages correctly omit Offers even if a marketing starting price is shown. Such pages may retain truthful general Product/Service content, but should not be forced into merchant listing eligibility. Google's merchant listings require purchasable landing pages. [Merchant listings](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing), [variant guidance](https://developers.google.com/search/docs/appearance/structured-data/product-variants).

Proposed feed contract:

- WooCommerce is the source of identifiers, translations, prices, sale dates, stock, images and valid variation choices.
- Include only published, intended-for-catalog, actually purchasable products/variants with positive valid prices; exclude custom-size quotation variants and all enquiry-only bundles.
- Use stable item IDs and a documented DE/EN translation/group mapping; do not generate separate invented SKUs, GTINs or MPNs.
- A variant feed link must open the matching selection, price and availability on the frontend. Preserve a parent canonical strategy; agree the URL contract before implementation.
- Validate `id`, title, description, frontend link, image_link, availability, price/currency, condition, appropriate grouping and genuine identifiers. Include accurate sale fields when applicable.
- Confirm Germany-only selling, destination-dependent shipping, delivery estimates and personalized-goods return exceptions against the actual current checkout/legal policy. Never substitute the historical jar-only or flat-rate examples for the authoritative shipping calculation.
- Check personalized-product image and policy eligibility in Merchant Center before submission. Public media must remain crawlable when backend HTML is suppressed.

Acceptance: owner-approved free-listings account/property, sample item diagnostics for simple/variable/out-of-stock/sale products, matching DE/EN landing pages and checkout totals, and no enquiry products or blank-price variants in the feed. No Merchant Center account/feed was created or submitted.

### H6 — Analytics and lead/purchase conversion tracking are not installed

`frontend/src/components/CookieBanner.tsx:12` stores `all`/`essential` in localStorage; it has no consent-category model, timestamp/version, change event or persistent reopen/revoke control. `frontend/src/components/Footer.tsx:202` has legal links but no cookie-settings action. This is not evidence of unlawful GA4 collection: no GA4 is currently present. It is a blocker to treating an added GA4 script as consent-aware.

Plan only; requires owner approval, GA4 property details and appropriate privacy review:

1. Use **basic consent mode**: no Google tag request or analytics transmission before an explicit analytics opt-in. Do not silently use advanced-mode cookieless pings. Keep `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` denied by default; enable only approved analytics storage and leave advertising purposes off unless separately approved. Google distinguishes these two modes explicitly. [Consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).
2. Add a reusable consent state with purpose choices, version/time/expiry, reopen/revoke controls and immediate consumers. Do not reinterpret existing vague `all` records as consent to a newly introduced provider without review/re-consent. Keep essential commerce/security independent of optional analytics.
3. Load GA4 only after opt-in and handle initial/subsequent Next.js route views once. Prevent automatic/manual page-view duplication. Disable automatic form tracking where custom completed-lead events are used.
4. Track `view_item`, successful `add_to_cart`, `begin_checkout` and verified `purchase` for purchasable items. Use actual WooCommerce product/variation identifiers and order economics; no personalization fields in event names/items.
5. Use a verified paid-order transition as the purchase authority, not creation of an unpaid order, add-to-cart, editable URL parameters or merely visiting `/checkout/success`. Existing authority: `frontend/src/lib/payment-transition.ts:20`, Stripe webhook and PayPal capture/webhook routes. Preserve these payment flows. Carry only an explicitly consented analytics context if server-side delivery is approved; webhook receipt by itself is not analytics consent.
6. Deduplicate durably by order/transaction and event type across refreshes, browser returns, webhook retries and both payment providers. Choose a single primary sender or a shared delivery ledger; do not assume a component mount guarantees exactly-once reporting. Use GA4 `transaction_id`, currency, items and separate tax/shipping correctly. [Ecommerce measurement](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce).
7. Emit `generate_lead` only for an actually accepted/stored enquiry with a server reference. `frontend/src/app/api/contact/route.ts:41` intentionally returns fake success for spam, whereas genuine completion returns `{success:true, reference}` at `:239`. HTTP 200 or a thank-you UI alone is insufficient. Count one successful general/product/custom-size/custom-font/bundle enquiry; do not count button clicks, failed CAPTCHA, validation errors or email retries. Storage success and email acceptance/delivery are distinct outcomes.
8. Exclude email, phone, name, address, messages, uploaded files, requested text/design details and payment secrets/order keys from all analytics. Sanitize page_location/page_referrer; suppress sensitive account/reset/confirmation URL parameters and automatic form/link capture that could include them. Keep Google Signals, advertising personalization and enhanced-conversion/user-provided-data features off unless separately approved.
9. Use DebugView/Tag Assistant on an approved test environment, test DE/EN reject/accept/revoke/revisit, navigation, duplicate returns, failed/pending/paid orders, duplicate webhooks and failed/successful leads. Mark purchase and completed lead events appropriately as key events. Record consent-based undercounting rather than backfilling unconsented users.

`frontend/next.config.ts:24` currently has a report-only CSP without Google analytics script/connect origins. Review required origins when analytics is approved; do not disable CSP or add blanket wildcards. A report-only policy currently reports rather than blocks, but would matter if later enforced.

## Medium findings, decisions and verification steps

### M1 — Public rendering and upstream request latency

Public HTML samples return `private, no-cache, no-store` and Vercel MISS, while sitemap is cached. Fetch-level catalog caching still exists; HTML MISS does not prove every WooCommerce request is uncached. Observed Vercel execution identifiers include `iad1` behind `fra1` ingress, worth reviewing against the German backend rather than assuming the execution region is Frankfurt.

`frontend/src/proxy.ts:10` performs an authenticated uncached existence request on every matching product/industry route, before rendering, and without an explicit timeout. `frontend/src/lib/woocommerce.ts:44` likewise has no request deadline; the WordPress helper already has an eight-second timeout. Product processing serially loads parent then variation pages; related products/reviews add work. `generateMetadata` and page code both map the product; Next fetch memoization may deduplicate identical calls, so do not assume every helper call is another origin request.

The 91-page HTTP sample had TTFB p50 279 ms / p75 427 ms / p95 705 ms; initial home samples were approximately 1.86 and 2.49 seconds. These are audit-run network/server measurements, not field percentiles. Public backend Store API `products?per_page=1` returned 200 in approximately 360 ms, including body retrieval. This is not a measurement of authenticated WooCommerce calls from the Vercel runtime. That needs runtime traces/logs or an approved instrumented staging run.

Action: profile before changing; add bounded public-data timeouts and reuse translation-aware existence resolution while preserving real 404 statuses. Review execution region, request waterfalls and full-route caching only for genuinely public content. Never enable shared full-page caching on personalized account/cart/checkout/API responses to improve the public-page score.

### M2 — Sitemap resilience, timestamps and growth limits

`frontend/src/app/sitemap.ts:47` catches product fetch failures and returns the accumulated inventory; industry unavailability is also swallowed. A temporary backend error can therefore yield a successful but reduced sitemap. No outage was induced and no currently missing published product was found. Product pagination is capped at 1,000 per locale. All 62 current dynamic lastmod values include a time without a timezone; normalize GMT-derived timestamps explicitly to UTC rather than leaving time interpretation ambiguous. No claim is made that the entire XML is rejected.

Product revalidation invalidates product/category data tags, but only the industry branch explicitly revalidates `/sitemap.xml` (`frontend/src/app/api/revalidate/route.ts:48` and `:99`). Whether dependency invalidation is sufficient for this deployed metadata-route cache needs verification, not an assumed stale-cache finding.

Action/acceptance: in staging simulate backend failure and verify last-good inventory or an appropriate failure instead of silently caching an incomplete sitemap; test publish/update/unpublish of both translations and sitemap freshness; normalize timestamps and test the pagination boundary. Do not execute production publication/revalidation mutations for an audit.

### M3 — Navigation favors interaction and duplicate destinations

Product cards, editorial content, footer links and industry links provide real anchors; this is not a JavaScript-only website. However `frontend/src/components/Header.tsx:112` mounts dropdown link lists only after opening them. Category chips use buttons/router.push (`frontend/src/components/shop/ShopFilters.tsx:24`), not anchors. Important discovery should not depend on a crawler clicking a menu/filter.

English footer service links target `/en/dienstleistungen/lasergravur`, `/en/dienstleistungen/laserschnitt` and `/en/dienstleistungen/3d-druck` (`frontend/src/components/Footer.tsx:188`). These return 200 with noindex and canonical English `/services/...` targets. Other internal links include `/de/services/laser`, `/de/services/3d-printing`, `/de/services`, also canonicalized duplicates. They are not broken 404 links, but the canonical destinations should be linked directly when not intentionally exposing a utility page. English legal courtesy routes intentionally noindex/canonical to German; do not casually redirect/remove forms or legal access.

Action/acceptance: render essential menu anchors in initial HTML with accessible disclosure behavior; update locale-aware service links; keep useful secondary links in content/footer. Re-crawl raw HTML and keyboard-test both navigation versions. Verify intended duplicate/utility routes rather than globally rewriting them.

### M4 — No indexable product-category landing pages

Both `/de/shop?category=127` and its English counterpart are noindex and canonical to the unfiltered shop. `frontend/src/app/[locale]/shop/page.tsx:34` explicitly does this for category/sort/search state; category descriptions are not standalone SEO landing pages. This is an intentional anti-duplication design, not a broken category implementation. If category search demand matters, new localized taxonomy landing routes need a separately approved content-model phase, unique copy and reliable category translations. Do not simply index every parameter combination. Category numbers are locale-specific; changing language must resolve the translated category instead of copying an ID blindly.

The same page requests 50 products and has no pagination UI (`:79`); only 23 parents per locale currently exist, so no present truncation was demonstrated. Test beyond 50 as the catalog grows and provide crawlable pagination/discovery as required.

### M5 — Alt text exists, but localization and specificity need work

No missing `alt` attributes were found in the crawled HTML. Empty thumbnail alt attributes are deliberate duplicates with labelled controls and are not automatically defects. Gallery mapping falls back to the product title (`frontend/src/lib/product-page.ts:469`), and cards always use the product name rather than the media alt (`frontend/src/components/ProductCard.tsx:46`). The English business-card gallery still shows German alt text: “Gestaltungsbeispiele für personalisierte Visitenkarten.” Raw attachment metadata has 46 empty-alt references across 256 gallery references, with 128 unique media attachments overall; localization overrides and frontend fallback mean these are not 46 visibly missing alts.

Some acrylic image filenames are UUIDs, while other products have useful descriptive names. Action: audit media by locale/visual role, improve concise factual DE/EN descriptions, retain appropriate decorative empty alts, and prefer descriptive names for new assets. Do not churn existing image URLs solely for keywords; any rename needs media-link preservation/redirects. Verify visible gallery, cards, OG alt and WordPress localized overrides together.

### M6 — Metadata polish and social previews

All 91 sitemap pages had titles/descriptions, but 20 descriptions exceeded 200 characters and 13 titles exceeded 100 characters. Business-card title/description were 110/268 characters. This is a likely truncation/editorial issue, not a fixed Google character-limit violation. Standard products use full commercial names/short descriptions (`frontend/src/lib/product-page.ts:456`); kits can provide dedicated SEO fields. Twenty-nine pages lacked `og:image`, including the generic homepage metadata path in `frontend/src/lib/seo.ts:163`.

Action: approve natural, page-specific localized SEO wording and a truthful generic social image; retain full product names where needed in commerce. Recheck uniqueness, clarity, social previews and canonical consistency. Avoid artificial keyword stuffing or hard-coded replacement prices.

### M7 — Preview and alias safeguards require deployment verification

`frontend/src/lib/seo.ts:69` returns noindex for `VERCEL_ENV=preview`; robots disallows all and sitemap returns no URLs in that mode. Targeted tests passed. This is good code-level protection, not verification of every deployed preview. The guard checks configured site origin and environment, not the actual request hostname: a production-environment alias may share indexable production metadata unless the platform independently protects it.

No Vercel CLI/project linkage, authenticated dashboard, preview URL, firewall export or environment/region settings were available. Action: enumerate real preview/staging/production-alias URLs in Vercel; inspect authentication protection plus HTTP X-Robots-Tag/meta directives and sitemap behavior. Do not rely on robots alone to keep an already linked preview out of results. Never expose production customer data or live payment credentials in previews. No paid protection service is prescribed.

### M8 — Search Console, Bing and field performance are unverified

No frontend Search Console verification metadata was found. Public apex TXT lookups for both domains returned ENODATA during this audit. Neither observation proves that ownership has never been verified or that a previous verification has expired; other methods and historical verification may apply. No Search Console, Bing Webmaster, GA4 or Merchant Center account reports were accessible.

Plan: owner creates/verifies a Search Console Domain property via the DNS provider's actual authoritative zone (not automatically Vercel just because it hosts the frontend), approves the DNS record, and retains it. A URL-prefix HTML/meta verification is an alternative, not a reason to invent a token. Submit the frontend sitemap, inspect canonical/alternate selection and sample product/industry URLs, and monitor Page indexing, Crawl stats, Product/Merchant enhancements and CWV. Verify Bing ownership separately or import the verified Google property if the owner chooses. Separate backend monitoring may help confirm deindexing. [Search Console verification](https://support.google.com/webmasters/answer/9008080).

Mobile browser lab sample: successful initial runs had LCP approximately 0.50–1.89 seconds and measured CLS 0, on an unthrottled headless desktop machine using a 390 px mobile viewport. This is **not a CWV pass**. No representative INP interactions or p75 field data were collected. DE checkout first timed out waiting for network-idle; a bounded DOM-content-loaded retry returned 200, so the first timeout is not evidence that checkout failed. The free PageSpeed API returned quota error 429, not a site performance score. Get production field p75 LCP/INP/CLS and repeat throttled Lighthouse/PageSpeed tests before setting a baseline. [Web Vitals measurement](https://web.dev/articles/vitals).

Concurrent-work qualification: by the end of this audit, another workspace change added `@vercel/speed-insights` and `<SpeedInsights />` to the locale layout. That is performance monitoring, not GA4 ecommerce analytics, and was absent from the initial deployed/browser evidence. This audit did not add or enable it, verify its dashboard/billing settings, or authorize deployment. Review its data collection, sensitive-URL handling, privacy requirements and plan usage separately; do not assume it supplies GA4 conversions or retroactive field measurements.

### M9 — IndexNow and AI crawler policy

`frontend/src/app/robots.ts:16` allows ordinary crawlers and explicitly OAI-SearchBot, blocking `/api/`; GPTBot is currently allowed through the general rule. Synthetic user-agent probes returned 200, without an observed HTML challenge on the homepage. These requests originated from the audit machine, not verified provider crawler IPs; they do not certify Vercel/STRATO/CDN firewall treatment. No claim that Cloudflare CDN is deployed follows from the use of Turnstile.

Owner decision: search discovery via OAI-SearchBot and model-training access via GPTBot are independent. Keep that distinction explicit. Review WAF/bot rules and logs against published verified-crawler identities/IP ranges; allow required public HTML, sitemap, CSS/JS and product media without exposing protected APIs or weakening form CAPTCHA. Repeat representative product/industry crawler requests and review 403/429/challenge rates. [Official OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

IndexNow is absent, an optional freshness feature rather than a prerequisite. If approved, host an ownership key on the canonical frontend and have authenticated WordPress publish/update/delete events submit changed canonical DE/EN frontend URLs through a retryable, deduplicated sender. Include removed URLs as removal signals; never send drafts, backend URLs, account/cart/checkout or every URL on every request. IndexNow's key is a publicly hosted ownership proof, not a replacement for authentication on the trigger. Review acknowledgements in Bing. [IndexNow protocol](https://www.indexnow.org/documentation).

`/llms.txt` returns 404. That is not a technical SEO defect: do not sell a special AI file/schema as a ranking requirement. Prioritize crawlable, accurate, useful localized product/service content, consistent entity information and real evidence. Google's current AI-search guidance does not require such files or special AI schema. [Google AI guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

### M10 — Dotted unknown product paths return a soft HTTP status

The proxy matcher excludes every path containing a dot (`frontend/src/proxy.ts:137`). `/en/shop/no-such-product.seo-audit` therefore bypassed its existence check: the response was HTTP 200 with streamed `NEXT_HTTP_ERROR_FALLBACK;404` and noindex. The corresponding ordinary unknown product path correctly returned 404. No currently valid sitemap URL exhibited this issue.

Action/acceptance: distinguish real asset extensions from dynamic slugs and return correct pre-stream HTTP 404s for invalid paths. Test dotted, encoded, Unicode, wrong-language and legacy slugs; keep static assets and API matching intact. Do not replace valid product failures with blanket redirects to the shop.

## Structured data and privacy checks worth preserving

- Homepage emits server-side OnlineStore and WebSite with stable IDs, business email/address and an accessible logo URL. OnlineStore is an Organization subtype. Do not add a walk-in LocalBusiness storefront, geo, opening hours, service area or social profiles without confirming actual eligibility and visible facts (`frontend/src/components/seo/SiteJsonLd.tsx:10`). No local eligibility claim was established by this audit.
- Product and BreadcrumbList JSON-LD is server-generated and safely escapes `<`; prices, stock, SKU and review aggregates come from WooCommerce. Current basic counts and sampled values matched the inventory. This is not a completed Google Rich Results Test for every variant.
- Product category breadcrumb URLs point to noindex filters; this does not automatically invalidate BreadcrumbList, but should be reconsidered if real category landings are approved. Seller references could reuse the existing organization ID to improve graph consistency without inventing entities.
- Enquiry-only parents correctly lack merchant Offers. Do not fabricate an Offer or rating to silence rich-result warnings on a quotation page. Shipping/returns schema requires actual current policy and product exceptions, not guessed global promises.
- Product/shop/industry content exists in fetched HTML, not solely as post-load API content. Some dynamic content arrives in Next.js streamed hidden fragments before being moved into place by the runtime. Non-JS extraction should be checked on representative product/industry pages with real crawler tools; presence in source alone is not proof every AI consumer extracts it. Do not introduce crawler-specific invented content.
- Public catalog requests use tags and a five-minute revalidation default; WordPress events use authenticated, timestamped signatures. Do not remove these mechanisms while optimizing.
- Account/cart/checkout pages inherit noindex layouts. Sessions are signed and HttpOnly/Secure in production; API responses have no-store headers (`frontend/next.config.ts`), while cart/checkout totals and purchase eligibility are server-validated against fresh reads. These good controls do not excuse H3's private upstream caching default.
- Turnstile remains a form-action security check; ordinary page browsing did not trigger a site-wide CAPTCHA in the inspected flows. No CAPTCHA or rate limits were bypassed. One anonymous auth-session probe received 429 during repeated browser loads, consistent with the existing 10/minute auth-path policy; it was not counted as proof of a general production outage.

## Verification record and reproducibility

Non-production audit artifacts are under `/tmp/kubikart-seo-2026-10-19/`: full public crawl `results.json`, raw response bodies, `probes.json`, `browser.json`, `responsive.json`, `media.json`, `nav.json` and the PageSpeed error response. They contain public page data and sampled response headers, not authenticated orders. `/tmp` is temporary; this report is the durable findings record.

Checks performed:

1. Read route/layout/SEO/sitemap/robots helpers, product mapping/JSON-LD, navigation, images, consent, auth/session, orders, cart validation, payment transition and revalidation code.
2. Read-only production crawl of all 91 sitemap URLs (maximum three parallel requests), plus representative private shells, invalid slugs, parameter filters, canonicalized utilities, media/robots/sitemaps, redirects and synthetic crawler requests.
3. Read-only STRATO SSH: `wp option get blog_public`, `home`, active plugin inventory, published catalog aggregates, `.htaccess` and SHA-256 comparison of security/revalidation plugins. No deploy script or deployment preflight was run.
4. Headless Chromium GET-only browser observations, screenshots, resource/performance observations and four-width responsive samples. No full paid-commerce flow was executed.
5. Source/DNS checks for verification and tracking; official Google/OpenAI/IndexNow documentation checked for current recommendations.

Reproduce targeted local tests:

```sh
pnpm --filter frontend test src/__tests__/app/robots.test.ts src/__tests__/lib/seo.test.ts src/__tests__/lib/business-industries-sitemap.test.ts src/__tests__/lib/woocommerce-publication.test.ts src/__tests__/lib/purchase-mode.test.ts src/__tests__/lib/auth-session.test.ts src/__tests__/api/purchase-mode-enforcement.test.ts
pnpm --filter frontend typecheck
pnpm --filter frontend lint:ci
```

Results: **7 test files / 37 tests passed; typecheck passed; lint with zero warnings passed.** These support source contracts; they do not replace the deployed crawl/browser evidence. No production build/restart was performed because no application code was changed and audit scope did not authorize deployment changes. No claim of a freshly verified production build is made.

For HTTP verification use GET responses, not just HEAD: compare `curl -sS -D - https://kubikart.de/de/shop/personalisierte-visitenkarten` with its HTML canonical/hreflang; inspect sitemap/robots and the backend product; repeat invalid-slug probes and private/API no-store checks. Do not share captured account/reset/payment URLs or authentication cookies in tickets.

## Recommended approved work order and completion contract

1. Approve a narrow SEO correctness/privacy phase: backend duplicate policy, single hreflang authority, private order no-store, correct pre-stream redirects/404s. Confirm real preview protection separately.
2. Optimize gallery delivery and profile backend latency/region, preserving high-resolution zoom, source data and all commerce controls. Include unpublished owner image-delivery changes in a separate review, not in this audit's diff.
3. Harden sitemap failure/update behavior; improve canonical internal links, alt localization and metadata. Treat new category routes as a separate owner-approved phase.
4. Obtain owner-controlled Search Console/Bing verification and baseline exports; agree GA4 consent/property/privacy choices before implementing the conversion plan.
5. Only then validate a purchasable-only Merchant feed/variant landing contract and optionally add IndexNow. No paid services are required or approved here.

Completion summary: scope delivered is this audit/report only; repository file added by this task is this document. Application/commerce/localization behavior and existing styles were not changed, so legacy styling remains as before. Known limitations are dashboard/firewall/preview access, search/analytics account access, authenticated production-customer testing and CWV field data. These are explicit follow-up gates, not silently passed items. The next phase should be the narrowly scoped correctness/privacy fixes in item 1 after approval, not a site-wide rewrite.
