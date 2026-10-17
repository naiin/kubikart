# SEO

Keyword ownership, structured data, implemented scope, launch checklist and measurement. Slugs and publishing rules for editors are in the [owner handbook](02-owner-handbook.md).

## 1. Keyword and page map

This is an intent map, not a volume report. No Semrush account or keyword-volume export was available. German is the default market language; English pages target equivalent English-language intent without translating German keywords mechanically.

| Priority | Intent cluster | Primary page | Supporting pages / links | Notes |
|---|---|---|---|---|
| P1 | QR-/NFC-Aufsteller für Google-Bewertungen | `/de/shop` and matching product URLs | home, business kits, industries | Product URL is the transaction target when a matching purchasable product exists. Never promise review outcomes. |
| P1 | Öffnungszeiten-Aufkleber / Schaufensterbeschriftung Ulm & Neu-Ulm | `/de/dienstleistungen` | contact, relevant products, industries | Keep scope to small vinyl/window products; no car wraps or complex facade installation. |
| P1 | Speisekarten und Preislisten für lokale Betriebe | `/de/services/printing-menus` | gastronomy industry pages, contact, products | Use actual print/lamination and outsourced capabilities only. |
| P1 | Lasergravur Ulm / personalisierte Laserprodukte | `/de/dienstleistungen/lasergravur` | laser cutting, shop products, contact | Do not claim clear-acrylic capability unsupported by the current diode laser. |
| P1 | 3D-Druck Ulm / individuelle Halter und Prototypen | `/de/dienstleistungen/3d-druck` | product pages, contact | Avoid industrial certification or mass-production claims. |
| P1 | Business Visibility Kit / Starterpaket | `/de/services/brand-kit` | home, services, industries | Purchasable kit pricing must remain WooCommerce-owned. |
| P1 | personalisierte Geschenke | `/de/shop` and product URLs | home, about | `/personalisierte-geschenke` is a duplicate utility URL and should not become a competing index target. |
| P2 | Werbeschilder / kleine Firmenschilder Ulm | `/de/dienstleistungen` | contact, industries | Current offer: small wood/PVC/acrylic-style products subject to real production limits. |
| P2 | QR-Menü / Tischaufsteller für Restaurant | matching product URL or `/de/services/printing-menus` | gastronomy industry page | Choose product URL for buy intent, service URL for project/quote intent. |
| P2 | Logo-Aufkleber und Geschäftssticker | `/de/dienstleistungen` | shop, contact | Do not describe light-use Epson output as long-term professional outdoor signage. |
| P2 | Lösungen für Restaurants, Salons, Einzelhandel | localized `/businesses/[slug]` | services, kit, matching products | WordPress-owned industries must remain unique and useful; no thin city × industry pages. |
| P3 | Sonderanfertigung / individuelles Projekt | `/de/kontakt` | products and service pages | `/sonderanfertigung` canonicals to contact. |
| P3 | Local visibility products / QR and NFC stands | `/en/shop` and product URLs | `/en/services`, business kits | English informational and product demand; local geography may still be named accurately. |
| P3 | custom laser engraving / 3D printing near Ulm | corresponding `/en/services/*` | contact, products | English pages need native wording, not duplicate German copy. |

### Page ownership rules

- One indexable URL owns each primary intent. Filters and search parameters do not become category landing pages.
- Product detail pages own exact transactional product queries; service pages own consultative/project queries; industry pages own use-case discovery.
- German and English equivalents use hreflang only when both exist. German is `x-default`.
- New city pages require distinct, useful local proof and owner approval. Do not create doorway pages for Ulm, Neu-Ulm, Blaustein, or Augsburg.
- Internal anchor text should describe the destination naturally: product name, service name, or business use case—not repeated exact-match keyword stuffing.

### Content gaps for owner/CMS work

1. Confirm which current WooCommerce products correspond to QR/NFC stands, opening-hours decals, menus, small signs, and personalized gifts.
2. Add unique product copy covering material, dimensions, customization, care/use constraints, and delivery/pickup only when operationally true.
3. Add real photography and process evidence. Never fabricate customers, testimonials, results, lead times, or before/after claims.
4. Consider category landing routes only in a later approved content-model phase with stable WordPress taxonomy translations and unique copy.

## 2. Structured data inventory

