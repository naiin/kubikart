# Kubikart final migration audit

Last verified: 29 July 2026

This document records the implemented system, its ownership boundaries, and
the work still required before launch. The repository and verified local
WordPress runtime are the source of truth. The requested historical files
`docs/redesign/00-vision.md` and `docs/redesign/03-sitemap.md` are not present
in this repository.

## 1. Executive summary

The redesign migrated Kubikart from a legacy visual system and static
commercial fallbacks to a bilingual, data-driven storefront:

- Next.js owns the public frontend, navigation, interface translations, SEO,
  sitemap, cart UI, and checkout flow.
- WordPress owns editorial Business Industry content.
- WooCommerce owns every sellable product and all commercial product data.
- Polylang and Polylang for WooCommerce own German/English relationships.
- Kubikart plugins add structured custom product fields and the Business
  Industry editor.
- There is no Industry taxonomy, Case Study type, Portfolio type, or Business
  Kit custom post type.

The design-system, homepage, shell, shop, product page, Business Kit pages,
Business Industries, navigation integration, and known cart-drawer defects
have been migrated. The architecture is ready for content population and
controlled pre-production testing.

The site is **not yet ready for public launch**. Product photography,
Business Kit and Industry imagery, commercial review, production
revalidation, least-privileged credentials, payment/shipping/tax testing,
backups, monitoring, and the remaining narrow cart-page defect require work.

## 2. Final architecture

### Frontend

- Next.js 16 App Router, React 19, and TypeScript
- next-intl with German (`de`) as the default language and English (`en`)
- Tailwind CSS v4 and semantic `kk-*` design primitives
- locally hosted variable Montserrat and Inter WOFF2 fonts
- server-only WooCommerce and WordPress clients
- browser-local cart state with server order and payment endpoints
- route metadata, canonical/hreflang links, JSON-LD, robots, and sitemap
- tagged data caches and a signed revalidation endpoint

### Backend

- WordPress 6.x
- WooCommerce
- Polylang Pro and Polylang for WooCommerce
- WooCommerce payment integrations plus Kubikart payment/shipping extensions
- must-use `kubikart-custom-product-fields` plugin, version 1.3.2 when checked
- `kubikart-business-industries` plugin, version 1.0.0 when checked
- Kubikart newsletter, security, rating-sync, and DHL extensions
- authenticated server-to-server REST access

```text
Browser
  |
  v
Next.js public application
  |-- server-only WooCommerce client --> WooCommerce REST API
  |-- server-only WordPress client ----> WordPress REST API
  |-- browser cart --------------------> Next.js order/payment APIs
  `-- metadata/sitemap/cache ----------> rendered public responses
