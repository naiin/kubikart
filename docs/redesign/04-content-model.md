# Kubikart Final Content Model

**Status:** Architecture audit and implementation specification  
**Phase:** 4A — documentation only  
**Audit date:** 2026-07-28  
**Applies to:** WooCommerce catalogue, Business Kits, Industries, Portfolio, and Case Studies

This document defines the final content ownership and relationship model. It does not authorize creating WordPress data, registering routes, or changing frontend behavior.

The reference images are interpreted as follows:

- `product_overview.png`: Products overview and product-category hub
- `product_single.png`: product-category or product-family landing page, not a true WooCommerce single-product page
- `business_kit.png`: an individual WooCommerce Business Kit product template
- `case_study.png`: an individual Case Study template
- `homepage.png`: homepage composition guidance only

Written specifications override all reference-image prices, claims, businesses, results, colors, and generated text.

## 1. Architectural decision

The final model uses:

1. WooCommerce Products for every sellable item.
2. WooCommerce Product Categories for product types.
3. WooCommerce Products assigned to a Business Kits product category for purchasable or quote-led kits.
4. One custom taxonomy named `industry`.
5. The `industry` taxonomy attached to WooCommerce `product` and `case_study`.
6. One custom post type named `case_study`.
7. The Case Study archive as the Portfolio.

The model does **not** introduce custom post types for Products, Product Categories, Business Kits, Industries, Portfolio, or Services.

## 2. Audit basis and limitations

The audit covers:

- the repository source tree;
- the configured local WooCommerce REST API;
- the German and English catalogue returned on 2026-07-28;
- the current Next.js routes, adapters, metadata, schema, sitemap, and localization code;
- version-controlled WordPress plugins, MU plugins, and themes.

The WooCommerce API was reachable only through the local development TLS exception already configured in `frontend/.env.local`. No credentials or data were changed.

The audit does not prove:

- which optional WordPress plugins are active in every deployment;
- that the current local catalogue exactly matches production;
- that every empty category represents an approved future product;
- that current Business Kit prices, contents, or purchasability are commercially final.

Those points require owner confirmation before migration.

## 3. Current implementation audit

### 3.1 Frontend routes

| Page type | Current route | Exists | Current source/behavior |
|---|---|---:|---|
| Products overview | `/[locale]/shop` | Yes | WooCommerce products and categories |
| Product category | None | No | Category is a `/shop?category={numericId}` filter state |
| Product single | `/[locale]/shop/[slug]` | Yes | WooCommerce product adapted by `product-page.ts` |
| Business Kits overview | `/[locale]/services/brand-kit` | Partial | Static translated service page; does not query the Business Kits category |
| Business Kit single | `/[locale]/shop/[slug]` | Functionally yes | Kit products use the ordinary product route; no kit-specific template |
| Industries overview | None | No | Homepage labels are informational only |
| Industry single | None | No | No route or backend taxonomy exists |
| Portfolio overview | None | No | Homepage prototype section only |
| Case Study single | None | No | No route or backend post type exists |

The existing routes must remain valid. Later work should enhance or add routes without breaking `/shop`, `/shop/[slug]`, or `/services/brand-kit`.

### 3.2 WooCommerce helpers

The active REST client is `frontend/src/lib/woocommerce.ts`.

| Helper | Endpoint | Notes |
|---|---|---|
| `wcApi<T>()` | Configured WooCommerce v3 base URL | Server-side credentials, 300-second default revalidation |
| `getProducts()` | `products` | Language, pagination, sorting, search, category and status parameters pass through |
| `getProduct()` | `products/{id}` or `products?slug=` | Resolves translated product IDs when a slug belongs to another locale |
| `getProductVariations()` | `products/{id}/variations` | Fetches up to 100 localized variations |
| `getCategories()` | `products/categories` | Fetches up to 100 categories, including empty categories |
| `getProductsByCategory()` | `products?category={id}` | Numeric category ID relation |
| `getProductReviews()` | `products/reviews` | Approved reviews for one product |
| `getAllReviews()` | `products/reviews` | Approved review collection |

