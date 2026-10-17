# Content model and Business Industries

**Status:** implemented and verified locally (nothing in this document describes production state).
Companion documents: [products and bundles](07-products-and-bundles.md), [owner handbook](02-owner-handbook.md).

## 1. What lives where

| Content | Owner | Notes |
|---|---|---|
| Products, prices, sale prices, tax, stock, variations, reviews, images | WooCommerce | Never duplicated in Next.js; production has no placeholder commerce data |
| Product categories (shop filters, Business-Pakete) | WooCommerce | Business-Pakete German category slug `business-kits-de`, English `business-kits` |
| Business Bundles (Business-Pakete) | WooCommerce product in the bundle category plus the `kubikart-business-kit-contents` mu-plugin | Contents are display-only; see section 4 |
| Purchase mode (buy vs. enquiry), sold-in-sets configuration | Product meta (`_kubikart_purchase_mode`, `_kubikart_set_config`) | See [products and bundles](07-products-and-bundles.md) |
| Personalisation fields | Product meta `_kubikart_custom_fields` (editor panel *Kubikart: Personalisierung*) | Text, textarea, URL, select, checkbox, file; optional "visible when" condition |
| Business Industry landing pages | `business_industry` custom post type (plugin `kubikart-business-industries`) | Editorial text plus two ordered product lists |
| About, Contact, FAQ, legal, services | Frontend pages and `next-intl` messages | No CMS type needed |
| UI and navigation labels | `frontend/src/messages/de.json` and `en.json` | Every key exists in both languages |

There is deliberately **no** Industry taxonomy, Portfolio or Case Study type, standalone category route, or
generic content-model plugin. Portfolio and Case Studies stay deferred until there are real, approved customer projects.

## 2. Routes and navigation

| Page | Route | Data |
|---|---|---|
| Shop | `/[locale]/shop` | WooCommerce products and categories (numeric category filter) |
| Product (also bundles) | `/[locale]/shop/[productSlug]` | One WooCommerce product; bundles select a bundle layout by category |
| Business Bundles overview | `/[locale]/services/brand-kit` | Products of the bundle category |
| Industries overview | `/[locale]/businesses` | Published `business_industry` posts |
| Industry page | `/[locale]/businesses/[industrySlug]` | One localized post plus the products it references |
| Enquiry | `/[locale]/kontakt?product=<slug>`, `/[locale]/sonderanfertigung?industry=<slug>` | Short enquiry forms |

Primary navigation: Shop, *Für dein Unternehmen / For Your Business* (bundles, industries), Personalised gifts,
About, Contact; cart and account in the utility area. See [header and footer](05-header-footer.md). Product URLs never
change when a product is reached from another entry point; renamed slugs get permanent redirects in
`frontend/next.config.ts`.

## 3. Business Industries

An Industry is one complete, localized landing page for a type of business (restaurants, salons, clinics, ...).
WordPress owns the text; WooCommerce keeps owning every product. The post type is `business_industry` (REST base
`business-industries`); there is no WordPress archive or permalink, Next.js owns the routes.

### 3.1 Owned data

Core fields (title, slug, excerpt, content, featured image, revisions, menu order, status, Polylang language and
translation links) plus two relationship lists stored as IDs only:

| Meta key | Shape | Purpose |
|---|---|---|
| `_kubikart_bundle_ids` | ordered unique integer array | **Business-Pakete** shown on the page, in this order |
| `_kubikart_related_product_ids` | ordered unique integer array | **Einzelprodukte** shown on the page, in this order (bundles are not allowed here) |

An empty list is stored as an empty list on purpose and stays empty: the frontend then hides that section. The old
single "featured kit" field (`_kubikart_featured_kit_id`) is retired; it is only read by the migration script and is
deleted on the next save.

### 3.2 Editor (WP-Admin > Business Industries > industry)

The box **Kubikart: Business-Pakete und Einzelprodukte dieser Branche** (in the collapsible *Meta Boxes* panel under
the editor) has two separate pickers. Each has a selected list with up/down/remove controls and a searchable
"Hinzufügen" list. The bundle picker offers only bundle-category products in the page's language; the product picker
offers every other product. A save is rejected as a whole (previous lists stay) when an ID is not a product, is a bundle
in the product list or a non-bundle in the bundle list, is missing, or appears in both lists; a notice explains why.
The same validation runs for REST writes. A product in the other language only produces a warning.