```

WooCommerce consumer credentials and the WordPress Application Password are
read only on the server. They are not sent to browser clients.

## 3. Content ownership matrix

| Content or behavior | Owner | Editing location |
|---|---|---|
| Product title, slug, descriptions | WooCommerce product | WooCommerce > Products |
| Product images and gallery | WooCommerce product/media | WooCommerce product editor |
| Price, sale price, tax data | WooCommerce product/variation | Product data |
| Stock and purchasability | WooCommerce product/variation | Inventory |
| Variations and attributes | WooCommerce product | Attributes/Variations |
| Custom product field schema | Kubikart Custom Product Fields plugin | Product metabox |
| Product reviews | WooCommerce | Product reviews |
| Product categories | WooCommerce | Products > Categories |
| Business Kit membership | WooCommerce category relationship | Product categories |
| Industry title, slug, excerpt, content | Business Industry post | Business Industries |
| Industry featured image and menu order | Business Industry post | Industry editor |
| Industry featured Kit relationship | Business Industry post meta | Industry product panel |
| Industry related-product order | Business Industry post meta | Industry product panel |
| German/English record relationships | Polylang | Language/translation controls |
| Navigation and interface labels | Next.js messages/configuration | Frontend source |
| Homepage interface copy | Next.js translation messages | Frontend source |
| Homepage Industry cards | Published Industry posts | WordPress |
| Product/Industry SEO content | Real record plus Next.js defaults | Backend record/frontend |
| Cart state | Browser cart store | Application runtime |
| Checkout/order payload | Next.js APIs and WooCommerce | Application runtime |
| Cache invalidation | Next.js tags and Kubikart webhooks | Application/plugin code |

Commercial information must not be duplicated in Industry prose or frontend
source as an authoritative value.

## 4. Route inventory

All public content routes are locale-prefixed.

| Area | Current route |
|---|---|
| Homepage | `/[locale]` |
| Shop | `/[locale]/shop` |
| Product and Business Kit detail | `/[locale]/shop/[slug]` |
| Business Kits overview | `/[locale]/services/brand-kit` |
| Business Industries overview | `/[locale]/businesses` |
| Business Industry detail | `/[locale]/businesses/[industrySlug]` |
| Services | `/[locale]/services` and existing localized service routes |
| German custom order | `/de/sonderanfertigung` |
| About | localized existing About route |
| Contact | localized existing Contact route |
| FAQ | `/[locale]/faq` |
| Cart | `/[locale]/cart` |
| Checkout and success | `/[locale]/checkout`, `/[locale]/checkout/success` |
| Account and orders | `/[locale]/account`, `/[locale]/account/orders` |
| Legal | `/[locale]/legal/*` |

German and English products and Industries are separate records and may have
different slugs. Resolution uses Polylang relationships rather than assuming
equal IDs or slugs. Route metadata emits locale-specific canonical URLs,
German/English hreflang alternates, and German as `x-default`.

Product and Industry URLs are checked in the routing proxy before streamed
App Router rendering. When WordPress/WooCommerce confirms that a slug does
not exist, the request is rewritten to the not-found route with HTTP 404.
Backend connectivity failures deliberately fall through to the existing
unavailable state instead of incorrectly classifying a temporary outage as a
permanent 404. The page-level `notFound()` and `noindex` handling remain as a
second line of defence.

There are no product-category landing routes. Shop category filtering remains
numeric: `/[locale]/shop?category={id}`.

## 5. Design-system status

The active palette is:

| Token | Value |
|---|---|
| Primary navy | `#0C2D48` |
| Secondary navy | `#17425F` |
| Orange | `#F78801` |
| Warm page background | `#F7F4EF` |
| Surface | `#FFFDF9` |
| Primary text | `#1E252B` |
| Muted text | `#667481` |
| Border | `#DDE3E8` |

Montserrat is used for headings and editorial display text. Inter is used for
body and UI text. Both are loaded with `next/font/local`:

- `frontend/src/assets/fonts/montserrat/Montserrat-Variable.woff2`
- `frontend/src/assets/fonts/inter/Inter-Variable.woff2`

Each directory includes `OFL.txt` and source provenance. The existing
Kubikart image wordmark remains the logo. No runtime Google Fonts or other
font-provider request is active.

Semantic containers, sections, heading scales, buttons, links, cards, badges,
form controls, and focus states live in `frontend/src/app/globals.css`.
The large promotional hero is a homepage treatment; internal pages use the
more restrained internal-page introduction and heading scale.

## 6. Product system

Every sellable record is a WooCommerce Product. Production product routes no
longer resolve fictional frontend presets, emit preset metadata/schema, or
substitute fake products when WooCommerce is unavailable.

The system supports:

- simple and variable products;
- real variation price, stock, image, and availability;
- real images and a non-commercial missing-image treatment;
- real ratings and approved reviews;
- real related products from configured IDs or relevant categories;
- quantity and configured custom fields;
- Add to Cart and browser cart-count updates;
- cart and checkout metadata;
- server-side WooCommerce order creation;
- Stripe and PayPal checkout integrations;
- product-page PayPal gating using the same validated configuration.

Products 66, 67, 82, and 83 were used as migration verification examples.
Their IDs are not architecture or routing constants.

On WooCommerce failure, pages show a safe unavailable state and do not expose
endpoint details or credentials. Invalid slugs do not resolve preset
products. See the streamed not-found limitation in the route inventory.

## 7. Custom product fields

`_kubikart_custom_fields` is a versioned, WordPress-owned configuration. The
canonical schema version is `2`. Supported types are:

- `text`
- `textarea`
- `select`
- `checkbox` (including a paid extra)

A field may contain a stable key, translated label, required flag,
placeholder, maximum length, helper text, options, default value, and
checkbox price adjustment as appropriate for its type.

Stable keys normally remain identical across translations:

- `engraving_text`
- `font`
- `motif`
- `special_request`
- `gift_wrapping`

Visible labels, placeholders, helper text, and option labels are localized.
Select option values should remain language-neutral, for example
`classic|Classic` and `classic|Klassisch`. Do not translate stable keys, put a
price into a checkbox label, or duplicate structural information such as
“Optional” in helper text.

The frontend renders whatever the product schema supplies. It validates
required values and maximum lengths, applies defaults, serializes selected
values, and includes selected paid extras in the configured unit price.
Metadata travels through cart, checkout, and WooCommerce order line items.
PayPal remains unavailable while the same configuration is invalid.

When the editor saves a legacy payload, the plugin writes schema v2 and
creates `_kubikart_custom_fields_backup` before conversion where a backup
does not already exist. Unknown legacy types are not silently reinterpreted.
At verification time products 82 and 83 had backups; 66 and 67 contained
canonical schema-v2 data but did not have migration backup records.

## 8. Business Kits

Business Kits are ordinary WooCommerce products. The verified localized
category records are:

| Language | ID at verification | Slug | Published products |
|---|---:|---|---:|
| German | 187 | `business-kits-de` | 5 |
| English | 185 | `business-kits` | 5 |

IDs are environment data and must not be hard-coded. The frontend resolves
the category through centralized localized slugs and queries by the resulting
real category ID.

`/[locale]/services/brand-kit` is a WooCommerce-backed overview. A product in
the localized Business Kits category uses the dedicated Kit presentation on
the normal `/[locale]/shop/[slug]` route. The gallery, fields, variations,
price, cart, and PayPal behavior remain in the shared product system.

There is no Business Kit custom post type, duplicate checkout, fictional
Basic/Standard/Premium tier model, or static fallback catalogue.

Five German and five English Kit records remain published. On 29 July 2026
all ten were placed on a reversible commercial hold: no price, out-of-stock,
and not purchasable. Their public copy identifies the combinations as
proposed and enquiry-led. All ten still lack product imagery, shipping
dimensions/weight, and final owner-approved fulfilment specifications. See
[`08-production-readiness.md`](08-production-readiness.md).

## 9. Business Industries

`business_industry` is a WordPress custom post type registered by
`kubikart-business-industries`. It was chosen because each Industry is a
complete editorial landing page with its own content, image, order, and
relationships. No Industry taxonomy is used. A taxonomy should only be
reconsidered if Kubikart later needs reusable many-to-many classification
independent of landing-page content.

Core data:

- title and localized slug;
- excerpt and editor content;
- featured image;
- `menu_order`;
- Polylang language and translation relationship.

Relationship metadata:

- `_kubikart_featured_kit_id`: one WooCommerce Product ID;
- `_kubikart_related_product_ids`: ordered unique WooCommerce Product IDs.

Only IDs are stored. The frontend resolves current title, price, image,
stock, and slug from WooCommerce. Stale products are omitted safely;
translated products are resolved where possible, and wrong-language
relationships are not presented as a static fallback.

The public routes are `/[locale]/businesses` and
`/[locale]/businesses/[industrySlug]`. Up to six published, localized posts
also populate the homepage Industry section in menu order, then title order.
Lösungen/Solutions points to the overview and is active for overview/detail
routes.

At verification there were 8 German and 8 English published Industry posts.
Every post had a featured Kit and related products, but none had a featured
image. Content and relationship quality still require owner review.

Industry routes provide localized metadata and structured page/breadcrumb
data, and published posts are included in the sitemap. No Product schema is
invented for homepage cards.

## 10. Translation model

Polylang relationships apply to products, categories, Business Kits, and
Business Industries. German and English records have different IDs and may
have different slugs.

For each translation:

- translate visible title, excerpt/content, descriptions, labels,
  placeholders, helper text, and option labels;
- preserve stable custom-field keys and language-neutral option values;
- select the localized product categories;
- select products and a featured Kit in the same language as the Industry;
- verify that the Polylang translation relationship is linked.

Content, fields, images, and relationship selections are not automatically
translated. Each language must be reviewed and published independently.

## 11. Security and privacy

- WordPress editorial calls use an authenticated server-only client.
- WooCommerce REST credentials remain in server environment variables.
- Browser code does not receive Application Passwords, consumer secrets,
  Stripe secrets, PayPal secrets, or revalidation secrets.
- No secret uses a `NEXT_PUBLIC_` name. Public publishable IDs/keys may do so.
- Anonymous WordPress REST access is restricted by the active security
  extension.
- Industry relationship writes require nonce and capability checks.
- Draft/private Industries are not exposed to unauthorized public requests.
- WordPress HTML is sanitized before frontend rendering.
- Public errors do not include credentials, stack traces, or backend URLs.
- Fonts are served locally; Google Fonts is not contacted.

The current local WordPress Application Password belongs to an administrator.
The security plugin now provides a dedicated least-privileged
`kubikart_frontend_integration` role and permits Application Passwords for
that role. Before production, create the integration account, rotate the
credential, update only the deployment secret store, and revoke the
administrator credential. Do not commit credentials.

## 12. Cache and revalidation

### Tags

WooCommerce uses:

- `wc-products`
- `wc-categories`
- `wc-product-{slug}`

Business Kit pages reuse these product/category tags; there is no separate
duplicate Kit cache. Business Industries use focused tags for:

- the Industry collection;
- locale collections;
- Industry ID;
- localized Industry slug;
- the sitemap.

### Signed endpoint

`/api/revalidate` accepts signed lifecycle messages using
`REVALIDATE_SECRET`. WordPress uses `KUBIKART_REVALIDATE_SECRET` and
`KUBIKART_FRONTEND_URL`. Secrets must exist only in environment/deployment
configuration.

| WordPress event | Expected invalidation |
|---|---|
| Product updated | Product collection and affected slug |
| Business Kit updated | Same product tags; overview refreshes through product data |
| Industry published/updated | Collection, locales, ID/slugs, overview/detail paths, homepage data, sitemap |
| Industry moved to draft/trashed/deleted | Same Industry set, removing public output |
| Industry restored | Same Industry set, restoring public output |

A successful WordPress save and an immediate frontend cache refresh are
separate events. At verification:

- `KUBIKART_FRONTEND_URL` was configured as `http://localhost:3000`;
- `KUBIKART_REVALIDATE_SECRET` was not configured;
- container-local `localhost` is not a reliable route to the host frontend.

Therefore automatic local revalidation is not operational. Use the frontend
address reachable from the WordPress container and matching secrets in both
processes. Until then, restart the local Next.js server after a content
change, or send a correctly HMAC-signed request using the local environment
secret. Never paste the secret into source or documentation.

## 13. Test and validation summary

Latest verified results:

- backend plugin suite: 54 tests, 176 assertions; functional assertions
  passed, with two known payment-plugin PHP deprecations;
- frontend suite: 25 test files, 153 tests passed at the latest code
  validation;
- TypeScript: passed;
- production build: passed;
- changed application files passed ESLint; full lint remains blocked only by
  five pre-existing `require()` violations in two `.cjs` scripts;
- PHP syntax and plugin activation behavior: passed;
- German and English routes, active navigation, local fonts, product fields,
  Kit/category resolution, Industries, sitemap, and REST permissions were
  browser/API checked during the completed phases;
- cart metadata, configured prices, quantity behavior, and PayPal validation
  gating have focused automated coverage;
- responsive checks covered 360, 768, 1024, and 1440px during page phases;
  the later cart check additionally covered 320px.

This summary is not a substitute for a final production-like order test.

## 14. Known limitations

### Content required before launch

| Item | Classification |
|---|---|
| Add real images to all Business Kits | Launch blocker |
| Add featured images to all Industries | Recommended before launch |
| Replace any remaining product missing-image states | Recommended before launch |
| Review all Business Kit titles, included items, and translations | Launch blocker |
| Confirm all product/Kit prices and stock | Launch blocker |
| Decide direct-purchase versus enquiry mode for every Kit | Launch blocker |
| Review Industry/product commercial copy and unsupported claims | Launch blocker |

### Security and infrastructure

| Item | Classification |
|---|---|
| Replace administrator Application Password with least privilege | Launch blocker |
| Configure production signed revalidation and reachable URL | Launch blocker |
| Configure and verify all production secrets | Launch blocker |
| Establish database/media backups and restore test | Launch blocker |
| Configure error/availability monitoring | Recommended before launch |

### Payment and commerce verification

| Item | Classification |
|---|---|
| Complete PayPal sandbox approval and end-to-end test | Launch blocker |
| Run a safe non-production order through order metadata/email flow | Launch blocker |
| Browser-test a real sale product | Recommended before launch |
| Browser-test out-of-stock product and variation states | Launch blocker |
| Review production tax and shipping configuration | Launch blocker |
| Verify transactional email delivery | Launch blocker |

### Known presentation issues

| Item | Classification |
|---|---|
| Populated full `/cart` page overflow at 320px | Resolved 29 July 2026 |

The responsive cart-row correction was browser-verified at 320, 360, 768,
and 1024px with no document overflow. It is distinct from the earlier
CartDrawer correction.

### Technical warnings

| Item | Classification |
|---|---|
| Payment plugin emits two PHP deprecations in tests | Recommended before launch |
| Five CommonJS `require()` lint failures in two utility scripts | Post-launch improvement |
| Streamed invalid dynamic routes return HTTP 200 plus `noindex` | Informational |
| Next.js middleware deprecation | Resolved: application uses `src/proxy.ts` |
| Insecure `NODE_TLS_REJECT_UNAUTHORIZED=0` warning | Resolved: scripts use system CA |

## 15. Final migration verdict

The intended architecture migrations are complete:

- semantic design system and local fonts;
- redesigned global shell and primary public pages;
- real WooCommerce shop/product/Kit system without fictional presets;
- WordPress-driven schema-v2 product fields;
- WordPress-managed Business Industries without a taxonomy;
- localized navigation, routes, metadata, sitemap, and focused caching;
- preserved cart, checkout, custom metadata, and payment integrations.

The project is ready for owner content population and structured
pre-production testing. It is not ready for public launch until the launch
blockers above are completed and verified in a production-like environment.

For routine ownership instructions, see
[`../KUBIKART-OWNER-HANDBOOK.md`](../KUBIKART-OWNER-HANDBOOK.md).
