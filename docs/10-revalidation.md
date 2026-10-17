# Frontend cache revalidation (WordPress → Next.js)

Status: implemented and verified locally (Lando) on 2026-10-15. Nothing was deployed.

## 1. Why this exists

The Next.js frontend caches every WooCommerce / WordPress response for 300 s
(`revalidate: 300`) and tags it. Without a push from WordPress an edited price,
title, stock state or category name only appears after the window expires.

Before this change the push existed in two places only (personalisation-field /
kit-contents admin saves and industry posts), and **neither worked locally**:
`KUBIKART_REVALIDATE_SECRET` was never defined, so the sender returned silently.
Ordinary product edits (admin, WC REST, WP-CLI, stock changes) and category edits
were never announced at all.

## 2. What depends on what

All pages are server-rendered on demand (`ƒ` in `next build`); the only cache
involved is the fetch data cache, so tag invalidation is sufficient and no
`revalidatePath` is needed for products/categories.

| Page | Data (cache tags) | Invalidated by |
|---|---|---|
| `/de|en/shop/<slug>` | `getProduct` → `wc-products`, `wc-product-<slug>`; variations, related products | `product.*` |
| `/de|en/shop` | `getProducts` → `wc-products`; `getCategories` → `wc-categories` | `product.*`, `category.*` |
| `/de|en/services/brand-kit` | `getBusinessKits` → `wc-categories` + `wc-products` | `product.*`, `category.*` |
| `/de|en/businesses/<slug>` | industry post (`wp-industries`, `wp-industry-<id>`, slug/locale tags) + `getProduct(id)` for kit/related products (`wc-products`) | `industry.*` and `product.*` |
| `/de|en/businesses` | industries tags | `industry.*` |
| `/de`, `/en` | `getBusinessKits`, `getProducts`, `getCategories`, industries | `product.*`, `category.*`, `industry.*` |

Endpoint: `frontend/src/app/api/revalidate/route.ts`. The sender (the mu-plugin) sends the Unix time in
`X-Kubikart-Timestamp` and a base64 HMAC-SHA256 of `"<timestamp>.<raw body>"` (key `REVALIDATE_SECRET`) in
`X-WC-Webhook-Signature`. Strict: a missing/invalid signature, a timestamp outside a 5-minute window, or an unset secret
returns 401 and changes nothing, so a captured request cannot be replayed later (within the window the action is
idempotent: it only purges cache). Native WooCommerce webhooks cannot send a timestamp; they are accepted only with
`REVALIDATE_ALLOW_UNTIMED_WEBHOOKS=true`. The shared signing helper is `frontend/src/lib/signed-request.ts`.

| Topic | Effect |
|---|---|
| `product.*` | `wc-product-<slug>` for the slug **and every translation slug**, `wc-products`, `wc-categories` (category counts) |
| `category.*` / `product_cat.*` | `wc-products`, `wc-categories` (category names are embedded in product payloads) |
| `industry.*` | industry tags + `/businesses` paths + sitemap |
| `coupon.*`, `order.*` | skipped |
| anything else | `wc-products` + `wc-categories` |

Changes made to the route: translation slugs are revalidated, product topics also
expire the category list, explicit `category.*` branch. Tests:
`frontend/src/__tests__/api/revalidate.test.ts`.

**Frontend bug found and fixed while verifying:** `getProducts()` (`lib/woocommerce.ts`)
did not send `status`, and the authenticated WC REST client returns drafts. A product
set to *draft* therefore stayed in the shop listing and on the homepage even after a
correct revalidation. `getProducts` now defaults to `status: "publish"` (callers can still override it).

## 3. WordPress side

`backend/wordpress/wp-content/mu-plugins/kubikart-frontend-revalidation.php`
(single place for URL, secret, signing, logging):

| WordPress / WooCommerce event | Topic |
|---|---|
| `woocommerce_new_product` | `product.created` |
| `woocommerce_update_product` (admin, REST, `->save()`), `save_post_product` (`wp post update`), `transition_post_status` (e.g. publish → draft) | `product.updated` |
| `woocommerce_product_set_stock`, `…_variation_set_stock`, `…_set_stock_status` (orders, imports) | `product.updated` |
| variation new / update / trash / delete (resolved to the parent product) | `product.updated` |
| direct meta writes to `_price`, `_regular_price`, `_sale_price`, `_stock`, `_stock_status`, `_thumbnail_id` | `product.updated` |
| `wp_trash_post`, `before_delete_post` (slug captured *before* WP appends `__trashed`) | `product.deleted` |
| `untrashed_post` | `product.restored` |
| `created_product_cat` / `edited_product_cat` / `delete_product_cat` | `category.created` / `category.updated` / `category.deleted` |
| industry posts (`kubikart-business-industries`, now routed through the same queue) | `industry.updated` / `.trashed` / `.restored` / `.deleted` |

