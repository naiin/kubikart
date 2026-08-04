# Business Industries

**Status:** Implemented through Phases 7A–7C  
**Plugin:** `kubikart-business-industries`  
**Frontend routes:** `/[locale]/businesses` and `/[locale]/businesses/[industrySlug]`

## Purpose

A Business Industry is one complete, localized customer-facing landing page
for a type of business such as a restaurant, salon, clinic, or local shop.
WordPress owns the editorial content; WooCommerce continues to own every
sellable product and Business Kit.

The internal post type is `business_industry`. Its WordPress REST base is
`business-industries`.

No Industry taxonomy is used because an Industry needs its own title,
excerpt, long-form content, featured image, editorial ordering, translation,
and selected WooCommerce relationships. A taxonomy term would require a
second content object or duplicated fields. The post itself is therefore the
single source for the landing page.

The plugin does not create an archive or WordPress permalink. Next.js owns:

- `/[locale]/businesses`
- `/[locale]/businesses/[industrySlug]`

## Content owned by an Industry

Core WordPress fields:

- title and slug;
- excerpt;
- main editor content;
- featured image;
- revisions;
- menu order through Page Attributes;
- publication state;
- Polylang language and translation relationships.

Relationship metadata:

| Meta key | Shape | Purpose |
| --- | --- | --- |
| `_kubikart_featured_kit_id` | One optional integer | WooCommerce Product ID for the featured localized Business Kit |
| `_kubikart_related_product_ids` | Ordered unique integer array | WooCommerce Product IDs to resolve on the frontend |

Only IDs are stored. Product titles, descriptions, prices, images, stock,
availability, slugs, categories, and variations remain in WooCommerce.

## Owner editing workflow

1. Open **Business Industries → Add New**.
2. Choose the post language in Polylang.
3. Enter the title, excerpt, main content, and featured image.
4. Set the display order in **Page Attributes**.
5. In **Kubikart Product Relationships**, choose one featured Business Kit or
   **None selected**.
6. Search and select related WooCommerce products.
7. Drag selected related-product rows into the intended display order.
8. Publish the post.
9. Create the second-language post through Polylang, translate its editorial
   fields, select products for that language, and link the translations.

Creating a new Industry never requires a Next.js source-code mapping. The
frontend queries published WordPress records.

## Featured Business Kit

The selector contains real WooCommerce products assigned to the canonical
localized Business Kits category:

- German category slug: `business-kits-de`
- English category slug: `business-kits`

Category IDs are deliberately not stored in plugin code. WordPress resolves
membership from the current product/category records.

The selector shows product title, ID, publication state, and language when
Polylang supplies one. A current saved value remains visible for review even
if its language or category assignment is no longer correct.

A save is rejected when the selected ID:

- is not a WooCommerce Product;
- no longer exists; or
- is not assigned to the localized Business Kits category.

The existing stored relationship remains unchanged after a rejected save.

## Related products

The related-products editor:

- lists real WooCommerce products rather than accepting manual IDs;
- supports searching;
- displays title, ID, publication state, and language;
- supports multiple selection;
- removes duplicate submitted IDs;
- keeps the owner-defined order;
- warns about detectable language mismatches without blocking the save.

If a saved product has been deleted or is unavailable, the editor reports
the stale ID. It does not invent a replacement or silently rewrite the
relationship.

## Polylang workflow

`business_industry` is added to Polylang’s translatable post-type list through
the `pll_get_post_types` integration.

German and English posts are separate WordPress records linked by Polylang.
Each record independently owns:

- title and slug;
- excerpt and content;
- featured image;
- display order;
- related products;
- featured Kit.

The plugin does not machine-translate or automatically create the second
language. Product-language mismatches are warnings because an administrator
may have a legitimate temporary reason to keep one; they do not block saving.

When Polylang is active, its normal REST integration supplies language and
translation data for the registered REST-enabled post type.

## REST representation

Authenticated reads use:

```text
GET /wp-json/wp/v2/business-industries
GET /wp-json/wp/v2/business-industries/{id}
```

Core REST fields include:

- `id`;
- `slug`;
- `status` when permitted by the request context;
- `title`;
- `excerpt`;
- `content`;
- `featured_media`;
- `menu_order`;
- `modified` and `modified_gmt`;
- Polylang language and translation fields when available.

