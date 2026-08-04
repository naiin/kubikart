# Manual SEO launch checklist

## Owner decisions and external accounts

- [ ] Confirm `https://kubikart.de` is the sole production frontend and redirect `www` consistently.
- [ ] Confirm public business name, legal address use, storefront/pickup status, phone, service area, and opening hours before adding local schema or Google Business Profile fields.
- [ ] Decide whether GPTBot may be used for training. This is separate from allowing OAI-SearchBot for search discovery.
- [ ] Choose analytics provider and approve consent, retention, IP/data handling, and privacy-text updates before installation.
- [ ] Verify Google Search Console and Bing Webmaster Tools ownership for the canonical domain.
- [ ] Decide whether to open Google Merchant Center; validate policy and product eligibility before submitting a feed.

## Deployment verification

- [ ] Confirm production `/robots.txt` allows `/`, disallows `/api/`, explicitly allows OAI-SearchBot, and advertises the production sitemap.
- [ ] Confirm preview, staging, Lando, and localhost robots disallow `/` and emit no sitemap URLs.
- [ ] Inspect rendered source for home, shop, service, one DE/EN product pair, business kit, and industry: one self-canonical, correct hreflang reciprocity, German `x-default`, indexable robots.
- [ ] Confirm search, account, cart, checkout, reset/success, and other private flows emit `noindex` and are absent from sitemap.
- [ ] Test nonexistent product and industry URLs for a real 404 response and no indexable metadata.
- [ ] Test HTTP→HTTPS, www/non-www, trailing slash, and legacy/duplicate routes for one-hop permanent redirects to the canonical URL.
- [ ] Confirm backend/Lando/admin/API hostnames are not indexable publicly.

## Data and structured data

- [ ] Run Rich Results Test on a simple product, variable product, in-stock product, out-of-stock product, and product without reviews.
- [ ] Confirm schema price/currency/availability/SKU/rating/images exactly match WooCommerce and visible content.
- [ ] Validate homepage and industry graphs with Schema.org Validator.
- [ ] Verify no hidden, draft, private, placeholder, untranslated, or canonicalized duplicate URL appears in sitemap.
- [ ] Confirm every included sitemap URL returns 200 and its own canonical.

## Content, local, and images

- [ ] Review German and English titles/descriptions in native language; remove translation artifacts and truncation-prone boilerplate.
- [ ] Confirm each indexable page has one useful H1 and descriptive internal links.
- [ ] Verify every product/category gallery has slug-aligned filenames and localized, concise alt text; decorative images use empty alt or CSS presentation.
- [ ] Confirm media URLs return 200 with cache headers, correct MIME types, dimensions, and no hotlink/auth restrictions.
- [ ] Add only real project photos, customer evidence, capabilities, lead times, and location facts.
- [ ] Review Ulm advertising/installation rules before marketing permanent facade or outdoor installation.

## Performance and commerce

- [ ] Run mobile Lighthouse/PageSpeed tests for home, shop, a product, a service, cart, and checkout from production.
- [ ] Record LCP, INP, CLS, TTFB, image payload, JS payload, and third-party work; remediate from evidence.
- [ ] Test at 360, 768, 1024, and 1440 px with long German content.
- [ ] Complete add-to-cart, variation, personalization, coupon, shipping, tax, Stripe, PayPal, account, and order smoke tests.
- [ ] Confirm cookie choices work and no non-essential tracker fires before consent.

## Submission and monitoring

- [ ] Submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- [ ] Inspect representative URLs live, request indexing for the key launch pages, and monitor Page indexing and Crawl Stats.
- [ ] Monitor Product snippets and Merchant listings reports after Google recrawls.
- [ ] Consider IndexNow only with a secured key and a publication/update trigger; send changed canonical URLs, not the whole site on every request.
