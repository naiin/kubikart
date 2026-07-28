# Kubikart Simplified Content Model

**Status:** Approved near-term architecture

**Phase:** 4A — documentation only

**Audit date:** 2026-07-28

This document defines the smallest useful content model for Kubikart’s current stage. It preserves the working Next.js, WordPress, WooCommerce, Polylang, cart, checkout, payment, account, metadata, and SEO architecture.

Portfolio and Case Studies are deliberately deferred until Kubikart has enough real customer projects to justify them.

## 1. Reference interpretation

- `product_overview.png` is visual guidance for the existing `/shop` route.
- `product_single.png` is visual guidance for sections of the true WooCommerce single-product page.
- The reference’s “Choose Your Stand” area represents real WooCommerce variations or related products. It must not replace the existing variation selection, personalization, stock, quantity, or add-to-cart interface.
- `business_kit.png` is visual guidance for a Business Kit WooCommerce product template.
- `homepage.png` remains homepage visual guidance.
- `case_study.png` is deferred and must not drive current implementation.

Written specifications and the Kubikart design system override reference-image colors, prices, claims, businesses, reviews, results, and generated text.

## 2. Final simplified model

The immediate content model contains:

1. WooCommerce Products for every sellable item.
2. WooCommerce Product Categories for organizing product types.
3. WooCommerce Products assigned to the Business Kits category for all Business Kits.
4. Existing WordPress or Next.js pages for About, Contact, FAQ, services, and legal content.

One future content type is approved:

5. A WordPress custom post type named `business_industry`.

The immediate model does **not** include:

- an Industry taxonomy;
- a Case Study custom post type;
- a Portfolio archive;
- product-to-industry taxonomy relationships;
- Case Study relationships, fields, REST endpoints, schema, or sitemap entries;
- standalone product-category routes;
- custom post types for Products, Product Categories, Business Kits, Portfolio, or Services.

## 3. Content ownership

| Content | Owner/source | Notes |
|---|---|---|
| Product title, slug, description, SKU | WooCommerce Product | Localized through Polylang/WooCommerce |
| Product price, sale price, tax, and stock | WooCommerce Product or Variation | Never duplicate in Next.js |
| Product variations and attributes | WooCommerce | Preserve existing purchasing behavior |
| Product images | WordPress media attached to WooCommerce | Real product media only |
| Product reviews and ratings | WooCommerce | Existing review endpoints remain authoritative |
| Product type grouping | WooCommerce Product Category | Used by shop filters and merchandising |
| Business Kit | WooCommerce Product in Business Kits | Not a custom post type |
| Business Kit price, stock, and variations | WooCommerce | Must use real commercial data |
| Business Industry | Future `business_industry` post | Editorial industry page with product references |
| About, Contact, FAQ, legal content | Existing frontend or WordPress page architecture | No new content type required |
| UI and navigation labels | Existing `next-intl` messages | Localized in German and English |

## 4. Current repository and catalogue audit

### 4.1 Current routes

| Page | Current route | Status |
|---|---|---|
| Products overview | `/[locale]/shop` | Exists |
| Product single | `/[locale]/shop/[slug]` | Exists |
| Business Kits overview | `/[locale]/services/brand-kit` | Exists as a static service page |
| Business Kit single | `/[locale]/shop/[slug]` | Works through the generic product route |
| Product-category landing | None | Categories currently filter `/shop` by numeric ID |
| Business Industries overview | None | Future |
| Business Industry single | None | Future |
| Portfolio | None | Deferred |
| Case Study single | None | Deferred |

### 4.2 Current WooCommerce data access

`frontend/src/lib/woocommerce.ts` already provides:

- product collection retrieval;
- product lookup by ID or localized slug;
- product variations;
- product categories;
- products filtered by numeric category ID;
- product reviews;
- Polylang product translation IDs;
- cache tags for products and categories.

`frontend/src/lib/product-page.ts` adapts WooCommerce products to the current detailed product interface while preserving variations, personalization fields, stock, images, prices, ratings, dimensions, and purchasing links.

The later product redesign must remove or isolate production placeholder commerce fallbacks. WooCommerce must remain the only production owner of commercial product data.

### 4.3 Current WordPress extensions

Version-controlled Kubikart extensions include:

- Kubikart Newsletter;
- Kubikart Security;
- Kubikart Custom Product Fields;
- Kubikart DHL Shipping;
- Kubikart Payment Gateway;
- Kubikart Rating Sync.

The only Kubikart custom post type currently found is the private newsletter subscription type. No Industry taxonomy, Business Industry post type, Portfolio, or Case Study model currently exists.

### 4.4 Existing Business Kits

The audited German and English WooCommerce catalogues contain five localized, published Business Kit product pairs:

1. Starter Visibility Kit
2. Gastro Visibility Kit
3. Barber & Salon Kit
4. Reception Kit
5. Local Shop Window Kit

They are simple WooCommerce Products assigned to localized Business Kits categories. Their final contents, pricing, stock behavior, imagery, and direct-purchase versus quotation behavior require owner review.

## 5. Shop category direction

