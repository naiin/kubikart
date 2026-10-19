# Kubikart Homepage Layout

**Route:** Existing homepage route  
**Page type:** Primary marketing and commerce entry point  
**Hero type:** Large — homepage only

---

# 1. Homepage Goal

The homepage must explain Kubikart within a few seconds.

A visitor should understand:

1. Kubikart creates products for local businesses.
2. Kubikart also sells selected personalised products.
3. Standard products can be purchased online.
4. Custom work can be requested through a mockup or quote.
5. Kubikart serves Ulm, Neu-Ulm and surrounding areas.

The homepage must not attempt to explain every product, industry and service in detail.

Its job is to guide visitors into the correct path.

---

# 2. Primary Customer Paths

The homepage supports two audiences.

## Primary path: Local businesses

Products include:

- QR/NFC stands
- Google Review tools
- opening-hours stickers
- menus
- window and mirror graphics
- Business Visibility Kits

## Secondary path: Personalised product customers

Products include selected:

- personalised gifts
- keychains
- name signs
- family products
- wedding and seasonal products

The business path should have stronger visual priority, but the personalised-product path must remain clearly available.

---

# 3. Header

The homepage uses the global header defined in:

`docs/05-header-footer.md`

The header must retain:

- cart access
- account access if currently present
- locale handling
- mobile menu
- existing routes

---

# 4. Section Order

> **Final implementation (business-shopping release).** The sections below are
> the original specification; the implemented homepage order is:
>
> 1. **Hero** (`HomeHero`): primary CTA Business-Pakete, secondary CTA shop, supporting CTA free mock-up.
> 2. **Two ways to start** (`HomePaths`, spec section 2): a business panel with three distinct entries (Business-Pakete `/services/brand-kit`, individual business products `/shop?category=<live business category id>`, Für deine Branche `/businesses`) plus the custom enquiry (`/sonderanfertigung`); and a personalised-gifts panel (`/personalisierte-geschenke`) with real WooCommerce product imagery. Category ids and imagery are resolved from live data.
> 3. **Business-Pakete** (`FeaturedKits`): the first three kits in WooCommerce menu order, with live price, availability state and the featured kit image (reviewed design examples, shown square and uncropped with a visible "Illustrative Darstellung" badge; the vector package overview remains the fallback when a kit has no image). Followed by a compact strip of what the packages contain (`KitContentsStrip`, matching the final configured contents).
> 4. **Individual products** (`PopularProducts`): live WooCommerce popularity ranking with Business Kits excluded, so kits are not repeated.
> 5. **Before and after** (`BeforeAfterSection`, concept images).
> 6. **For your industry** (`IndustryLinks`): compact image links to all published industries of the locale (up to eight), not large cards.
> 7. How custom work works, portfolio concepts, trust, final CTA (unchanged).
>
> Header, mobile menu, footer and breadcrumbs use the same terms: German
> *Business-Pakete* / *Branchen* / *Individuelle Anfrage*, English
> *Business Bundles* / *Industries* / *Custom Request* (panel eyebrow *Für dein Unternehmen* / *For Your Business*). No homepage text
> contains commercial data; prices and availability come from WooCommerce.

## Section 1 — Hero

### Image delivery

Public WordPress images in the gift thumbnails and shared Business Bundle cards
use Next.js image optimization with responsive `sizes`, matching the existing
product-card policy. Local `*.lndo.site` images still bypass optimization because
the optimizer cannot fetch the private development host. The hero retains its
preloaded, optimized local image; below-the-fold images remain lazy-loaded.

On 19 October 2026, a public delivery check measured one gift original at 284,266
bytes versus 12,210 bytes through the deployed optimizer at 256 px / quality 75.
This is an individual asset comparison, not a measured Lighthouse improvement.
After deploying, repeat PageSpeed on the same URL/device and inspect its LCP
element and timing breakdown before attributing remaining delay to WordPress.
WordPress originals lacked a Cache-Control header in that check; origin media
caching is a separate hosting configuration task, not changed by the frontend.

### Purpose

Communicate the primary business direction and provide the main actions.

### Layout

Desktop:

- Left: copy and actions
- Right: real product composition
- Approximate split: 45/55

Mobile:

- Copy first
- Product visual second
- CTAs remain clearly visible without scrolling excessively

### Copy direction

Eyebrow:

> Local visibility studio & personalised products

Primary headline:

> Make your business easier to see, scan and trust.

Supporting copy:

> Branded QR/NFC stands, stickers, menus and visibility kits for local businesses—plus selected personalised products made to order.

Primary CTA:

> Explore Business Kits

Secondary CTA:

> Shop Products

Supporting text link:

> Get a Free Mockup

Trust line:

- Ulm & Neu-Ulm
- Custom design
- Online shop and local service

### Hero visual

Show a restrained composition of four or five real product types:

- QR/NFC stand
- Google Review stand
- menu board or laminated menu
- opening-hours sticker
- optional small personalised product

Do not overcrowd the hero.

Do not use fake customer names or fake prices.

---

## Section 2 — Two Ways to Shop Kubikart

### Purpose

Prevent confusion between business products and personalised products.

### Layout

Use two large editorial panels, not six small cards.

#### Panel A — For Businesses

Copy:

> Improve your window, counter, menu and customer touchpoints.

Show:

- Business Kits
- QR/NFC stands
- review tools
- stickers
- menus and small signs

CTA:

> View Business Solutions

#### Panel B — Personalised Products