Current cache tags cover all products, all categories, and a product slug. There are no tags for industries or Case Studies yet.

### 3.3 Product and category types

`WCProduct` currently models:

- IDs, localized slug and name;
- descriptions;
- product type and publication status;
- prices and sale state;
- stock status;
- weight, dimensions, and shipping class;
- product categories;
- images;
- attributes, default attributes, and variation IDs;
- arbitrary WooCommerce metadata;
- average rating and review count;
- Polylang `lang` and `translations`.

`WCVariation` models price, stock, image, and selected attributes.

`WCCategory` models ID, name, slug, parent ID, description, count, and image. It does **not** currently type `lang` or `translations`, even though category localization will require those fields.

### 3.4 Product adapter

`frontend/src/lib/product-page.ts` maps WooCommerce data into the richer `ProductPageProduct` presentation model. It:

- maps prices, stock, variations, images, dimensions, rating, and categories;
- merges WooCommerce attributes with `_kubikart_custom_fields`;
- builds personalization, support, and custom-request controls;
- supplements products with hard-coded presentation presets.

Important migration conflict: the adapter contains five placeholder/preset products and can return preset data when WooCommerce fails. Related products are also selected only from those presets. The sitemap can publish the same placeholder products when both localized WooCommerce requests fail.

This conflicts with the final “WooCommerce owns commercial data” direction and the repository's no-fake-production-fallback rule. It must be removed or confined to non-production fixtures during the later product-detail phase, not in this audit task.

### 3.5 Product metadata and schema

The current product route:

- generates a canonical URL from the resolved localized product slug;
- looks up translated product IDs and slugs for `de`, `en`, and `x-default`;
- redirects a mismatched-language slug to the locale-correct product slug;
- exposes Open Graph title, description, URL, and primary image;
- renders Product and BreadcrumbList JSON-LD.

The Product JSON-LD uses real mapped price, availability, images, and rating data. Its category breadcrumb currently links back to `/shop`, because no category route exists.

The shop route:

- uses localized canonical/hreflang metadata;
- applies `noindex` to filtered, searched, or sorted query states;
- renders CollectionPage, BreadcrumbList, and ItemList JSON-LD.

Current SEO issues to address later:

- shop JSON-LD names and descriptions are hard-coded in German even on English routes;
- category pages have no canonical, hreflang, metadata, or schema because they do not exist;
- category translation IDs/slugs are not represented in `WCCategory`;
- product preset copy can override WooCommerce SEO copy;
- the root layout still contains older default business positioning;
- the product breadcrumb cannot link to a category landing page.

### 3.6 Sitemap

`frontend/src/app/sitemap.ts` includes:

- localized static routes;
- all published localized WooCommerce products;
- product `lastModified` values;
- translated product alternates built through Polylang product IDs.

It does not include:

- product-category routes;
- Business Kit overview semantics beyond the static Brand Kit service route;
- Industries;
- Portfolio;
- Case Studies.

The production placeholder-product fallback noted above must be removed before the product phase is complete.

### 3.7 WordPress extension points

Version-controlled Kubikart extensions currently found:

| Extension | Type | Current responsibility |
|---|---|---|
| `kubikart-newsletter` | Standard plugin | Private `newsletter_sub` post type and double opt-in storage |
| `kubikart-security` | Standard plugin | REST restrictions, password-reset endpoints, and hardening |
| `kubikart-custom-product-fields.php` | MU plugin | Product personalization metabox and WooCommerce REST response extension |
| `kubikart-dhl-shipping.php` | MU plugin | DHL/shipping integration |
| `kubikart-payment-gateway.php` | MU plugin | Headless payment-gateway integration |
| `kubikart-rating-sync.php` | MU plugin | Rating synchronization |

The bundled WordPress themes are unmodified default Twenty Twenty themes. No project theme `functions.php` owns the headless content model.

### 3.8 Existing custom post types and taxonomies