| Template | Current graph | Source of truth | Status / decision |
|---|---|---|---|
| Homepage | `OnlineStore`, `WebSite` | legal/business data and site config | Implemented server-side. Address is the legal business address, not a claim of a walk-in storefront. |
| Product detail | `Product`, conditional `Offer`, `AggregateRating`, `BreadcrumbList` | WooCommerce product, stock, price, SKU, reviews, images | Implemented. Offer omitted when not purchasable or price is invalid. Reviews emitted only from real review totals. |
| Shop overview | `CollectionPage`, `ItemList`, `BreadcrumbList` | rendered WooCommerce results | Implemented. No Product offers invented at listing level. |
| Industry detail | `WebPage`, `BreadcrumbList`, referenced products | WordPress industry and WooCommerce products | Implemented; CMS-authored JSON is safely serialized. |
| Business kit overview | `CollectionPage` / breadcrumbs as implemented | WooCommerce kit products | Implemented without hard-coded commercial data. |
| Standard service pages | none beyond site graph | visible localized copy | Acceptable. Add `Service` only after confirming a consistent visible provider/service-area model; rich-result benefit is limited. |
| FAQ page | no FAQ rich-result schema | visible FAQ | Deliberately omitted. Google limits FAQ rich results primarily to authoritative government/health sites; markup would not create a general entitlement. |
| Legal/contact/account flows | none | visible content | Correct. No schema needed. |

### Identifier policy

- Site organization: `https://kubikart.de/#organization`
- Website: `https://kubikart.de/#website`
- Product URLs: canonical localized frontend URL
- Never generate placeholder SKU/GTIN/MPN. Use WooCommerce identifiers only.
- Never emit fake ratings, reviews, prices, inventory, opening hours, social profiles, geo-coordinates, or service areas.

### Merchant data backlog

- `MerchantReturnPolicy`: blocked pending owner confirmation of exact policy applicability, return window, method, fees, and exceptions for personalized goods. It must match the legal withdrawal page.
- `ShippingService`: blocked pending exact shipping destinations, rates, handling/transit times, and WooCommerce configuration.
- `ProductGroup`/variants: blocked pending a stable public variant URL model and complete variant identifiers.
- Google Merchant Center feed: recommended after owner account setup and product-data validation. Google states that combining on-page structured data and Merchant Center feeds maximizes eligibility; it does not guarantee placement.
- OpenAI product feed: not implemented. No repository credentials or confirmed current feed contract were supplied; normal OAI-SearchBot crawlability is enabled.

### Validation procedure

After deployment, test homepage, one simple product, one variable product, one product without reviews, shop, and one industry page in Schema.org Validator and Google's Rich Results Test. Compare every price, currency, availability, SKU, image, canonical, rating, and breadcrumb with the visible page and WooCommerce.

## 3. Implemented scope and limits

The SEO work (metadata, canonical/hreflang, sitemap, robots, structured data, Core Web Vitals-safe images) is implemented in the frontend; the audit that drove it is recorded in git history.


### Intentionally not implemented

- No fake city landing pages, reviews, local-business claims, service areas, opening hours, social profiles, shipping times, or return policies.
- No `llms.txt` workaround.
- No IndexNow endpoint/key: this requires a secret/key lifecycle and deployment/WordPress publication trigger. It is an optional freshness enhancement, not a substitute for sitemap discovery.
- No analytics or advertising tags: provider/account/consent decisions belong to the owner.
- No Merchant Center or OpenAI feed submission without owner accounts, credentials, and feed validation.
- No new product-category routes; repository content ownership explicitly defers them.

### Known limitations

- No live Search Console, Analytics, Merchant Center, backlink, CWV field, or Semrush data was available.
- Lando/WordPress was unavailable during the final audit, so product/category inventory must be rechecked before launch.
- The production host, redirects, firewall access for legitimate crawlers, and generated HTTP status codes require deployed-environment verification.
- Product images remain unoptimized by Next because they originate from the existing WooCommerce media contract. Validate CDN response formats and caching before altering it.

## 4. Manual launch checklist

### Owner decisions and external accounts

- [ ] Confirm `https://kubikart.de` is the sole production frontend and redirect `www` consistently.
- [ ] Confirm public business name, legal address use, storefront/pickup status, phone, service area, and opening hours before adding local schema or Google Business Profile fields.
- [ ] Decide whether GPTBot may be used for training. This is separate from allowing OAI-SearchBot for search discovery.
- [ ] Choose analytics provider and approve consent, retention, IP/data handling, and privacy-text updates before installation.
- [ ] Verify Google Search Console and Bing Webmaster Tools ownership for the canonical domain.
- [ ] Decide whether to open Google Merchant Center; validate policy and product eligibility before submitting a feed.

