# SEO remediation — implementation and handoff

Date: 19 October 2026. Follow-up to [the technical audit](2026-10-19-technical-seo-analytics-ai-search.md).

## 1. Scope implemented

This is a repository/local-QA implementation, **not a production deployment**. Production was used only for authenticated GETs of published catalog/industry identities and public media, allowing the isolated frontend to render real product data. No production products, customers, orders, emails, DNS, dashboards, payment settings or bot rules were changed. The existing localhost:3000 server/build was not stopped or overwritten. Temporary QA used port 3658.

The owner chose **Vercel Web Analytics instead of GA4**, with **free features only**. No GA4 integration, Vercel custom-event tracking, paid upgrade or conversion-as-pageview workaround was added.

| Audit item | Implemented result | Remaining boundary |
| --- | --- | --- |
| H1 backend duplicates | New must-use plugin adds backend HTML noindex meta/HTTP headers and disables WordPress sitemaps, leaving media, REST, admin and commerce authentication intact | Must deploy that plugin to STRATO; actual search removal requires recrawling/Search Console review |
| H2 conflicting hreflang | Disabled next-intl generic HTTP alternates; retained translation-aware HTML/XML alternates. Wrong-language product/industry requests resolve to HTTP 308 before streaming | Deploy frontend and repeat production crawl |
| H3 private fetch cache | Only public product GETs may use the shared catalog cache. Orders/customers/coupons and mutations are no-store; account orders also explicitly request fresh reads | Two-account production regression remains an owner-approved follow-up; no private customer data was retrieved here |
| H4 oversized galleries | Public-host main/thumbnail images use Next optimization; local-host exceptions and original-resolution zoom remain. Industry media uses the same policy | Deployment; broad field-performance baseline still needed |
| H5 merchant/variant readiness | Preserved enquiry/purchase separation; Product graphs now have stable canonical IDs/URLs and reuse the organization seller ID | A variant deep-link/feed implementation and Merchant Center setup are **not completed** by this phase; do not submit the current parent-only data as a validated variant feed |
| H6 analytics | Shared consent remains in place; added versioned/time-limited opt-in, legacy re-consent and fail-closed storage handling. Web Analytics and Speed Insights drop private URLs and strip queries/fragments | Dashboard activation/usage/privacy review remains external. Purchase/lead custom events deliberately not enabled: owner declined paid features |
| M1 upstream latency | Minimal identity payloads, one eight-second identity deadline, eight-second WooCommerce read deadline and uncached private reads | Proxy still performs a fresh public-identity lookup to preserve real HTTP statuses; no unverified shared/in-memory cache or region change introduced |
| M2 sitemap reliability | Whole-regeneration failure instead of partial success; explicit five-minute ISR; UTC source timestamps; product/category event sitemap invalidation; safety cap now 10,000 products/locale and throws rather than silently truncating | Deployment and staged outage/publish/unpublish cache-retention checks |
| M3 navigation | Dropdown anchors now exist in initial HTML with closed-state hiding; English footer points at canonical services; product service CTA respects locale | Other editorial links and utility/category navigation remain intentionally unchanged |
| M4 category landings | Existing noindex filters preserved | New indexable categories and pagination beyond the existing 50-product view are separate content/catalog work; not silently enabled |
| M5 alt text | Product cards now prefer actual media alt text over a repeated product title | Image-by-image DE/EN authoring and safe legacy filename migration remain content work; existing assets were not renamed or descriptions invented |
| M6 metadata | Shared metadata now supplies a real product-based social image and localized alt text | Long titles/descriptions need editorial review; they were not arbitrarily cut under a supposed fixed Google character limit |
| M7 previews/aliases | Added request-host/environment X-Robots-Tag protection for noncanonical frontend hosts; private routes get explicit noindex/no-referrer headers | Real Vercel preview protection, custom routes and firewall settings need dashboard access/verification |
| M8 search/field data | No fake verification token or performance baseline added | Owner-controlled Search Console/Bing verification and field data still needed |
| M9 AI/IndexNow | Existing OAI-SearchBot access and separate training-bot policy preserved | IndexNow is optional, not installed; verified-crawler WAF/log checks and GPTBot policy remain owner decisions |
| M10 dotted slugs/statuses | Dynamic product/industry matchers include dotted slugs. Missing resources get localized no-store HTTP 404; outages get 503/no-store/Retry-After | Production activation and crawler recrawl |