Repository search found one Kubikart custom post type:

- `newsletter_sub`, private, no archive, exposed in REST for administrative use.

Repository search found no Kubikart custom taxonomy and no existing:

- `case_study` post type;
- `industry` taxonomy;
- Portfolio post type;
- Business Kit post type.

### 3.9 Existing REST extensions

Existing custom REST behavior consists of:

- WooCommerce v3 endpoints;
- `_kubikart_custom_fields` appended to WooCommerce product responses;
- `kubikart/v1/forgot-password`;
- `kubikart/v1/reset-password`;
- the private newsletter post type's core REST endpoint.

The security plugin requires authentication for ordinary WordPress REST endpoints. WooCommerce endpoints and the forgot-password endpoint are explicitly allowed. A future Case Study client must therefore use authenticated server-to-server reads or a narrowly scoped public-read policy; it must not weaken all REST authentication.

There are currently no Case Study, Industry, related-product, or related-kit REST fields.

## 4. Live WooCommerce catalogue

### 4.1 Existing category hierarchy

The German and English catalogues contain equivalent translated category sets with separate Polylang term IDs.

Current German hierarchy:

- `Business Produkte` (`business-produkte`, ID 125)
  - `NFC & Social Stands` (`nfc-social-stands-de`, ID 113)
  - `Schaufenster & Türaufkleber` (`schaufenster-tueraufkleber`, ID 129)
  - `Schilder & Displays` (`schilder-displays`, ID 137)
  - `Speisekarten & Preislisten` (`speisekarten-preislisten`, ID 133)
- All other categories are currently top-level.

Current English hierarchy:

- `Business Products` (`business-products`, ID 127)
  - `NFC & Social Stands` (`nfc-social-stands`, ID 111)
  - `Window & Door Stickers` (`window-door-stickers`, ID 131)
  - `Signs & Displays` (`signs-displays`, ID 139)
  - `Menus & Price Lists` (`menus-price-lists`, ID 135)
- All other categories are currently top-level.

### 4.2 Categories with published products

| Category pair | Direct published count per locale | Notes |
|---|---:|---|
| Business Kits | 5 | Exists top-level; should become a Business Products child if approved |
| NFC & Social Stands | 1 | Existing acrylic NFC product |
| Acrylic Products | 2 | Material-led legacy category |
| Wood Products | 4 | Material-led legacy category |
| 3D Printing | 2 | Production-method legacy category |
| Personalized/Personalisierte Gifts | 6 | Current broad personalized grouping |
| Keychains/Schlüsselanhänger | 2 | Existing product type |

All proposed business-type categories except the older NFC category currently have zero directly assigned published products.

### 4.3 Published Business Kits

Five localized product pairs exist as simple, published WooCommerce products:

1. Starter Visibility Kit
2. Gastro Visibility Kit
3. Barber & Salon Kit
4. Reception Kit
5. Local Shop Window Kit

English products use natural slugs such as `gastro-visibility-kit`. German records currently use slugs such as `gastro-visibility-kit-de`. Commercial completeness, price validity, included items, stock strategy, and direct-purchase versus quotation behavior still require owner review.

### 4.4 Other published products

The current catalogue also contains:

- acrylic NFC social media stand;
- engraved wooden and paracord keychains;
- personalized wooden name sign;
- engraved cutting board;
- acrylic LED name light;
- engraved slate door sign;
- bamboo pen;
- two 3D-printed products.

This confirms current personalized, material-led, and production-method product groupings. It does not confirm publishable products for every proposed new business category.

## 5. Content ownership