The customer-facing shop should use a small, understandable category set based on real products and approved near-term offerings.

### Business products

- QR & NFC Stands
- Stickers & Window Products
- Menus & Signs
- Business Kits

### Personalised products

- Keychains
- Personalised Gifts
- Signs & Decorations

These are navigation and merchandising recommendations, not instructions to create, delete, rename, or migrate WordPress categories in this documentation task.

The current catalogue contains overlapping and legacy categories, including:

- Acrylic Products
- Wood Products
- 3D Printing
- NFC & Social Stands
- Signs & Displays
- Menus & Price Lists
- Window & Door Stickers

Legacy categories may remain in WordPress temporarily. They should not automatically appear in primary customer navigation merely because they exist. The owner must approve visible categories before any category migration or navigation change.

Standalone product-category landing routes are not required in the immediate phase. The current numeric category filtering on `/shop` may remain until analytics, SEO evidence, catalogue size, or usability testing demonstrates a need for dedicated category URLs.

## 6. Business Kits

A Business Kit remains a WooCommerce Product assigned to the canonical Business Kits category.

Use standard WooCommerce fields for:

- localized title and slug;
- short and full descriptions;
- featured and gallery images;
- SKU;
- real price and sale price;
- tax and stock;
- attributes and variations;
- publication and catalogue visibility;
- reviews.

A kit-specific frontend layout may present included items, intended business type, process, and supporting content, but it must not duplicate or override WooCommerce price, stock, variations, or purchasing behavior.

The product route should select the kit-specific layout through Business Kits category membership. The public URL remains `/[locale]/shop/[productSlug]`.

If a Kit is quotation-led rather than directly purchasable, that commercial state must be explicitly approved and represented consistently in WooCommerce or a narrowly defined future product field. A missing price must not silently invent a quotation state.

Reference-image package tiers must become real WooCommerce variations or separate real products before they can appear. Codex must not create fictional Basic, Standard, or Premium options.

## 7. Future Business Industry post type

### 7.1 Purpose

The future `business_industry` post type lets the owner create, localize, order, and publish a business-sector landing page in WordPress without editing Next.js source files.

Each post owns its editorial copy and image and references:

- one featured WooCommerce Business Kit;
- zero or more related WooCommerce Products.

The post does not duplicate product records, prices, stock, images, or purchasing behavior. The frontend resolves referenced IDs against current WooCommerce data.

### 7.2 Registration

| Property | Value |
|---|---|
| Internal name | `business_industry` |
| Admin label | Business Industries |
| Public | `true` |
| Show in REST | `true` |
| Localized | Polylang |
| Supports | title, editor, excerpt, featured image, revisions, page attributes |
| Ordering | `menu_order` from page attributes |
| Archive use | Supplies the frontend Business Industries overview |

No Industry taxonomy is required.

### 7.3 Additional fields

| Field | Type | Purpose |
|---|---|---|
| `_kubikart_featured_kit_id` | One WooCommerce Product ID | Featured Kit for the Industry |
| `_kubikart_related_product_ids` | Array of WooCommerce Product IDs | Relevant real products |

The future WordPress implementation must:

- use native, version-controlled fields rather than ACF;
- sanitize and authorize field updates;
- expose explicit REST schemas;
- validate that the featured Kit belongs to Business Kits;
- validate that related IDs identify existing WooCommerce Products;
- preserve relationship IDs if a product becomes temporarily unavailable while reporting stale references in the admin UI;
- support Polylang translation relationships;
- trigger frontend cache revalidation when published Industry content changes.

### 7.4 Owner workflow

```text
Business Industries
→ Add New
→ Title: Driving Schools
→ Add content and featured image
→ Select relevant WooCommerce Products
→ Select one featured Business Kit
→ Publish
```

The owner does not create:

- a taxonomy term;
- a separate WordPress Page;
- a Next.js code mapping;
- a Case Study;
- duplicate product records.

Once published and localized, the post should automatically appear on the frontend Business Industries overview according to publication state and menu order.

## 8. Final route map

| Page | Route | Data source |
|---|---|---|
| Products overview | `/[locale]/shop` | WooCommerce products and categories |
| Product single | `/[locale]/shop/[productSlug]` | WooCommerce Product |
| Business Kits overview | `/[locale]/services/brand-kit` | Business Kits WooCommerce category |
| Business Kit single | `/[locale]/shop/[productSlug]` | WooCommerce Product using Kit layout |
| Business Industries overview | `/[locale]/businesses` | Published `business_industry` posts |
| Business Industry single | `/[locale]/businesses/[industrySlug]` | One localized `business_industry` post plus referenced WooCommerce data |

There is no immediate product-category landing route, Portfolio route, or Case Study route.

Existing product and Business Kit URLs remain unchanged.

## 9. Business Industry REST requirements

The future post type should use the WordPress REST API with `show_in_rest: true`.

Expected read endpoints:

- `GET /wp-json/wp/v2/business-industries`
- `GET /wp-json/wp/v2/business-industries/{id}`

Responses must provide:

- core title, slug, excerpt, content, featured media, status, modified date, and menu order;
- Polylang language and translation relationships;
- `_kubikart_featured_kit_id`;
- `_kubikart_related_product_ids`.

Relationship fields return IDs rather than copied WooCommerce objects. The Next.js server should batch-resolve those IDs through the existing authenticated WooCommerce client.

The current Kubikart Security plugin blocks anonymous core WordPress REST reads. The future implementation must choose one narrowly scoped approach:

1. authenticated server-to-server reads using a least-privileged Application Password; or
2. anonymous `GET` access only to published Business Industry responses.

It must not expose drafts, private posts, protected metadata, credentials, or newsletter data.

## 10. Localization and SEO

Current behavior to preserve:

- German and English locale-prefixed frontend routes;
- German as the default locale and `x-default`;
- Polylang translation relationships;
- localized Product slugs;
- product redirects to locale-correct slugs;
- canonical and hreflang metadata;
- dynamic WooCommerce product sitemap entries.

Future Business Industry implementation must add:

- localized slugs;
- locale-correct slug redirects;
- localized canonical, hreflang, and `x-default`;
- metadata based on approved Industry content;
- Business Industries overview and published detail sitemap entries;
- `lastModified` from WordPress;
- conservative CollectionPage/ItemList schema for the overview;
- appropriate WebPage schema for details;
- exclusion of draft, private, or empty placeholder content.

No Case Study or Portfolio schema or sitemap implementation is required.

Dedicated category-page metadata, schema, and sitemap entries are also deferred because standalone category routes are not part of the immediate model.

## 11. Visible website navigation

The intended primary navigation is:

1. Home
2. Shop
3. Business Kits
4. For Businesses
5. About
6. Contact
7. Cart

`For Businesses` will link to `/[locale]/businesses` once that route exists.

Portfolio must not appear in primary navigation until real projects justify the feature and its content model.

Account, search, locale controls, mobile behavior, and utility actions remain governed by the existing header specification and current supported functionality.

## 12. Manual owner work

The owner will later:

1. Approve the small visible customer-facing product-category set.
2. Decide which legacy categories remain internal, secondary, or hidden from primary navigation.
3. Review each Business Kit’s contents.
4. Confirm real Kit prices and stock behavior.
5. Confirm whether each Kit is directly purchasable or quotation-led.
6. Provide real Business Kit imagery.
7. Create localized Business Industry posts.
8. Write and approve real Industry copy.
9. Select relevant real WooCommerce Products for each Industry.
10. Select one real featured Business Kit for each Industry.
11. Provide licensed, truthful Industry imagery.

Codex must not create fake Industries, products, prices, Kit contents, projects, customer identities, claims, or results.

## 13. Codex responsibilities

In separately approved implementation phases, Codex may:

- redesign ProductCard and `/shop` while retaining existing numeric filters;
- redesign the true WooCommerce Product page while preserving commerce behavior;
- make `/services/brand-kit` query the real Business Kits category;
- add a Kit-specific Product layout selected by category membership;
- implement a small version-controlled plugin for `business_industry` and its two relationship fields;
- add typed frontend Business Industry data access;
- implement `/businesses` and `/businesses/[industrySlug]`;
- add localized Business Industry metadata, sitemap entries, schema, cache tags, error states, and redirects.

Codex must not migrate categories, generate commercial content, or publish Industry posts without explicit authorization and owner-approved data.

## 14. Revised implementation order

### 1. Simplified content model

This document completes the architecture decision.

### 2. ProductCard and Shop redesign

Redesign the existing product cards and `/shop`. Preserve WooCommerce data, numeric category filtering, sorting, search, prices, stock, product links, cart behavior, and query-state SEO rules.

### 3. True WooCommerce Product redesign

Apply relevant visual guidance from `product_single.png` to the actual product page. Preserve variations, personalization, quantity, stock, reviews, and add-to-cart. Interpret “Choose Your Stand” only as real variations or related products.

### 4. Business Kits overview and Kit product template

Make `/services/brand-kit` WooCommerce-backed and render a Kit-specific layout for products in Business Kits.

### 5. Business Industry custom post type and REST support

Register `business_industry`, its two relationship fields, Polylang support, validation, permissions, REST representation, tests, and revalidation.

### 6. Business Industry overview and detail pages

Implement `/businesses` and `/businesses/[industrySlug]` from published WordPress content and referenced WooCommerce Products.

### 7. About, Contact, and FAQ

Redesign existing pages without introducing new content types.

### 8. Portfolio and Case Studies

Reconsider only after Kubikart has enough approved real customer projects. Define the smallest justified model at that time rather than reserving architecture now.

## 15. Deferred functionality

The following are explicitly deferred:

- Portfolio navigation and archive;
- Case Study content type and routes;
- Case Study fields and relationships;
- Industry taxonomy and product-taxonomy relationships;
- standalone product-category routes;
- automatic migration or deletion of legacy categories;
- category sitemap and category schema work;
- customer results, testimonials, and project metrics;
- any generic content-model plugin beyond the future Business Industry requirement.

The immediate next implementation phase is **ProductCard and Shop redesign**.
