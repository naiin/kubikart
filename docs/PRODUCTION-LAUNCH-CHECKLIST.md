# Kubikart production launch checklist

Last repository verification: 4 August 2026. This document records the code contract; it contains no credentials. Real provider tests remain pending until a publicly reachable staging deployment is configured.

## 1. Payment endpoint contract

Use the deployed frontend origin in place of `{FRONTEND_ORIGIN}`.

### Stripe

- Webhook URL: `{FRONTEND_ORIGIN}/api/webhooks/stripe`
- Required subscribed events handled by the route:
  - `payment_intent.succeeded`: validates the WooCommerce order ID, amount, and currency, then changes an eligible `pending`/`failed` order to `processing` and `set_paid: true`.
  - `payment_intent.payment_failed`: changes the bound order to `failed`.
  - `charge.refunded`: changes the order to `refunded` only for a full refund (`amount_refunded === amount`). Partial refunds currently require manual WooCommerce reconciliation.
  - `charge.dispute.created`: changes the order to `on-hold` and adds an internal dispute note.
- Signature: raw request body plus `Stripe-Signature`, verified using `STRIPE_WEBHOOK_SECRET`. Missing configuration returns `503`; missing/invalid signatures return `400`. No event is processed first.
- Duplicate payment detection: the WooCommerce order status and `transaction_id` are authoritative. A replay with the same transaction is a payment no-op; a competing transaction is rejected.
- Payment value validation: `frontend/src/lib/payment-transition.ts` compares provider cents and uppercase currency with the stored WooCommerce order total and currency before `set_paid`.
- PaymentIntent creation: `POST /api/stripe/create-payment-intent`, using the stored pending WooCommerce order total and idempotency key `wc-order-{orderId}`.

Not automated: `payment_intent.canceled`, partial Stripe refunds, dispute resolution/won/lost events. Operational decision: reconcile these in Stripe and WooCommerce manually until an owner-approved status policy is added.

### PayPal

- Webhook URL: `{FRONTEND_ORIGIN}/api/webhooks/paypal`
- Required subscribed events handled by the route:
  - `PAYMENT.CAPTURE.COMPLETED`: validates WooCommerce order ID, amount, and currency, then marks the eligible order paid/`processing`.
  - `PAYMENT.CAPTURE.REFUNDED`: marks the order `refunded` only when refund amount and currency equal the stored WooCommerce total; partial or currency-mismatched refunds receive an internal reconciliation note without a false full-refund status.
  - `PAYMENT.CAPTURE.DENIED`: changes the matching order to `failed`.
  - `PAYMENT.CAPTURE.DECLINED`: changes the matching order to `failed`.
  - `CUSTOMER.DISPUTE.CREATED`: changes the matching order to `on-hold` and adds an internal dispute note.
- Signature: PayPal transmission headers are sent to PayPal's `verify-webhook-signature` API with `PAYPAL_WEBHOOK_ID`. Missing configuration or failed verification returns `401` before processing.
- Capture URL: `POST /api/paypal/capture-order`. A confirmed PayPal capture independently performs the same WooCommerce amount/currency/payment transition checks.
- Create URL: `POST /api/paypal/create-order`, using the stored pending WooCommerce order total and `PayPal-Request-Id: wc-order-{orderId}`.
- Duplicate detection: WooCommerce order status plus `transaction_id`; paid-email delivery has a separate durable marker.

Not automated: an abandoned/customer-cancelled PayPal checkout remains `pending`; dispute resolution and partial-refund line/tax allocation require manual reconciliation.

## 2. Durable payment email state

Frontend-created orders contain `_kubikart_transactional_email_owner=mailtrap` and `_kubikart_payment_email_status=pending`. Paid/processing email delivery uses WooCommerce metadata:

- `pending`: no successful submission yet.
- `sending`: a delivery attempt owns a five-minute lease.
- `sent`: Mailtrap accepted submission; normal replays skip it.
- `failed`: submission failed and a verified provider retry may try again.
- Attempt, sent timestamp, and non-sensitive error-class metadata are also stored.

Payment is never rolled back because email failed. A webhook retry checks email state even when payment was already transitioned. The WordPress security plugin suppresses WooCommerce customer `processing` email only for orders explicitly marked as Mailtrap-owned, preventing a duplicate paid/processing message. WooCommerce retains ownership of failed, refunded, completion, and fulfilment lifecycle mail.