Body: `{id, slug, status, language, translations: {de: {id, slug}, en: {id, slug}}}`
(categories: `id, slug, name, taxonomy, …`).

Behaviour guarantees:

* Events are collected per request and de-duplicated by `topic + id`; one signed
  request per unique event is sent on `shutdown`, after meta/terms/stock are written
  (so a REST save that writes industry meta after `save_post` is still covered).
* Under PHP-FPM the HTTP response is flushed first (`fastcgi_finish_request`), so the
  editor/API client never waits for the frontend.
* Timeout 2 s (`kubikart_frontend_revalidate_timeout` filter); after the first
  failure the remaining events of that request are skipped. A save never fails
  because of revalidation. Failures are logged with `error_log('[kubikart-revalidate] …')`
  — never with the secret; an HTTP 401 logs a hint to compare the two secrets.
* A fire-and-forget (`blocking => false`) request was tried first and lost 1 of 16
  events when the frontend was busy; the deferred, short-timeout, blocking send delivered
  every event in the later runs (see table, row 14).
* `kubikart_revalidate_product_fields($post_id)` still exists (personalisation-field and
  kit-contents saves) and now delegates to the mu-plugin.
* Kill switch: `add_filter('kubikart_frontend_revalidate_enabled', '__return_false');`.

## 4. Configuration

| | WordPress | Frontend |
|---|---|---|
| URL of the frontend | constant `KUBIKART_FRONTEND_URL` | — |
| shared secret | constant `KUBIKART_REVALIDATE_SECRET` | env `REVALIDATE_SECRET` |

The two secrets must be byte-identical. **Never commit the secret.**

### Local (Lando)

`backend/wordpress/wp-config.php` (tracked, contains no secret) resolves
`KUBIKART_FRONTEND_URL` and `KUBIKART_REVALIDATE_SECRET` from, in order:

1. the process environment (`getenv`), e.g. `KUBIKART_FRONTEND_URL=http://… wp …`
2. the untracked `backend/.local-secrets.php` (listed in `.gitignore`)
3. default `KUBIKART_FRONTEND_URL = http://localhost:3000` (kept; the deploy script rewrites that define)

`backend/.local-secrets.php`:

```php
<?php
return array(
	'KUBIKART_REVALIDATE_SECRET' => '<REVALIDATE_SECRET from frontend/.env.local>',
	// 'KUBIKART_FRONTEND_URL'   => 'http://host.lando.internal:3000',
);
```

Copy the value from `frontend/.env.local` programmatically (a small script that reads
`REVALIDATE_SECRET` and writes the file); do not paste it into chat, logs or tracked files.

**Network caveat (important):** WordPress runs inside the Lando container, so
`http://localhost:3000` is the *container itself*, not your Next.js server. Use
`http://host.lando.internal:3000` (uncomment the URL line above). On this machine the
host firewall additionally drops container → host traffic (ports 3000 and a test port
timed out from the container); allow the Docker bridge range to your frontend port, e.g.
`sudo ufw allow from <DOCKER_BRIDGE_CIDR> to any port 3000 proto tcp`. Until that is
done local edits are **not** pushed (the log shows `cURL error 28/7`), and the frontend
falls back to the 300 s window. For verification the Next.js server was run in a
container that shares the appserver network namespace
(`docker run --network container:kubikartbackend_appserver_1 …`), which makes
`http://localhost:<port>` valid for WordPress.

### Production (placeholders only)

Frontend (Vercel / hosting environment):

```
REVALIDATE_SECRET=<REVALIDATE_SECRET>        # e.g. openssl rand -base64 32
```

WordPress (Strato):

```php
define( 'KUBIKART_FRONTEND_URL', '<FRONTEND_URL>' );             // e.g. https://www.<your-domain>; set by deploy-backend.py from PRODUCTION_FRONTEND_URL
define( 'KUBIKART_REVALIDATE_SECRET', '<REVALIDATE_SECRET>' );    // same value as the frontend
```