The new backend policy is **HTML noindex**, not a blanket backend-domain redirect or `Disallow: /`. This avoids blocking WooCommerce/WordPress integration and product-image discovery. `blog_public` was not changed. WordPress sitemap URLs become 404; public media URLs stay accessible.

## 2. Files changed by this remediation

Core routing/cache:

- `frontend/src/lib/public-route.ts` (new): minimal published identity/translation resolution, bounded failure handling.
- `frontend/src/proxy.ts`: pre-stream 308/404/503 responses; host noindex; dotted-slug matching. Direct 404 HTML avoids Next's static fallback replacing no-store with a year-long cache lifetime.
- `frontend/src/i18n/routing.ts`: disable conflicting automatic alternate headers.
- `frontend/src/lib/woocommerce.ts`, `frontend/src/app/api/orders/route.ts`: public/private cache policy and request deadlines.
- `frontend/src/app/sitemap.ts`, `frontend/src/lib/wordpress.ts`, `frontend/src/app/api/revalidate/route.ts`: complete inventories, UTC dates and refresh lifecycle.
- `frontend/next.config.ts`: no-referrer/noindex on private page families.
- `backend/wordpress/wp-content/mu-plugins/kubikart-headless-seo.php` (new): backend HTML/sitemap policy.

Media/navigation/metadata:

- `frontend/src/components/product/ProductGallery.tsx`
- `frontend/src/components/business-industries/IndustryMedia.tsx`
- `frontend/src/components/ProductCard.tsx`
- `frontend/src/components/Header.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/src/components/product/ProductLeadCTA.tsx`
- `frontend/src/components/product/ProductJsonLd.tsx`
- `frontend/src/lib/seo.ts`

Measurement privacy:

- `frontend/src/lib/analytics-privacy.ts` (new), `frontend/src/components/PrivateSpeedInsights.tsx` (new).
- Small integration changes in existing/concurrently edited `CookieBanner.tsx` and locale `layout.tsx` preserve the owner's Vercel integration.
- `frontend/src/lib/cookie-consent.ts`: preserves the existing choice/event API, adds provider version, timestamp, 180-day opt-in renewal and fail-closed reads/writes. Legacy rejection remains rejection; legacy generic acceptance prompts again.

Tests added/extended:

- New `frontend/src/__tests__/app/proxy-seo.test.ts`, `app/sitemap-reliability.test.ts`.
- New `frontend/src/__tests__/lib/public-route.test.ts`, `woocommerce-cache-policy.test.ts`, `analytics-privacy.test.ts`, `cookie-consent.test.ts`.
- Extended product-gallery, cookie-analytics, SEO, industry-sitemap and revalidation tests.
- New `backend/tests/plugins/KubikartHeadlessSeoTest.php`.

Other homepage, package/lock, privacy-copy, loading/navigation and documentation changes were being made concurrently. They were preserved, not reverted or claimed as this remediation's work. This task did not rewrite legal text, introduce dependencies, alter selling policy or rename routes/products/SKUs.

## 3. Existing behavior preserved

WooCommerce remains the authority for product data, prices, variants, stock and purchase mode. Product galleries keep their square uncropped layout, thumbnail navigation and full-resolution zoom. Personalization controls, required uploads, set quantities, cart state, coupons, shipping/tax calculations, payment transitions, account authentication and transactional email code were not replaced. Enquiry-only bundles and unpriced custom-size options remain non-purchasable. Consent controls do not disable essential cart/security functions. Existing page-level canonical/hreflang metadata remains in place.

No live purchase/email or authenticated customer-account inspection was performed. Passing unit tests and anonymous shell checks are not represented as a completed live-payment regression.

## 4. Legacy styling

No visual redesign or global token removal was performed. Existing gallery, header/footer and consent styles remain; the compact server-side missing-page response uses approved navy/warm-background colors. Legacy styling elsewhere is unchanged.

## 5. Commands and verification

```sh
pnpm --filter frontend test
pnpm --filter frontend lint:ci
pnpm --filter frontend typecheck
git diff --check
docker exec kubikartbackend_appserver_1 bash -lc 'cd /app && vendor/bin/phpunit'
```