| Content | Owner/source | Notes |
|---|---|---|
| Product identity, slug, description, SKU | WooCommerce Product | Localized through Polylang/WooCommerce |
| Product prices, taxes, stock, sale state | WooCommerce Product/Variation | Never duplicate in Next.js |
| Product variations and attributes | WooCommerce | Preserve cart and checkout behavior |
| Product images and gallery | WordPress media attached to WooCommerce | Real media only |
| Product reviews and ratings | WooCommerce | Existing review endpoints |
| Product type | WooCommerce Product Category | Hierarchical navigation |
| Business Kit | WooCommerce Product in Business Kits category | Uses a kit-specific frontend template, not a CPT |
| Business Kit price/stock/variations | WooCommerce | Quote mode must be explicit if no direct purchase |
| Industry definition | `industry` taxonomy term | Shared by products and Case Studies |
| Industry editorial landing copy | WordPress term description plus narrowly defined term metadata, or approved localized frontend copy initially | Must not duplicate commerce data |
| Portfolio | Case Study archive | No separate Portfolio post type |
| Case Study | `case_study` post type | Editorial evidence, not a product |
| Case Study media | WordPress media | Before/after status must be truthful |
| Related Case Study products | Product IDs stored on Case Study | Frontend resolves live WooCommerce data |
| Related Business Kit | One Product ID stored on Case Study | Must point to a product in Business Kits |
| Services | Existing Next.js routes/content | No Services CPT |
| Navigation/UI labels | `next-intl` message files | Not WordPress commercial data |

## 6. Target WooCommerce product-category structure

The target is a product-type hierarchy, not a blind recreation of every proposed label.

### 6.1 Business Products

| Proposed child | Current evidence | Recommendation |
|---|---|---|
| QR & NFC Stands | Empty new category plus one product in older NFC & Social Stands | Keep after owner approves naming; merge or redirect the older NFC category |
| Google Review Tools | Empty localized categories exist | Keep only when at least one real product is scheduled |
| Opening-Hours Stickers | Empty localized categories exist | Keep only when publishable product data exists |
| Menus & Menu Boards | Empty new category overlaps older Menus & Price Lists | Owner must choose one canonical concept and migration |
| Window & Glass Stickers | Empty new category overlaps older Window & Door Stickers | Owner must choose canonical scope/name |
| Frosted Glass & Privacy | Empty localized categories exist | Keep when product scope is confirmed |
| Mirror Stickers | Empty localized categories exist | Keep when product scope is confirmed |
| Payment & Booking Displays | Empty localized categories exist | Keep when product scope is confirmed |
| Business Kits | Five published products | Confirmed; reparent beneath Business Products |

Do not create additional category records for labels that already exist. Reparent, merge, translate, or retire existing records only after redirect and product-assignment planning.

### 6.2 Personalized Products

A `Personalized Products` / `Personalisierte Produkte` parent does not currently exist.

| Proposed child | Current evidence | Recommendation |
|---|---|---|
| Keychains | Two published products and localized categories | Confirmed |
| Personalized Gifts | Six published products and localized categories | Confirmed, but owner must decide whether this remains a broad child or becomes the parent |
| Name Signs | One published wooden name-sign product; no dedicated category | Reasonable once the owner confirms future range |
| Family & Baby | Mentioned in homepage direction, no catalogue products | Do not create until products are approved |
| Wedding Products | Mentioned in homepage direction, no catalogue products | Do not create until products are approved |
| Seasonal Products | Mentioned in homepage direction, no catalogue products | Do not create until products are approved |

### 6.3 Legacy category decision

`Acrylic Products`, `Wood Products`, `3D Printing`, `Signs & Displays`, and similar categories describe material, production method, or a broad format rather than the proposed customer-facing product types.

They must not be deleted in the initial migration. The owner must decide whether each should:

- remain a secondary product category for SEO/navigation;
- become a product attribute or tag;
- redirect into a new canonical product-type category;
- remain hidden from primary navigation while retaining existing assignments.

Any category slug change or deletion requires a redirect map and Polylang-aware migration.

## 7. Business Kits data model

A Business Kit is a WooCommerce Product assigned to the canonical Business Kits category.

### 7.1 Standard WooCommerce ownership

Use standard product fields for:

- title and localized slug;
- full and short descriptions;
- featured/gallery images;
- SKU;
- actual price and sale price;
- tax;
- stock or made-to-order stock behavior;
- variations where choices alter price or purchasing;
- attributes;
- reviews;
- purchasability;
- publication and catalogue visibility.

