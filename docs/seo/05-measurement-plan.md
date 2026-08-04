# SEO measurement plan

## Baseline

Record a baseline on launch day and retain screenshots/exports. No baseline numbers are asserted in this report because owner analytics/search accounts were not connected.

| Area | Source | Metrics | Cadence |
|---|---|---|---|
| Google visibility | Search Console | clicks, impressions, CTR, average position by page/query/country/device; indexed vs submitted pages | weekly first 8 weeks, monthly thereafter |
| Bing/AI discovery | Bing Webmaster Tools | indexed pages, crawl errors, search performance, sitemap status | weekly/monthly |
| Ecommerce SEO | Search Console Shopping reports + WooCommerce | valid/invalid merchant listings, organic product sessions, add-to-cart, checkout, revenue | weekly/monthly |
| Technical quality | Search Console CWV + PageSpeed/Lighthouse | LCP, INP, CLS at p75 where field data exists; lab TTFB and payload diagnostics | per release and monthly |
| Crawl/indexation | Search Console + server/CDN logs | canonical selection, excluded pages, 404/5xx, Googlebot/Bingbot/OAI-SearchBot response codes | weekly after launch, monthly stable state |
| Local demand | Search Console and Google Business Profile if verified | Ulm/Neu-Ulm query impressions, website actions, calls/directions only where configured | monthly |
| Content outcomes | Search Console + privacy-approved analytics | landing-page organic visits, engaged sessions, quote submissions, organic assisted revenue | monthly |

## Segments

Maintain separate views for German/English; home/shop/product/service/industry; branded/non-branded; local-intent/general; mobile/desktop; and indexable/noindex URL families. Product performance should use WooCommerce IDs or canonical slugs without duplicating prices in analytics code.

## Initial success criteria

Use directional targets until four to eight weeks of reliable data exists:

- 100% of sitemap URLs return 200, are self-canonical, and are intended to index.
- Zero preview/staging URLs indexed.
- Zero invalid Product rich-result items; warnings are triaged against real available data.
- No growth in soft 404, duplicate canonical, redirect-chain, or server-error groups.
- CWV passes at p75 when sufficient field data exists; lab regressions block releases when materially worse than the recorded baseline.
- Organic conversions are measured only after consent-safe analytics is approved and verified.

## Experiment rules

Change one meaningful page group at a time, annotate releases, and wait for adequate impressions before judging titles or content. Do not infer causality from rank snapshots. Never manufacture copy, reviews, location pages, or schema solely to move a metric.

## Reporting

The monthly report should include: changes shipped; crawl/indexation health; top gaining/declining pages and queries; German/English split; local-intent split; merchant/schema errors; CWV; organic enquiries/revenue if lawfully measured; and the next three evidence-based actions. Explicitly label missing data and external blockers.
