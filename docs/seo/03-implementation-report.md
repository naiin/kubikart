# SEO implementation report

## Implemented

- Centralized localized metadata with canonical, `de`/`en`/`x-default` alternates, robots directives, Open Graph, and Twitter metadata.
- Environment-aware indexation: production Kubikart host only; previews and local/staging hosts are blocked, noindexed, and omitted from sitemap output.
- Production robots allows search crawlers including an explicit `OAI-SearchBot` group and blocks non-content `/api/` endpoints.
- Dynamic sitemap covers valuable static pages, visible published products, and translated WordPress industries; it excludes hidden products, account/checkout/search flows, and duplicate utility routes.
- Product metadata uses localized WooCommerce content and images. Product schema uses real SKU, image, rating, price, stock, and purchasability only.
- Online store/website, collection, item-list, industry, and breadcrumb schemas are serialized safely.
- English and German product/category media use slug-aligned filenames and localized descriptive alt text through the WordPress gallery assignment script.
- Duplicate personalized-gift/custom-request URLs consolidate to `/shop` and `/kontakt` respectively.

## Intentionally not implemented

- No fake city landing pages, reviews, local-business claims, service areas, opening hours, social profiles, shipping times, or return policies.
- No `llms.txt` workaround.
- No IndexNow endpoint/key: this requires a secret/key lifecycle and deployment/WordPress publication trigger. It is an optional freshness enhancement, not a substitute for sitemap discovery.
- No analytics or advertising tags: provider/account/consent decisions belong to the owner.
- No Merchant Center or OpenAI feed submission without owner accounts, credentials, and feed validation.
- No new product-category routes; repository content ownership explicitly defers them.

## Files in this SEO phase

- `frontend/src/lib/seo.ts`
- `frontend/src/app/robots.ts`
- `frontend/src/app/sitemap.ts`
- localized root, product, industry, shop, and duplicate-route metadata files
- JSON-LD components under `frontend/src/components/seo`, `product`, `shop`, and `business-industries`
- WooCommerce/product mapping types for real SEO fields
- SEO/robots tests under `frontend/src/__tests__`
- `backend/scripts/assign-wordpress-product-galleries.php`
- `docs/seo/*`

## Preserved behaviour

WooCommerce retrieval, variations, personalization, inventory, cart, checkout, payment, account, reviews, WordPress industries, localization, caches, routes, slugs, and environment-variable names remain intact.

## Known limitations

- No live Search Console, Analytics, Merchant Center, backlink, CWV field, or Semrush data was available.
- Lando/WordPress was unavailable during the final audit, so product/category inventory must be rechecked before launch.
- The production host, redirects, firewall access for legitimate crawlers, and generated HTTP status codes require deployed-environment verification.
- Product images remain unoptimized by Next because they originate from the existing WooCommerce media contract. Validate CDN response formats and caching before altering it.

## Verification results — 2026-08-03

- `pnpm --dir frontend typecheck`: passed.
- `pnpm --dir frontend test`: 27 files and 159 tests passed.
- `pnpm --dir frontend build`: passed with Next.js 16.2.7.
- `pnpm --dir frontend lint`: failed only on five pre-existing `@typescript-eslint/no-require-imports` errors in `scripts/generate-widerruf-pdf.cjs` and `scripts/get-mailtrap-account.cjs`; no SEO source error was reported.
- `git diff --check`: passed.
- Local production runtime: `/robots.txt` returned `Disallow: /`, `/sitemap.xml` returned an empty URL set, and `/de` rendered `noindex, follow`, proving non-production protection. The canonical correctly followed the configured local site URL rather than pretending to be production.
- Formatter: no Prettier executable is configured in the frontend; no dependency was added.