The authenticated REST record exposes only the two approved relationship
fields at its root:

```json
{
  "_kubikart_featured_kit_id": 123,
  "_kubikart_related_product_ids": [456, 789]
}
```

Relationships return IDs only. The Next.js server resolves current product
data through the existing WooCommerce client.

Published relationship reads require an authenticated account that can
`read_post`. REST writes require `edit_post` and run the same WooCommerce
validation as the native editor. Generic protected post metadata is not
exposed.

## Security

The post type uses WordPress post capabilities and mapped meta capabilities.
Relationship meta can be edited only by a user who can edit the Industry
post.

The save handler requires:

- the Industry metabox nonce;
- `edit_post` capability;
- a real `business_industry` post;
- a non-autosave, non-revision request;
- valid WooCommerce relationships.

The existing Kubikart Security plugin continues to require authenticated
server-to-server access for core WordPress REST endpoints. WordPress’s REST
post controller prevents unauthorized draft/private access. The implementation
does not add an anonymous REST bypass.

## WooCommerce unavailable and stale data

If WooCommerce is unavailable:

- saved relationship metadata remains untouched;
- the editor displays the saved IDs for diagnosis;
- relationship controls are not offered as though their data were valid;
- an administrator sees a warning;
- no IDs are deleted.

Invalid or stale submitted IDs reject the relationship update as a unit.
This prevents a partial save from silently losing owner-managed ordering or
relationships.

## Cache revalidation

The plugin reuses the existing signed Kubikart `/api/revalidate` mechanism.
It sends lifecycle topics for:

- `industry.updated` after publish, update, or a move to draft;
- `industry.trashed`;
- `industry.restored`;
- `industry.deleted`.

The body contains the Industry ID, slug, status, and language. It does not
contain product copies or credentials.

Configure outside source control:

```php
define('KUBIKART_FRONTEND_URL', 'https://www.kubikart.de');
define('KUBIKART_REVALIDATE_SECRET', 'same-value-as-frontend-REVALIDATE_SECRET');
```

The frontend maps `industry.*` topics to the Industry collection, locale, ID,
localized-slug and sitemap cache tags, plus the real translated overview and
detail paths supplied in the signed payload.

The frontend reads published Industries server-side with
`WORDPRESS_API_URL`, `WP_APP_USER`, and `WP_APP_PASSWORD`. These values are
server-only and must never use a `NEXT_PUBLIC_` prefix.

## Activation and deactivation

Activate the plugin once:

```bash
cd backend
lando wp plugin activate kubikart-business-industries
```

Activation registers the post type and flushes rewrite rules once. It does
not create posts, translations, products, categories, or relationships.

Deactivation flushes rewrite rules and deliberately retains all Industry
posts and metadata:

```bash
lando wp plugin deactivate kubikart-business-industries
```

There is no uninstall deletion routine.

## Manual testing

1. Activate the plugin and confirm **Business Industries** appears in admin.
2. Add a draft and confirm title, editor, excerpt, featured image, revisions,
   and Page Attributes are available.
3. Confirm the featured-Kit selector contains localized real Kit products,
   publication states, and a **None selected** choice.
4. Select related products, reorder them, save, and reload.
5. Confirm both meta values through authenticated REST.
6. Try a product from the other language and confirm a non-blocking warning.
7. Temporarily deactivate WooCommerce in a safe development environment and
   confirm saved IDs remain visible and unchanged.
8. Link German and English records through Polylang and verify independent
   relationship selections.
9. Move a post through published, draft, trash, restore, and permanent delete
   states while observing signed revalidation requests.
10. Confirm unauthenticated requests cannot read protected REST content and
    draft/private content remains capability-protected.

## What this plugin does not manage

The plugin itself does not:

- own frontend routes or navigation links;
- create sample Industries;
- create an Industry taxonomy;
- create Portfolio or Case Study content;
- create or duplicate WooCommerce Products or Business Kits;
- copy commercial product data into Industry posts;
- migrate product categories;
- translate content automatically;
- expose WordPress REST publicly;
- manage frontend cache tags directly;
- modify cart, checkout, payment, or account behavior.