### 7.2 Kit-specific data

The future version-controlled content plugin may register only the metadata that WooCommerce cannot express clearly:

| Field | Suggested key/type | Purpose |
|---|---|---|
| Purchase mode | `_kubikart_purchase_mode`: `direct` or `quote` | Prevents a blank price from ambiguously controlling CTA behavior |
| Target customer summary | `_kubikart_kit_audience`: localized string | Short “best for” presentation |
| Included product references | `_kubikart_kit_product_ids`: array of product IDs | Resolves real related products without copying price/stock |
| Included deliverable labels | `_kubikart_kit_deliverables`: localized string array | Covers non-product design/production deliverables |

Use variations when Basic/Standard/Premium options are genuine purchasable variations of one kit. Do not create fake tiers from the reference image. If tiers have materially independent stock, contents, or merchandising, use separate WooCommerce products instead.

Related products do not imply inventory bundling. If component-level stock deduction is required, that is a separate commerce requirement and must not be simulated in presentation code.

## 8. Industry taxonomy

Register one taxonomy:

| Property | Value |
|---|---|
| Internal name | `industry` |
| Object types | `product`, `case_study` |
| Public | Yes |
| Hierarchical | Yes, while initial terms remain a flat list |
| Show admin UI | Yes |
| Show in REST | Yes |
| REST base | `industries` |
| Rewrite base | Backend-only WordPress permalink is not the public canonical; Next.js owns public routes |
| Localization | Polylang-enabled translated terms |

Initial terms to document, not create in this phase:

- Restaurants & Takeaways
- Cafés & Bakeries
- Barbers & Salons
- Beauty & Nail Studios
- Clinics & Practices
- Driving Schools
- Local Shops
- Repair & Service Businesses

Each product may have multiple industries. Industry is not a replacement for product category: category answers “what is it?”, while industry answers “who is it useful for?”.

Each Case Study should have at least one industry before publication. Multiple industries are allowed only when the project genuinely spans them.

## 9. Case Study post type

Register one post type:

| Property | Value |
|---|---|
| Internal name | `case_study` |
| Public | Yes |
| Has archive | Yes |
| Archive meaning | Portfolio |
| Show in REST | Yes |
| REST base | `case-studies` |
| Supports | title, editor, excerpt, thumbnail, revisions |
| Taxonomies | `industry` |
| Localization | Polylang-enabled translated posts |
| Public frontend canonical | Next.js Portfolio/Case Study routes |

Do not register a separate Portfolio post type.

### 9.1 Required Case Study fields

| Field | Storage | Required for publish | REST representation |
|---|---|---:|---|
| Title | Core post title | Yes | `title.rendered` |
| Slug | Core post name | Yes | `slug` |
| Excerpt | Core excerpt | Yes | `excerpt.rendered` |
| Main content | Core editor content | Yes | `content.rendered` |
| Featured image | Core featured media | Yes | `featured_media` plus embedded media when requested |
| Before image | Registered post meta, attachment ID | Yes for before/after stories; otherwise explicitly optional | Integer |
| After image | Registered post meta, attachment ID | Yes for before/after stories; otherwise explicitly optional | Integer |
| Project status | Registered post meta | Yes | Enum: `real`, `pilot`, `prototype`, `concept` |
| Location | Registered localized post meta | Optional; never invent | String |
| Deliverables | Registered localized post meta | Yes | Array of strings |
| Related WooCommerce products | Registered post meta | Optional | Array of integer product IDs |
| Related Business Kit | Registered post meta | Optional | One integer product ID |
| Industry | `industry` taxonomy | Yes | Term IDs plus REST term data |
| Publication state | Core post status | Yes | `draft`, `pending`, `private`, or `publish` |

Suggested internal meta keys:

- `_kubikart_before_image_id`
- `_kubikart_after_image_id`
- `_kubikart_project_status`
- `_kubikart_location`
- `_kubikart_deliverables`
- `_kubikart_related_product_ids`
- `_kubikart_related_kit_id`