Production-mode builds used an isolated copy under `/tmp/kubikart-seo-fixes-aTmodQ`, `node --use-system-ca .../next build --webpack`, and the existing dependency installation. No real deployment or source-directory `.next` overwrite was performed. The initial copy reported unsupported group-attribute warnings; subsequent copies used `rsync -rt` with node_modules/.next/.pnpm-store exclusions. An accidental build invocation at the repository root failed because there is no root app directory; the intended isolated builds passed. The temporary duplicated package-store copy was removed. These tooling issues were not hidden as successful builds.

Real-browser assertions ran against the isolated production-mode server, using published production catalog GETs and public media. Browser non-GET requests were blocked; Vercel measurement scripts were stubbed for consent tests so no analytics were submitted. Public-source and header checks supplemented browser-rendered checks.

## 6. Results

- Latest combined frontend suite: **80 files / 501 tests passed**. This includes concurrent owner work as well as this remediation's regressions.
- Lint with zero warnings, TypeScript and `git diff --check` passed.
- Isolated production build passed. Sitemap output explicitly has a five-minute revalidation interval.
- Backend suite: **206 tests / 784 assertions passed**, with **two deprecations reported by the suite**; no claim of a warning-free backend run.
- DE/EN homepage, business cards, acrylic stand and enquiry bundle: **32 viewport checks** at 360/768/1024/1440 px, no overflow or page errors. Gallery change/zoom/close and desktop menu open/Escape checks passed.
- Wrong-language product/industry requests returned HTTP 308 to the canonical translated slug, rather than a streamed 200.
- Ordinary/dotted missing product/industry probes returned real HTTP 404/no-store.
- Both locales' account/cart/checkout shells were private/no-store/noindex and no-referrer. Anonymous orders returned 401.
- QA sitemap: 91 URLs, no account/cart/checkout entries, UTC lastmod values.
- Resizing the same production business-card image: **3,044-byte WebP at 128 px**, **33,860-byte WebP at 640 px**, versus the **2,587,148-byte original**. This is a measured image example, not a promised field-CWV score or an entire-page payload comparison.
- DE/EN consent browser checks passed for legacy opt-in rejection, explicit new opt-in, public URL query/fragment stripping, private-route event exclusion and revocation. Storage failure and expiry are covered by unit tests.
- Local WordPress product HTML returned both noindex meta and X-Robots-Tag; `/wp-sitemap.xml` returned 404. Authenticated catalog reads and public image delivery continued working. STRATO production policy was not changed.

QA evidence/scripts: `/tmp/kubikart-seo-fixes-browser.json`, `/tmp/kubikart-seo-consent-browser.json`, corresponding browser scripts and the isolated build. These temporary artifacts are not a deployed monitoring system. The QA server was stopped after testing. Its temporary `.env.local` copy and the failed root-build's two trace files were removed; original environment/source files were not deleted. The isolated package-store duplicate was also removed. All removed files were task-created copies/artifacts and can be regenerated; no user data was removed.

## 7. Limitations and production activation

1. Production fixes require an approved frontend deployment plus targeted deployment of the new backend must-use plugin. Do **not** run a destructive full database/content import to ship this small plugin.
2. Review all concurrent changes before deployment; a successful isolated snapshot does not approve later edits or legal copy authored in another workstream.
3. Vercel Web Analytics dashboard enablement, quota/usage and privacy review remain owner responsibilities. Custom conversion events are available on Vercel Pro/Enterprise, so they are deliberately absent under the owner's free-only decision. WooCommerce orders and stored enquiries can provide outcome counts, but not Vercel conversion attribution. [Vercel custom-event availability](https://vercel.com/docs/analytics/custom-events).
4. Search Console/Bing ownership, production preview/WAF rules, actual verified-crawler access and real-user CWV cannot be certified from repository code alone.
5. Merchant feed/variant landing links, indexable category content/pagination and per-image bilingual alt/editorial metadata work remain explicitly unfinished; the original audit is not marked fully resolved.
6. Public identity checks still incur a backend round-trip. They now return small bounded responses and correct failure statuses; eliminating that round-trip requires a separately validated cache/invalidation design, not a process-local Map on Vercel.

## 8. Recommended next phase

Approve activation of the reviewed technical fixes and repeat the production sitemap/header/image/privacy checks. Then implement and validate the purchasable-only variant/feed contract with Merchant Center, alongside owner-controlled search verification and editorial DE/EN product-image metadata. Keep free analytics unless the owner explicitly changes the plan decision.