`deploy-backend.py` regenerates the remote `wp-config.php` from the tracked file and
only substitutes `KUBIKART_FRONTEND_URL`, so a hand-added define in the remote
`wp-config.php` is lost on the next deploy. Provide the secret in a way that survives
it: the server environment variable `KUBIKART_REVALIDATE_SECRET` (picked up by the
`getenv` branch), or an untracked `.local-secrets.php` one directory above the remote
`wp-config.php`, or extend the deploy script to write the define from a
`PRODUCTION_REVALIDATE_SECRET` value (not done here). Verify after deploy:
`wp --allow-root eval 'var_dump(defined("KUBIKART_REVALIDATE_SECRET"));'` and edit a product price.
The URL must be reachable from WordPress (public HTTPS, no auth wall).

### Optional: WooCommerce webhooks instead of / in addition to the mu-plugin

WooCommerce → Settings → Advanced → Webhooks → *Add webhook*: topics *Product created /
updated / deleted* (and *restored*), delivery URL `<FRONTEND_URL>/api/revalidate`,
secret `<REVALIDATE_SECRET>`, API version *WP REST API Integration v3*. They cover
products only (not categories or industries, and WooCommerce disables a webhook after
repeated delivery failures), so the mu-plugin remains the primary mechanism; both can
run together — revalidation is idempotent.

## 5. Verification evidence (local, 2026-10-15, no secrets)

Kit: Barber & Salon (DE post 164 `barber-salon-kit-de`, EN post 163 `barber-salon-kit`).
Pages checked after each change, *without* calling the endpoint manually and without
waiting: product page, `/shop`, `/services/brand-kit`, `/businesses/barbershops-salons`
(`/barbers-salons`), `/businesses`, `/de`, `/en`. Run on a Next.js dev server (:3101) and
on a production build (`next build && next start`, :3102).

| # | Scenario / path | Result |
|---|---|---|
| 0 | Baseline: price change via WC object, WordPress cannot reach the frontend (original local state) | all pages stale |
| 1 | Price 149 → 15x/16x/17x, WC object `->save()` (WP-CLI), dev + prod build | product, shop, brand-kit, industry, home updated, DE and EN |
| 2 | Title edit via `wp post update` (DE + EN), dev + prod build | all pages updated |
| 3 | Stock status in/out of stock | product JSON-LD, brand-kit, industry and home switch to *sold out* and back |
| 4 | `post_status` publish → draft → publish | product 404, removed from shop/brand-kit/industry/home, restored (needed the `getProducts` status fix) |
| 5 | Trash / untrash product (`wp_trash_post`) | product 404 + removed, then restored; slug `barber-salon-kit-de` intact |
| 6 | Category rename (WP-CLI and **wp-admin term form**), DE+EN terms | category label updated on product page and shop |
| 7 | Industry title edit: WP-CLI, **REST (`/wp/v2/business-industries/182`, admin cookie)** | industry page, `/businesses`, home updated |
| 8 | **wp-admin product editor** (Playwright, minted cookie): price 158 and *Update* | all 10 pages updated; token destroyed afterwards |
| 9 | **WC REST API** (`PUT /wc/v3/products/164`, key from `.env.local`): 159 and back to 149 | all pages updated both ways; response 0.4 s |
| 10 | Endpoint: missing, empty, garbage, wrong-secret signature; tampered body; signature of another body | **401** ×6, cache unchanged (DB changed behind WordPress's back; pages kept the old value) |
| 11 | Endpoint: valid signature | **200**, pages show the new value |
| 12 | Failure isolation: closed port (`cURL error 7`) | REST save 200 in 0.36 s, WP-CLI normal duration, one log line |
| 13 | Failure isolation: black-holed address | REST save 200 in 0.40 s; WP-CLI +2 s once (timeout), one log line, save succeeded |
| 14 | Reliability: 10 saves (20 events) while the frontend served other requests | 20/20 delivered (the earlier non-blocking variant: 15/16) |

Test suites: `pnpm test` 289/289, `tsc --noEmit` and `eslint --max-warnings=0` clean,
PHPUnit 158 tests OK (`KubikartFrontendRevalidationTest`: 18), `php -l` clean on all touched PHP files.
`KubikartCustomerFilesTest::test_rest_permissions` fails under `--order-by=reverse`
(pre-existing order dependence, unrelated).

All temporary edits were reverted and verified: prices 149 (DE + EN), titles,
stock `instock`, `publish`, catalog visibility `visible`, category and industry names.

## 6. Known limits

* Writes that bypass WordPress APIs entirely (raw SQL, an import that writes
  meta with `$wpdb`) cannot be detected; send a signed `product.updated` manually
  or wait for the 300 s window.
* A WooCommerce order reduces stock → one revalidation per order request
  (de-duplicated within the request). Acceptable at current volume.
* Only WordPress-side events are covered; pages that depend on static code content
  (`business-kits.ts`, translations) change with a frontend deploy.