Register each meta field with explicit REST schemas, sanitization, authorization, and revision support where practical.

Use native WordPress metaboxes or block-editor panels in the small Kubikart plugin. Do not add ACF: the backend does not currently depend on it, and the field set is small and stable.

### 9.2 Publication rules

- `real`: documented completed customer project with permission to publish.
- `pilot`: documented pilot or limited deployment, clearly labelled.
- `prototype`: physically produced internal prototype.
- `concept`: non-customer design visualization.

The frontend must render the status label. A Case Study must not publish customer identity, location, testimonial, metric, or business result without confirmation and permission.

## 10. Relationships

```text
Product Category 1 ──── * WooCommerce Product
Industry         * ──── * WooCommerce Product
Business Kits category ─ * WooCommerce Product (kit)
Industry         * ──── * Case Study
Case Study       * ──── * WooCommerce Product (stored product IDs)
Case Study       * ──── 0..1 Business Kit product (stored product ID)
```

Rules:

- Categories and Industries are independent classifications.
- Business Kits are products, not containers that own duplicate product commerce data.
- Case Studies reference product IDs and resolve current titles, images, slugs, prices, and availability from WooCommerce at render time.
- Deleting a related product must not delete a Case Study; the admin UI should detect and report stale IDs.
- The related-kit field must validate that the selected product belongs to Business Kits.

## 11. Final frontend route and data-source mapping

These are recommended later implementation routes. Only current routes are guaranteed today.

| Frontend page | Recommended route | Backend source |
|---|---|---|
| Products overview | `/[locale]/shop` | WooCommerce products/categories |
| Product category/family | `/[locale]/shop/category/[categorySlug]` | WooCommerce category plus products |
| Product single | `/[locale]/shop/[productSlug]` | WooCommerce product |
| Business Kits overview | Keep `/[locale]/services/brand-kit` | Canonical Business Kits category plus products |
| Business Kit single | Keep `/[locale]/shop/[productSlug]` | WooCommerce kit product; choose kit template by category |
| Industries overview | `/[locale]/industries` | `industry` taxonomy terms plus approved editorial copy |
| Industry single | `/[locale]/industries/[industrySlug]` | One industry term, related products, and Case Studies |
| Portfolio overview | `/[locale]/portfolio` | Published `case_study` archive |
| Case Study single | `/[locale]/portfolio/[caseStudySlug]` | Published `case_study` |

Why `/shop/category/[slug]`: `/shop/[slug]` is already the product-single contract. A namespaced category segment avoids product/category collisions and preserves every current product URL.

The Business Kits overview route is intentionally retained because it is already linked by the global shell. A later owner-approved redirect to a different route would be a separate SEO migration.

## 12. REST requirements

### 12.1 Existing endpoints to retain

- `GET /wp-json/wc/v3/products`
- `GET /wp-json/wc/v3/products/{id}`
- `GET /wp-json/wc/v3/products/{id}/variations`
- `GET /wp-json/wc/v3/products/categories`
- `GET /wp-json/wc/v3/products/reviews`

### 12.2 Required content endpoints

With `show_in_rest`:

- `GET /wp-json/wp/v2/case-studies`
- `GET /wp-json/wp/v2/case-studies/{id}`
- `GET /wp-json/wp/v2/industries`
- `GET /wp-json/wp/v2/industries/{id}`

Required query support:

- Case Studies by industry;
- published Case Studies by slug and locale;
- pagination;
- `_embed` for featured media where useful;
- modified date for caching and sitemap generation.

### 12.3 WooCommerce REST extensions

WooCommerce product responses must expose:

- industry term IDs and localized slugs/names;
- kit purchase mode;
- kit audience;
- included product IDs;
- kit deliverables.

If WooCommerce does not natively filter the custom taxonomy, add a narrowly scoped, sanitized `industry` query parameter or resolve the term's related product IDs server-side through authenticated WordPress REST. Do not fetch the whole catalogue and filter it in the browser.