The lists describe *recommendations for that business type*. What a bundle contains is maintained on the bundle
product itself (*Kubikart: Paketinhalt*).

### 3.3 Frontend

The page shows hero, **Business-Pakete für {industry}**, **Einzelprodukte für {industry}**, editorial content and the
custom-request call to action, rendering exactly the saved lists in their saved order (no category-derived or
hard-coded additions). Unpublished or untranslatable products are skipped; empty sections disappear; the hero image
is labelled as an illustrative example. Metadata, canonical/hreflang, sitemap entries and schema come from the post.

### 3.4 Translations

German and English are separate posts linked by Polylang and each owns its title, text, image, order and lists. The
plugin never auto-translates or creates the second language.

### 3.5 Migration from the earlier mixed list

`backend/scripts/migrate-industry-relations.php` (dry run by default; `apply` writes a JSON snapshot to
`backend/backups/` first; `rollback <file>` restores it) moves the legacy featured bundle (first) and the bundle
entries of the old recommended-products list into `_kubikart_bundle_ids`, keeps real products in the product list,
removes duplicates, maps IDs to the industry's language through Polylang, and is repeat-safe. Run it before
`configure-business-kits.php` on any database that still has the old structure. The configuration script only
**initialises missing lists**; replacing curated lists needs the explicit `reset-industries` argument, and
`append-industry-products` adds missing default products without removing anything.

### 3.6 REST, security and revalidation

* Authenticated reads: `GET /wp-json/wp/v2/business-industries[/{id}]` with the two relationship fields (IDs only).
  Writes need `edit_post`; there is no anonymous REST access (the Kubikart Security plugin gates core REST).
* The save handler checks the nonce, `edit_post`, post type, non-autosave and WooCommerce validity. If WooCommerce is
  unavailable the saved IDs stay untouched and are shown for diagnosis.
* Saving, trashing, restoring or deleting an industry sends a signed `industry.*` event to the frontend (see
  [revalidation](10-revalidation.md)); the frontend refreshes the industry collection, locale, ID, slug and sitemap tags.
* The frontend reads industries server-side with `WORDPRESS_API_URL`, `WP_APP_USER`, `WP_APP_PASSWORD`
  (server-only, never `NEXT_PUBLIC_`).
* Activation registers the post type once; deactivation keeps all posts and meta; there is no uninstall deletion.

### 3.7 Manual test checklist

1. Add a draft; confirm title, excerpt, image, revisions and Page Attributes exist.
2. Add, remove and reorder bundles and products; save; reload; confirm the order and that the public page matches
   (after the cache refresh).
3. Save with an empty bundle list; confirm the section is hidden.
4. Try a product in the wrong list or the other language; confirm the notice or warning.
5. Link German and English posts and confirm independent lists.
6. Move a post through draft, trash, restore and delete and watch the signed revalidation requests.

## 4. Business Bundles (data model)

A bundle is a normal WooCommerce product in the bundle category, so title, slug, images, price, tax and stock stay in
WooCommerce. Two meta keys add the bundle-specific data:

| Meta key | Shape | Purpose |
|---|---|---|
| `_kubikart_kit_order_mode` | `purchase`, `enquiry` or empty | Legacy bundle order mode; the generic `_kubikart_purchase_mode` is authoritative (see products document) |
| `_kubikart_kit_contents` | `{ schema_version: 1, items: [...] }` | Ordered, display-only contents |

Each content item has an optional linked `product_id`/`variation_id`, a quantity (1-999), an optional title, a
description (specification) and an optional `image_id`. The `kubikart-business-kit-contents` mu-plugin validates on save
(an invalid save is rejected and the old value kept), exposes a resolved read-only `_kubikart_kit` entry in the REST
product, maps linked products to the right language through Polylang, and never trusts submitted translation IDs.
There is no bundle inventory: selling a bundle does not change component stock. `wp kubikart kits audit` lists bundles
without structured contents.

## 5. Localization and SEO

German is the default locale and `x-default`; routes are locale-prefixed; products keep localized slugs and redirect to
the locale-correct slug; canonical and hreflang metadata and dynamic sitemap entries (products and industries) are
generated. Details and the launch checklist are in [SEO](11-seo.md).

## 6. Deferred

Portfolio and Case Studies, an Industry taxonomy, standalone category routes, category sitemaps and schema, customer
results and testimonials, and migrating or deleting legacy categories (the owner decides which legacy categories stay
visible; they are not shown in primary navigation merely because they exist).