Concurrency limitation: WooCommerce REST metadata updates do not provide compare-and-swap. The short `sending` lease prevents normal sequential duplicates, but two events that read `pending` at exactly the same time could both acquire it. Provider replay plus durable `sent` is reliable for ordinary delivery; strict exactly-once delivery would require an atomic datastore or queue.

## 3. Transactional email ownership

| Flow | Sender/application |
|---|---|
| Newsletter confirmation/welcome | Next.js via Mailtrap |
| Contact confirmation | Next.js via Mailtrap |
| Account created/login alert | Next.js via Mailtrap |
| Paid/processing | Next.js via Mailtrap for marked frontend orders |
| Provider failure/refund and later order lifecycle | WooCommerce/WordPress |
| Password reset request | Repository WordPress security plugin via `wp_mail` |
| WooCommerce completion/fulfilment and non-frontend orders | WooCommerce/WordPress |
| Withdrawal confirmation | Next.js via Mailtrap |

Local WooCommerce inspection found customer processing and refunded emails enabled globally. The order marker/filter above is therefore required and must be deployed with the frontend.

Legal attachments default to `frontend/public/legal/agb.pdf` and `frontend/public/legal/widerruf.pdf`; both exist and are readable. Optional localized paths may be set with `MAIL_PDF_AGB_PATH` and `MAIL_PDF_WIDERRUF_PATH`; missing localized files fall back to the two existing generic files.

## 4. DHL administrative boundary

- Frontend route: `POST {FRONTEND_ORIGIN}/api/shipping/label`.
- Authentication: `Authorization: Bearer <DHL_LABEL_SECRET>`; missing or incorrect credentials return `401` using constant-time comparison.
- Current caller: the WooCommerce order-admin DHL metabox in `kubikart-dhl-shipping.php`.
- The admin browser calls authenticated `admin-ajax.php` with a WordPress nonce. WordPress then calls the frontend server-to-server and adds the bearer header from `KUBIKART_DHL_LABEL_SECRET`.
- `KUBIKART_DHL_LABEL_SECRET` in WordPress must equal frontend `DHL_LABEL_SECRET`. Never render either value into browser HTML or JavaScript.
- Only users with `manage_woocommerce` can invoke the WordPress proxy.

## 5. WordPress and revalidation boundary

- Frontend WordPress REST reads use an Application Password in an HTTPS Basic Authorization header.
- WooCommerce requests use restricted consumer credentials in an HTTPS Basic Authorization header, never query strings.
- Commercial API calls occur in server modules/routes; only public WordPress/media and provider client identifiers use `NEXT_PUBLIC_*`.
- Revalidation URL: `POST {FRONTEND_ORIGIN}/api/revalidate`.
- Frontend secret: `REVALIDATE_SECRET`.
- WordPress constant: `KUBIKART_REVALIDATE_SECRET`; it must contain the same value.
- Signature: base64 HMAC-SHA256 over the exact raw JSON body in `X-WC-Webhook-Signature`, compared in constant time.
- Topics/tags:
  - `product.*`: `wc-products` and the slug-specific `wc-product-{slug}`.
  - `industry.*`: industry list, locale, ID, localized slug, and sitemap tags plus localized paths.
  - `coupon.*` and `order.*`: intentionally skipped.
  - other valid signed topics: broad product/category invalidation.
- `NEXT_PUBLIC_WORDPRESS_URL` supplies the deployed media hostname to Next image configuration; update it before building each environment.

## 6. Environment-variable contract

Runtime secrets are checked lazily in the route that needs them so builds can run when deployment injects secrets only at runtime. `NEXT_PUBLIC_*` values are embedded into browser/build output and must never contain secrets.