### 12.4 Case Study REST fields

Case Study responses must expose the registered meta fields listed in section 9.1. Relationship fields return IDs, not copied product objects. The Next.js server then batches WooCommerce resolution.

### 12.5 Authentication and cache invalidation

The current security plugin blocks anonymous core WordPress REST. Preferred options, in order:

1. authenticated server-to-server Next.js fetches using a least-privileged Application Password;
2. narrowly allow anonymous `GET` requests only for published Case Studies and Industries;
3. a small read-only custom endpoint if the core endpoint response cannot be safely scoped.

Do not expose drafts, private posts, protected metadata, credentials, or admin-only newsletter data.

The content plugin should trigger the existing frontend revalidation integration when products, categories, industries, or Case Studies change. Later frontend work should add cache tags for:

- `case-studies`;
- an individual Case Study slug;
- `industries`;
- an individual Industry slug;
- kit products when kit metadata changes.

## 13. Localization and slug behavior

Current behavior:

- Next.js supports `de` and `en`, with German as default.
- Public routes are locale-prefixed.
- Static route segments are defined by `SEO_ROUTE_SEGMENTS`.
- WooCommerce/Polylang represents translations as separate product and category records.
- Product responses provide `lang` and a locale-to-product-ID translation map.
- Product pages resolve the correct localized record and redirect wrong-language slugs.

Required extensions:

- add `lang` and `translations` to the category TypeScript type;
- resolve translated category slugs for canonical and hreflang links;
- enable `case_study` and `industry` in Polylang;
- ensure REST returns language and translation relationships for those objects;
- use translated slugs for Case Study and Industry routes;
- redirect a valid alternate-language slug to the locale-correct slug;
- use German as `x-default`.

Do not assume German and English slugs are identical. The current German Business Kit `-de` suffixes are technically valid but should be reviewed for customer-facing quality before launch; changing them requires redirects.

## 14. SEO implications

Later implementation must provide:

- unique localized metadata for each category, Industry, Portfolio page, and Case Study;
- self-referencing canonicals;
- translated hreflang and German `x-default`;
- CollectionPage and ItemList schema for product-category, Industry, Business Kit overview, and Portfolio pages as appropriate;
- Product schema only on actual sellable WooCommerce product pages;
- Article or CreativeWork/CaseStudy-compatible schema chosen conservatively for Case Studies;
- BreadcrumbList schema with real category/industry/archive URLs;
- XML sitemap entries for localized categories, Industries, Portfolio, and published Case Studies;
- `lastModified` from WooCommerce or WordPress;
- no indexing of filter/search/sort query states;
- no indexing of drafts, private Case Studies, empty speculative categories, or concept fixtures presented as real work;
- redirect maps for every changed category, product, Industry, or Case Study slug.

Category archives should not compete with product pages: category content describes a product family, while product pages own purchase-specific details.

## 15. Manual WordPress work

The owner or an authorized catalogue editor must:

1. Confirm the final visible category names in German and English.
2. Decide which empty proposed categories correspond to products genuinely planned for publication.
3. Decide how to merge overlapping old/new categories.
4. Decide the future role of material and production-method categories.
5. Create the Personalized Products parent only after its hierarchy is approved.
6. Reparent canonical categories and preserve a redirect map.
7. Reassign each existing product to its correct product-type categories.
8. Review the five current Business Kits for real prices, contents, variation strategy, stock, purchase mode, copy, and media.
9. Create and link Polylang translations for categories, Industry terms, and Case Studies.
10. Create approved Industry terms after the taxonomy exists.
11. Enter Case Studies with truthful status, licensed media, deliverables, and relationships.
12. Confirm permission for customer identity, location, testimonials, and measurable results before publication.
13. Replace prototype/concept media with real or approved pilot media where available.
14. Refresh WordPress rewrite rules after plugin activation.

Codex must not manufacture this commercial or evidentiary content.

## 16. Codex implementation responsibilities