Copy:

> Personalised products for gifts, family occasions and special moments.

Show selected real product imagery.

CTA:

> Shop Personalised Products

The panels must link to existing or approved routes.

---

## Section 3 — Featured Business Kits

### Purpose

Present the main B2B buying path.

### Heading

> Ready-made visibility kits for local businesses

### Supporting text

> Start with a coordinated package instead of choosing every item separately.

### Show only three featured kits

(Implemented as the first three kits in WooCommerce menu order: Business-Starterpaket, Gastro-Paket, Friseur- & Barber-Paket.)

Each card shows:

- image
- target customer
- three main included items
- real WooCommerce price or quote state
- one CTA

Do not show invented prices.

Below the cards:

> View all Business Kits

---

## Section 4 — Shop Popular Products

### Purpose

Keep the existing WooCommerce shop commercially visible.

### Data source

Real WooCommerce products only.

### Layout

Use four product cards on large desktop, two on tablet and one or two on mobile according to the current card design.

Possible groups:

- Business products
- Personalised products
- Best sellers
- Recently added

The source must be explicit. Do not silently substitute placeholders.

CTA:

> View All Products

---

## Section 5 — Before and After

### Purpose

Show the value of Kubikart without repeating another feature-card grid.

### Layout

One strong editorial before-and-after comparison.

Possible example:

Before:

- taped paper menu
- plain QR print
- unclear opening hours

After:

- branded menu
- review stand
- clean opening-hours sticker

Use only:

- real work
- pilot work
- clearly labelled prototype or concept work

Do not present concepts as real customer results.

Heading:

> Small details change how professional a business feels.

---

## Section 6 — Shop by Business Type

### Purpose

Guide businesses into industry-specific pages.

### Display

Use compact visual links, not large descriptive cards.

Initial industries:

- Restaurants & Takeaways
- Cafés & Bakeries
- Barbers & Salons
- Clinics & Practices
- Local Shops
- Service Businesses

Each item links to a real industry route.

---

## Section 7 — How Custom Work Works

### Purpose

Reduce uncertainty about customisation.

### Steps

1. Send your logo, idea or photo
2. Kubikart prepares a recommendation or mockup
3. You approve the design
4. Kubikart produces the order
5. Shipping, pickup, delivery or suitable small installation

Use a simple process line or editorial sequence.

Avoid five separate large cards.

---

## Section 8 — Featured Portfolio

### Purpose

Build proof and trust.

### Show

Three entries maximum.

Each entry must display status where needed:

- Real project
- Pilot
- Prototype
- Concept

Show:

- image
- project title
- business type
- concise deliverables
- link to Case Study or Portfolio

CTA:

> View Portfolio

---

## Section 9 — Why Kubikart

### Purpose

Provide concise trust signals.

Use one navy horizontal panel or a two-column section.

Maximum four points:

- Local near Ulm and Neu-Ulm
- Products, design and production in one place
- Small-business-friendly service
- Direct purchase or custom quotation

Do not invent certifications, review counts or production promises.

---

## Section 10 — Final CTA

### Heading

> Not sure what fits your business?

### Supporting copy

> Send your logo and a photo of your shop, counter, window or menu area. Kubikart will suggest the right products or kit.

Primary CTA:

> Get a Free Mockup

Secondary CTA:

> Contact Kubikart

Use a navy background and orange primary button.

---

## Section 11 — Footer

Use the global footer defined in:

`docs/05-header-footer.md`

---

# 5. Homepage Data Sources

| Content | Source |
|---|---|
| Featured products | WooCommerce |
| Product prices | WooCommerce |
| Product images | WooCommerce / WordPress media |
| Featured kits | WooCommerce where purchasable |
| Industry copy | Approved Next.js content |
| Portfolio | Approved portfolio source |
| Navigation labels | Translation system |
| Legal links | Existing approved routes |
| Contact details | Existing site configuration |

Do not duplicate commercial data in homepage constants.

---

# 6. Homepage Interaction Rules

- Hero CTAs must work without client-side-only dependency where possible.
- Product cards preserve existing behaviour.
- Cart count must remain accurate.
- Filters are not required on the homepage.
- Avoid carousels unless there is a clear accessibility implementation.
- Do not autoplay media.
- Do not create fake urgency.
- Do not add popups during the redesign phase.

---

# 7. Responsive Layout

## Mobile

Order:

1. Hero copy
2. Hero visual
3. Two customer paths
4. Business Kits
5. Products
6. Before/after
7. Industries
8. Process
9. Portfolio
10. Trust
11. CTA

Requirements:

- CTAs stack or wrap cleanly.
- Product cards remain usable.
- Before-and-after images keep matching crops.
- Industry links may use a two-column grid.
- No section should require horizontal page scrolling.

## Desktop

- Use alternating editorial layouts to avoid repeated grids.
- Keep generous section spacing.
- Keep hero content within the standard container.
- Avoid more than four equally weighted cards in one row.

---

# 8. Homepage Acceptance Criteria

- Existing homepage route remains unchanged.
- Approved navy/orange design is used.
- No green brand theme remains in the redesigned homepage.
- Two customer paths are immediately understandable.
- Featured product data is real.
- Featured kit pricing is real or clearly quote-based.
- Cart and account links remain functional.
- No fake customer or portfolio claims are introduced.
- Large hero is used only here.
- Layout works at 360, 768, 1024 and 1440 px.
- Lint, type-check, tests and production build pass.