### Deployment verification

- [ ] Confirm production `/robots.txt` allows `/`, disallows `/api/`, explicitly allows OAI-SearchBot, and advertises the production sitemap.
- [ ] Confirm preview, staging, Lando, and localhost robots disallow `/` and emit no sitemap URLs.
- [ ] Inspect rendered source for home, shop, service, one DE/EN product pair, business kit, and industry: one self-canonical, correct hreflang reciprocity, German `x-default`, indexable robots.
- [ ] Confirm search, account, cart, checkout, reset/success, and other private flows emit `noindex` and are absent from sitemap.
- [ ] Test nonexistent product and industry URLs for a real 404 response and no indexable metadata.
- [ ] Test HTTP→HTTPS, www/non-www, trailing slash, and legacy/duplicate routes for one-hop permanent redirects to the canonical URL.
- [ ] Confirm backend/Lando/admin/API hostnames are not indexable publicly.

### Data and structured data

- [ ] Run Rich Results Test on a simple product, variable product, in-stock product, out-of-stock product, and product without reviews.
- [ ] Confirm schema price/currency/availability/SKU/rating/images exactly match WooCommerce and visible content.
- [ ] Validate homepage and industry graphs with Schema.org Validator.
- [ ] Verify no hidden, draft, private, placeholder, untranslated, or canonicalized duplicate URL appears in sitemap.
- [ ] Confirm every included sitemap URL returns 200 and its own canonical.

### Content, local, and images

- [ ] Review German and English titles/descriptions in native language; remove translation artifacts and truncation-prone boilerplate.
- [ ] Confirm each indexable page has one useful H1 and descriptive internal links.
- [ ] Verify every product/category gallery has slug-aligned filenames and localized, concise alt text; decorative images use empty alt or CSS presentation.
- [ ] Confirm media URLs return 200 with cache headers, correct MIME types, dimensions, and no hotlink/auth restrictions.
- [ ] Add only real project photos, customer evidence, capabilities, lead times, and location facts.
- [ ] Review Ulm advertising/installation rules before marketing permanent facade or outdoor installation.

### Performance and commerce

- [ ] Run mobile Lighthouse/PageSpeed tests for home, shop, a product, a service, cart, and checkout from production.
- [ ] Record LCP, INP, CLS, TTFB, image payload, JS payload, and third-party work; remediate from evidence.
- [ ] Test at 360, 768, 1024, and 1440 px with long German content.
- [ ] Complete add-to-cart, variation, personalization, coupon, shipping, tax, Stripe, PayPal, account, and order smoke tests.
- [ ] Confirm cookie choices work and no non-essential tracker fires before consent.

### Submission and monitoring

- [ ] Submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- [ ] Inspect representative URLs live, request indexing for the key launch pages, and monitor Page indexing and Crawl Stats.
- [ ] Monitor Product snippets and Merchant listings reports after Google recrawls.
- [ ] Consider IndexNow only with a secured key and a publication/update trigger; send changed canonical URLs, not the whole site on every request.

## 5. Measurement plan

### Baseline

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

### Segments

Maintain separate views for German/English; home/shop/product/service/industry; branded/non-branded; local-intent/general; mobile/desktop; and indexable/noindex URL families. Product performance should use WooCommerce IDs or canonical slugs without duplicating prices in analytics code.

### Initial success criteria

Use directional targets until four to eight weeks of reliable data exists:

- 100% of sitemap URLs return 200, are self-canonical, and are intended to index.
- Zero preview/staging URLs indexed.
- Zero invalid Product rich-result items; warnings are triaged against real available data.
- No growth in soft 404, duplicate canonical, redirect-chain, or server-error groups.
- CWV passes at p75 when sufficient field data exists; lab regressions block releases when materially worse than the recorded baseline.
- Organic conversions are measured only after consent-safe analytics is approved and verified.

### Experiment rules

Change one meaningful page group at a time, annotate releases, and wait for adequate impressions before judging titles or content. Do not infer causality from rank snapshots. Never manufacture copy, reviews, location pages, or schema solely to move a metric.

### Reporting

The monthly report should include: changes shipped; crawl/indexation health; top gaining/declining pages and queries; German/English split; local-intent split; merchant/schema errors; CWV; organic enquiries/revenue if lawfully measured; and the next three evidence-based actions. Explicitly label missing data and external blockers.