In later approved phases, Codex should:

1. Build a small version-controlled `kubikart-content-model` WordPress plugin.
2. Register `case_study`, `industry`, and their native admin fields.
3. Attach `industry` to `product` and `case_study`.
4. Register, sanitize, authorize, and expose required REST fields.
5. Add Polylang integration hooks and tests.
6. Extend WooCommerce REST product responses and industry filtering.
7. Add content-change revalidation.
8. Add typed Next.js Case Study, Industry, category, and kit clients/adapters.
9. Implement routes and templates in separate phases.
10. Add localized metadata, canonical, hreflang, schema, sitemap, not-found, and failure behavior.
11. Remove production placeholder commerce fallbacks during the product-detail phase.
12. Preserve cart, checkout, payment, account, variation, review, and order behavior.

## 17. Conflicts and owner decisions

### Confirmed repository conflicts

1. Product categories exist only as numeric query filters; no category landing route exists.
2. The static Brand Kit page conflicts with the final WooCommerce-backed Business Kits overview direction.
3. Business Kits exist as products, but all use the generic product template.
4. Proposed category records partially exist with duplicate/overlapping older categories and inconsistent hierarchy.
5. No Personalized Products parent exists.
6. No Industry taxonomy, Portfolio archive, or Case Study post type exists.
7. WordPress REST security currently blocks anonymous core content reads.
8. Product and sitemap code contains production placeholder fallbacks.
9. Category localization fields are missing from the frontend type.
10. Shop JSON-LD is not fully localized.

### Decisions requiring owner confirmation

1. Which empty business categories have real products planned?
2. Should Personalized Gifts become a child of a new Personalized Products parent, or serve as that parent?
3. Should Acrylic Products, Wood Products, and 3D Printing remain navigable categories, become secondary facets, or redirect?
4. Which overlapping category names/slugs are canonical?
5. Are all five current Business Kits approved, and are they direct-purchase, quote-led, or mixed?
6. Are kit tiers real variations, separate products, or not part of the offer?
7. Are the current German `-de` Business Kit slugs acceptable?
8. Which initial Industry terms should launch with actual content?
9. Is authenticated server-to-server Case Study REST preferred over narrowly public read endpoints?
10. Which projects have permission to be published as `real` or `pilot` Case Studies?

## 18. Recommended implementation phases

### Phase 4B — Backend content-model plugin

- Register `case_study` and `industry`.
- Register native fields and REST schemas.
- Attach Industry to products.
- Add Polylang support, validation, permissions, tests, and revalidation hooks.
- Do not create production terms or Case Studies automatically.

### Phase 4C — Catalogue migration plan and owner-approved WordPress data work

- Finalize category decisions.
- Produce ID/slug/translation/redirect mapping.
- Reparent and reassign without deleting unreviewed categories.
- Audit kit data.

### Phase 4D — Product overview and ProductCard

- Redesign `/shop`.
- Preserve real WooCommerce filtering and commerce.
- Remove placeholder commerce fallbacks from overview paths.

### Phase 5 — Product-category/family pages

- Add `/shop/category/[categorySlug]`.
- Implement localized category metadata, schema, alternates, sitemap, and redirects.

### Phase 6 — True product and Business Kit product templates

- Keep `/shop/[productSlug]`.
- Select standard-product or Business-Kit presentation from canonical category membership.
- Preserve all purchasing behavior.
- Remove remaining production placeholder product data.

### Phase 7 — Industries

- Add overview and term routes.
- Join real WooCommerce products and Case Studies by Industry.

### Phase 8 — Portfolio and Case Studies

- Add Portfolio archive and Case Study routes.
- Publish only approved WordPress content.

### Phase 9 — SEO/content integrity pass

- Complete sitemaps, redirects, hreflang, schema, orphan checks, stale relationship checks, and empty archive handling.

The recommended next Codex task is **Phase 4B: implement and test the version-controlled WordPress content-model plugin only**, after the owner confirms the authentication approach and field labels.