| Variable | Scope | Required purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Build + browser | Canonical frontend origin and links |
| `NEXT_PUBLIC_WORDPRESS_URL` | Build + browser | Public media origin and WordPress URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Build + browser | Stripe sandbox/live publishable identifier |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Build + browser and PayPal server auth | Public PayPal client identifier |
| `WORDPRESS_API_URL` | Server runtime | WordPress REST base |
| `WP_APP_USER`, `WP_APP_PASSWORD` | Server runtime | Least-privileged Application Password authentication |
| `WC_API_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` | Server runtime | WooCommerce commercial reads/writes |
| `AUTH_SESSION_SECRET` | Server runtime | Signed HTTP-only session; minimum 32 characters |
| `STRIPE_SECRET_KEY` | Payment runtime | Create/retrieve Stripe objects |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook only | Verify Stripe raw webhook signature |
| `PAYPAL_SECRET`, `PAYPAL_MODE` | Payment runtime | PayPal OAuth and sandbox/live selection |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook only | Remote webhook signature verification |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Production server runtime | Distributed rate limiting; production fails closed without both or when unavailable |
| `MAILTRAP_TOKEN` | Email runtime | Mailtrap submission; missing token throws and remains retryable |
| `MAILTRAP_TEMPLATE_*` | Email runtime | Flow/status template UUIDs |
| `MAIL_PDF_AGB_PATH`, `MAIL_PDF_WIDERRUF_PATH` | Optional email runtime | Legal PDF paths relative to `public` |
| `REVALIDATE_SECRET` | Revalidation route only | Verify WordPress/WooCommerce HMAC |
| `DHL_LABEL_SECRET` | Administrative route only | Authenticate WordPress-to-frontend label request |
| `DHL_API_URL`, `DHL_API_KEY`, `DHL_USERNAME`, `DHL_PASSWORD` | DHL runtime | DHL provider authentication |
| `DHL_BILLING_NUMBER_*`, `DHL_SENDER_*` | DHL runtime | Label contract and sender details |
| `FREE_SHIPPING_THRESHOLD`, `DHL_PRICE_*` | Server runtime | Server-authoritative shipping calculation |
| `CF7_FORM_ID` | Optional server runtime | Contact Form 7 integration |

The audit originally called these “four secrets,” but the missing list contains five variables across four integration areas: Stripe webhook, PayPal webhook, Upstash (two variables), and DHL label authentication.

## 7. Owner-managed infrastructure checklist

- [ ] Set all variables in the hosting environment; never paste values into tickets/chat or commit them.
- [ ] Create Stripe sandbox and PayPal sandbox webhook endpoints using the exact URLs/events above.
- [ ] Provision production-grade Upstash Redis and scope preview/production credentials separately.
- [ ] Create a least-privileged WordPress integration user and dedicated Application Password.
- [ ] Create restricted WooCommerce API keys; rotate historical/admin-level keys.
- [ ] Set matching `REVALIDATE_SECRET` / `KUBIKART_REVALIDATE_SECRET` and a WordPress-reachable frontend URL.
- [ ] Set matching `DHL_LABEL_SECRET` / `KUBIKART_DHL_LABEL_SECRET`.
- [ ] Restrict `/wp-admin` and `/wp-login.php`; enable administrator 2FA.
- [ ] Confirm `DISALLOW_FILE_EDIT`; disable XML-RPC if unused.
- [ ] Configure WAF/rate limits, database/media backups, and a tested restoration procedure.
- [ ] Verify Mailtrap sending domain, templates, German/English rendering, and suppression of duplicate WooCommerce payment emails.
- [ ] Keep CSP report-only during staging; review violations before enforcement.

## 8. Business Kit launch state

Live local WooCommerce inspection on 4 August 2026 found all five German/English Kit pairs published but out of stock, without price, and `purchasable=false`. No Kit is incorrectly directly purchasable.

The Starter Visibility Kit is also on hold. Its intended €89.90 price and final contents are not an approved repository source of truth, so owner confirmation is required before enabling it. Before enabling either language record, complete contents, quantities, materials, dimensions, personalization, shipping weight/dimensions, stock model, fulfilment steps, gross price/tax, and a full sandbox order. Gastro, Barber & Salon, Reception, and Local Shop Window remain enquiry-led.

## 9. CSP and viewport readiness

CSP remains `Content-Security-Policy-Report-Only`. It explicitly covers Stripe, PayPal, same-origin assets, HTTPS images (including the configured WordPress media host), data/blob images, and local fonts. No analytics provider is configured. Do not add wildcard script/connect sources.

Manually test at 360, 768, 1024, and 1440 px in both German and English: homepage, shop, one simple and one personalized product, populated cart, checkout, payment success/failure, account, and order history. Also test the populated cart at 320 px for horizontal overflow.

Local production-browser evidence on 4 August 2026: a populated German cart with a long product name and long personalization text measured `clientWidth=320`, `scrollWidth=320` (0 px document overflow). All other viewport/route rows still require staging evidence.
