# Commerce, payments and checkout verification

Cart, checkout, Stripe/PayPal, order e-mail state, the DHL label boundary and the test evidence. Environment variables and hosting are in [production launch](12-production-launch.md); e-mail ownership in [e-mail](09-email.md).

## 1. Payment and order contract

Last repository verification: 4 August 2026. This document records the code contract; it contains no credentials. Real provider tests remain pending until a publicly reachable staging deployment is configured.

### Payment endpoint contract

Use the deployed frontend origin in place of `{FRONTEND_ORIGIN}`.

#### Stripe

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

#### PayPal

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

### Durable payment email state

Frontend-created orders contain `_kubikart_transactional_email_owner=mailtrap` and `_kubikart_payment_email_status=pending`. Paid/processing email delivery uses WooCommerce metadata:

- `pending`: no successful submission yet.
- `sending`: a delivery attempt owns a five-minute lease.
- `sent`: Mailtrap accepted submission; normal replays skip it.
- `failed`: submission failed and a verified provider retry may try again.
- Attempt, sent timestamp, and non-sensitive error-class metadata are also stored.

Payment is never rolled back because email failed. A webhook retry checks email state even when payment was already transitioned. The WordPress security plugin suppresses WooCommerce customer `processing` email only for orders explicitly marked as Mailtrap-owned, preventing a duplicate paid/processing message. WooCommerce retains ownership of failed, refunded, completion, and fulfilment lifecycle mail.

Concurrency limitation: WooCommerce REST metadata updates do not provide compare-and-swap. The short `sending` lease prevents normal sequential duplicates, but two events that read `pending` at exactly the same time could both acquire it. Provider replay plus durable `sent` is reliable for ordinary delivery; strict exactly-once delivery would require an atomic datastore or queue.

### DHL administrative boundary

- Frontend route: `POST {FRONTEND_ORIGIN}/api/shipping/label`.
- Authentication: `Authorization: Bearer <DHL_LABEL_SECRET>`; missing or incorrect credentials return `401` using constant-time comparison.
- Current caller: the WooCommerce order-admin DHL metabox in `kubikart-dhl-shipping.php`.
- The admin browser calls authenticated `admin-ajax.php` with a WordPress nonce. WordPress then calls the frontend server-to-server and adds the bearer header from `KUBIKART_DHL_LABEL_SECRET`.
- `KUBIKART_DHL_LABEL_SECRET` in WordPress must equal frontend `DHL_LABEL_SECRET`. Never render either value into browser HTML or JavaScript.
- Only users with `manage_woocommerce` can invoke the WordPress proxy.

## 2. Stripe test-mode verification (2026-10-15)

Date: 2026-10-15. Scope: Stripe (test mode) payments, webhook handling, paid-order emails. PayPal was not exercised. No secrets, tokens or customer data are recorded here.

### Method

- A dev server (port 3200) ran against the local WooCommerce with the real `.env.local` (`sk_test_…`, Mailtrap live-API configuration unchanged).
- The Stripe CLI is unavailable locally. A later attempt downloaded the official CLI binary (v1.53.1) to a temporary folder and ran `stripe listen --api-key …` with the project's test-mode secret key; Stripe rejected it (`oauth_not_supported`: the key lacks the permission the CLI needs to open a forwarding session), so forwarding needs an interactive `stripe login` by the account owner or a Dashboard test-mode endpoint secret. The temporary binary and config were removed.
- Earlier note: the Stripe CLI is unavailable, so no real `whsec_…` was used. The server got a **locally generated** `STRIPE_WEBHOOK_SECRET` (process environment only). Webhook requests were signed with `stripe.webhooks.generateTestHeaderString` and carried **real test-mode event JSON** read from `GET /v1/events`. This proves our handler's verification and business logic; it does **not** prove that Stripe can reach a public endpoint or that the production signing secret is correct.
- Payments were real test-mode PaymentIntents (card `4242…` and `4000 0000 0000 0002` through the Stripe Payment Element in Chrome; later orders via create-order → create-payment-intent → confirm with `pm_card_visa`).
- Order state was read with WP-CLI; email state from the Mailtrap email-logs API.

### Results

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Browser checkout, Business Kit with personalisation + file upload, Stripe Elements | Pass | Elements iframes driven with Playwright; PaymentIntent `succeeded`; UI reached the order-placed screen; cart emptied |
| 2 | Declined card `4000…0002` | Pass (after fix) | Card error shown in the form, cart kept, order stayed `pending`; failed webhook → `failed`. Retrying/switching method on that order returned 409 **(bug, fixed)** |
| 3 | Signature handling | Pass | valid → 200; missing → 400; garbage, wrong secret, 1 h-old timestamp, tampered body → 400; no secret configured → 503 (unit test) |
| 4 | Correct order marked paid | Pass | `pending` → `processing`, `transaction_id` = PaymentIntent id, `payment_method` = stripe, paid date set |
| 5 | Duplicate delivery | Sequential: pass. Concurrent: **bug, fixed** | Sequential replay: no status change, no note, no email. 6 concurrent identical events: one status change/note, but **4 duplicate emails** before the fix; **exactly 1** after it |
| 6 | Amount / currency mismatch | Pass | tampered amount, `usd` currency, and another order's real event all → 500, order stays `pending`, no email. (500 makes Stripe retry; it is deliberately loud.) |
| 7 | Personalisation meta + file marker | Pass | All line-item meta intact after payment; `_kubikart_customer_files` on the order unchanged; a token already attached to another order is not re-attached (by design) |
| 8 | Success screen reflects real state | **Bug, fixed** | Page always showed a green "success" and emptied the cart. Now reads the PaymentIntent via the return URL's client secret: paid / processing / failed / unknown; a forged `redirect_status` is ignored |
| – | Full refund event | Pass | `charge.refunded` → order found by transaction id → `refunded` |
| – | Late `payment_intent.payment_failed` for a paid order | **Bug, fixed** | Previously flipped a `processing` order to `failed` and overwrote its transaction id |

### Bugs fixed (unit-tested)

1. **Concurrent duplicate events sent duplicate emails.** `deliverWooOrderPaidEmail` now takes an atomic claim (`src/lib/distributed-lock.ts`, Upstash `SET NX PX`, process-local fallback in development, fail-closed in production) before reading/writing the durable email state. The claim is released afterwards, so a failed send can be retried.
2. **Declined order could not be retried.** `verifyPendingPaymentOrder` now accepts `failed` as well as `pending` (the webhook path already allowed `failed → processing`).
3. **Stale/replayed events could undo newer state.** `updateOrderStatus` in the Stripe webhook only transitions: failure from `pending`; refund/dispute from `processing|completed|on-hold`. Refund/dispute lookups by fuzzy search must match the order's `transaction_id`.
4. **Success page assumed success** (`checkout/success/page.tsx`, `src/lib/payment-return.ts`).
5. **Log hygiene.** A failed signature check logged the SDK error, which embeds the full signed payload. Only the message is logged now.

Tests: `payment-order`, `payment-return`, `distributed-lock`, `order-status-email` (concurrency + retry), `stripe-webhook-status`. Full run: `tsc --noEmit`, `eslint --max-warnings=0`, `pnpm test` (46 files / 280 tests) all pass.

### Email

- Mailtrap is used through `MailtrapClient({ token })` with **no** `sandbox`/`testInboxId`/`bulk` flags, so it is the **live Email Sending API**, not the testing sandbox (the account's sandbox inbox is unused). Sender `noreply@kubikart.de`; domain `kubikart.de` is DNS-verified and compliant in Mailtrap.
- Owner-controlled recipient: `info@kubikart.de` (Mailtrap account owner address; legal-notice/contact address). Only this address was used. A live token means arbitrary addresses would reach real people, so no other address was used.

| Email | Provider acceptance | Delivery evidence |
|---|---|---|
| Paid-order ("In Bearbeitung / Processing"), via the signed `payment_intent.succeeded` path | `_kubikart_payment_email_status = sent` (SDK send did not throw) | Mailtrap email-logs: status `delivered`, category `order_status_processing` |
| Contact confirmation, via `POST /api/contact` | Response `success:true` (note: the route returns success even if the email fails, so this alone proves nothing) | Mailtrap email-logs: `delivered`, category `contact_confirmation` |

"delivered" is the receiving server's acceptance; actual inbox/spam placement and template rendering were **not** inspected (needs a human to open the mailbox). The contact enquiry is also stored in WordPress; that is not email evidence. The site sends **no owner notification email** for a new contact enquiry (only a private WP post unless Contact Form 7 is configured) — decide whether the owner should be notified.

### Missing inputs / not verifiable here

- **`STRIPE_WEBHOOK_SECRET`** (`whsec_…`): not in `.env.local`. Obtain it from `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (CLI, local) or from the Dashboard webhook endpoint (staging/production). Without it the route returns 503 by design.
- A publicly reachable endpoint to prove Stripe-to-site delivery.
- Klarna redirect flow and the `processing` PaymentIntent state (no test automation available). The success page maps them (`processing` → "being processed"), covered by unit tests only.
- PayPal sandbox flow (not part of this task).

### Production setup

1. Dashboard → Developers → Webhooks → add endpoint `https://<production-domain>/api/webhooks/stripe` (live mode, separate from the test endpoint).
2. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`.
3. Set `STRIPE_WEBHOOK_SECRET` (signing secret of that endpoint), live `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in the host's environment; keep test and live secrets separate.
4. `UPSTASH_REDIS_REST_URL`/`_TOKEN` are required in production (rate limiting and now the email claim).
5. Mailtrap: live-API token with the `kubikart.de` sending domain verified, all `MAILTRAP_TEMPLATE_*` UUIDs set; after the first live order check the email log shows `delivered`, and open one mail to check the template and legal PDFs.
6. Replay one test event from the Dashboard after deployment and confirm one status change and one email.

### Notes for the integrating developer

- `components/checkout/CheckoutPayment.tsx` (not edited): when `confirmPayment` returns a non-`succeeded` status without an error (e.g. `processing`), the form silently stops loading; surface that state.
- The success page reuses existing keys (`paymentSuccessTitle`, `paymentFailed`, `processing`, `orderPlacedDesc`, `checkout`). Dedicated "payment pending" / "payment not completed" copy should be added to `messages/*.json`.
- During testing the Business Kit's server-side price changed between orders (149 → 153 → 188 → 190 EUR for the same cart) while the cart line still displayed 149 €; this is outside the payment code (concurrent kit/price work) but the buyer-visible subtotal/line mismatch should be checked before launch.
- Test records left in Stripe test mode: succeeded PaymentIntents cannot be deleted through the API (remove via "delete test data" if desired). The WooCommerce orders, enquiry and uploaded files created for this verification were deleted.

## 3. Sandbox commerce test matrix

Automated rows use mocks/fixtures and do not prove provider connectivity. A local Stripe sandbox payment was executed on 2026-08-04, but the provider-to-webhook portion remains untested until evidence from a publicly reachable staging deployment is attached.

| Test case | Prerequisites | Exact action | Expected WooCommerce status | Expected email | Expected logs | Result | Evidence | Remaining issue |
|---|---|---|---|---|---|---|---|---|
| Stripe successful payment | Staging, Stripe sandbox keys/webhook, pending order | Complete a sandbox card payment | `processing`, paid once | One Mailtrap processing email | Verified `payment_intent.succeeded`; no secret/body dump | Partial: provider payment succeeded; webhook not run | 2026-08-04: Woo order `388`, Stripe test PaymentIntent `pi_3U0hYsA4DWQ0hkfE0yrcTyMP`, €80.39 EUR, provider status `succeeded`; Woo remained `pending`, email marker remained `pending` | Deploy current build and register the public webhook with `STRIPE_WEBHOOK_SECRET` before completing this row |
| Stripe webhook replay | Successful Stripe row | Replay same event from Stripe CLI/dashboard | unchanged `processing` | No duplicate after `sent` marker | Accepted replay/payment no-op | Not run | — | Observe concurrency |
| Stripe invalid signature | Public staging route | POST fixture with invalid signature | unchanged | None | Signature rejection only | Not run | — | Automated mock passes |
| Stripe wrong amount | Signed controlled fixture/provider test setup | Deliver succeeded event whose amount differs from order | unchanged `pending` | None | Generic processing failure; mismatch retained server-side | Not run | — | Automated gate passes |
| Stripe wrong currency | Signed controlled fixture/provider test setup | Deliver succeeded event with different currency | unchanged `pending` | None | Generic processing failure | Not run | — | Automated gate passes |
| Stripe failed payment | Stripe sandbox failure payment method | Complete failing payment | `failed` | WooCommerce failed-order email according to its settings | Verified `payment_intent.payment_failed` | Not run | — | Confirm desired customer copy |
| Stripe customer cancellation | Pending Stripe checkout | Cancel/abandon payment | remains `pending` | None | No handled cancellation event | Not run | — | Manual expiry/cancellation policy required |
| Stripe full refund | Paid sandbox order | Refund full charge in Stripe | `refunded` | WooCommerce refund email according to its settings | Verified `charge.refunded` | Not run | — | Confirm Woo totals |
| Stripe partial refund | Paid sandbox order | Refund part of charge | unchanged automatically | None from webhook | Event accepted, no full-refund transition | Not run | — | Reconcile manually in WooCommerce |
| Stripe dispute | Sandbox dispute fixture | Trigger `charge.dispute.created` | `on-hold` | Status email if current handler sends one | Internal dispute note | Not run | — | Resolution events manual |
| PayPal successful capture | PayPal sandbox buyer/seller and webhook | Approve and capture checkout | `processing`, paid once | One Mailtrap processing email | Verified capture/webhook | Not run | — | Requires staging/provider access |
| PayPal webhook replay | Successful PayPal row | Resend same event | unchanged `processing` | No duplicate after `sent` marker | Accepted replay/payment no-op | Not run | — | Observe concurrency |
| PayPal invalid verification | Public staging route | Send invalid transmission headers | unchanged | None | Verification rejection | Not run | — | Automated missing-ID gate passes |
| PayPal wrong amount/currency | Signed controlled fixture | Deliver mismatched completed capture | unchanged `pending` | None | Payment mismatch | Not run | — | Automated shared transition gate passes |
| PayPal denied/declined | PayPal sandbox failure scenario | Trigger denied/declined capture | `failed` | WooCommerce failed-order email according to its settings | Verified denied/declined event | Not run | — | Provider scenario availability |
| PayPal customer cancellation | Approve screen | Cancel/abandon PayPal checkout | remains `pending` | None | No handled event | Not run | — | Manual expiry/cancellation policy required |
| PayPal full refund | Paid sandbox order | Refund full stored total | `refunded` | WooCommerce refund email according to its settings | Full amount/currency match | Not run | — | Confirm transaction lookup |
| PayPal partial refund | Paid sandbox order | Refund less than order total | unchanged automatically | None | Internal manual-reconciliation note | Not run | — | Allocate refund manually in WooCommerce |
| PayPal dispute | Sandbox dispute fixture | Trigger `CUSTOMER.DISPUTE.CREATED` | `on-hold` | Status email if current handler sends one | Internal dispute note | Not run | — | Resolution events manual |
| Mailtrap German | German paid staging order | Complete payment with locale `de` | `processing` | German processing template, correct customer/total | Submission success | Not run | — | Inspect inbox/rendering |
| Mailtrap English | English paid staging order | Complete payment with locale `en` | `processing` | English processing template, correct customer/total | Submission success | Not run | — | Inspect inbox/rendering |
| Mailtrap failure retry | Controlled Mailtrap failure or mocked test | Fail first send, replay verified event | stays `processing` | Second attempt sends once | `failed` then `sent` metadata | Mocked pass | `order-status-email.test.ts` | Real provider failure not run |
| Woo/Mailtrap duplication | Frontend-created staging order | Complete payment and inspect both mail systems | `processing` | Exactly one customer payment email | Woo suppression for marked order | Not run | — | Must deploy WordPress plugin change |
| Legal attachments | Configured staging Mailtrap | Send applicable order confirmation/status template | unchanged | PDFs readable | No attachment error | Files verified locally | `public/legal/agb.pdf`, `widerruf.pdf` | Inspect received email |
| Unknown order | Signed controlled fixture | Use nonexistent WooCommerce order ID | no order | None | Webhook returns retryable processing failure without secrets | Not run | — | Automated WC failure fixture recommended |

### Automated evidence currently available

- Server-authoritative order totals and payment creation fixtures.
- Duplicate WooCommerce payment transition tests.
- Amount mismatch transition test.
- Stripe invalid-signature and email-gating tests.
- Missing Stripe/PayPal webhook verification configuration tests.
- Durable paid-email success, failure, retry, and already-sent replay tests.
- DHL missing, incorrect, and correct authorization tests with mocked downstream services.
- Signed revalidation tests.
- Production Redis fail-closed test.

### Manual viewport matrix

For each width (360, 768, 1024, 1440 px), check German and English homepage, shop, product, populated cart, checkout, payment success/failure, account, and orders. Additionally test populated `/cart` at 320 px. Record screenshots, console errors, network failures, horizontal overflow, keyboard focus, and long German text. No row is considered passed without retained evidence.

Local automated-browser measurement: populated German `/de/cart` at 320 px passed with 0 px document overflow. This does not replace the remaining staging viewport matrix.

## 4. Customer file uploads (private storage)

Uploads can also belong to an **enquiry** (an enquiry-only product page with its own fields): the storefront records the
tokens in the enquiry's `_kubikart_enquiry_files` meta and the plugin keeps them for that enquiry
(`kubikart_cf_attach_enquiry`, same storage, same authorised download, never taking a file that belongs to an order or
another enquiry). See [products](07-products-and-bundles.md#enquiry-with-choices-and-files).

**Local (done and verified).** In the Lando environment `wp-config.php`
defines `KUBIKART_CUSTOMER_FILES_DIR` as `backend/storage/customer-files`,
outside the web root and git-ignored. Verified: an upload is stored only there;
the same token under `/wp-content/uploads/…` and `/storage/…` returns 404; an
authorised administrator downloads it from the order screen
(`Content-Disposition: attachment`, `nosniff`, `private, no-store`) while an
anonymous request is refused; customers and e-mails never see the token or any
filesystem path.

**Application support for production (implemented).** The plugin does not
depend on Lando: the private directory comes from the constant
`KUBIKART_CUSTOMER_FILES_DIR` **or** the environment variable of the same
name. Without either, production (`wp_get_environment_type() === 'production'`)
**refuses uploads** instead of falling back to the public uploads folder
(local/staging environments may still use the legacy path). A legacy public
directory, if one ever existed, is re-protected with deny-all guard files on
every request.

**Production steps (not done here):** see
`backend/deploy/nginx-customer-files.conf.example` and
[11-revalidation](10-revalidation.md) for the matching environment checklist.

1. Create a persistent directory outside the document root, owned by the PHP
   user, mode `0750` (files `0640`), included in backups, and set
   `KUBIKART_CUSTOMER_FILES_DIR` to its absolute path.
2. Deny the legacy public path in the web server (Nginx snippet in the example
   file; Apache is covered by the generated `.htaccess`).
3. Repeat the verification on the real host: upload a test file, request its
   direct URL (must be 404/403), download as a logged-in shop manager (must
   work), then delete the test order and file.
4. Set the server limits listed below.

#### Request boundaries and the 4 MiB limit

The repository does not establish where the Next.js frontend will run (the only
mention is a pending "Vercel + managed WordPress" item in the project notes; the
WordPress deployment scripts target Strato). The limit therefore has to work
through every plausible boundary. An upload travels:

| Boundary | Limit / behaviour | Requirement |
|---|---|---|
| Browser | checks size and type before sending | 4 MiB, PNG/JPEG/WebP/PDF |
| Frontend host / platform body limit | some platforms reject request bodies above about 4.5 MB (for example Vercel functions); Next.js `proxy.ts` buffers up to 10 MB by default | stay below 4.5 MB including multipart overhead |
| Next.js route | rejects `Content-Length` above 4 MiB + 64 KiB, re-validates size and detects the type from the content | none |
| Server-to-server call to WordPress | the multipart body is re-encoded (≈ 1 KiB overhead) | web server `client_max_body_size` ≥ 6 MB |
| PHP | `upload_max_filesize` and `post_max_size` | ≥ 5 MB and ≥ 6 MB |
| Plugin | re-validates size, type by content, stores privately | 4 MiB constant |

The limit was therefore set to **4 MiB** (browser, route, plugin, messages and
tests agree), which fits under a 4.5 MB platform limit with overhead. A 10 MiB
limit is only safe if the final hosting has no such body limit **and** WordPress
accepts it; changing it needs the three constants (`customer-file-limits.ts`,
`KUBIKART_CUSTOMER_FILE_MAX_BYTES`, message texts) and the server settings
above together. Larger print-ready PDFs can be sent by e-mail after ordering
(stated in the field help). No public file storage or direct-to-WordPress
browser upload was introduced as a workaround.

#### Rate limiting

The upload route is limited to 10 uploads per 10 minutes per client by the
shared limiter (`proxy.ts`; Upstash Redis is mandatory in production, a
process-local fallback is used only in development). The client address is
taken from `X-Forwarded-For` **only** when `TRUSTED_PROXY_HOPS` is set to the
number of trusted proxies in front of the app (read from the right of the
list, so a client cannot forge it); otherwise all requests share one bucket. An
exceeded limit returns HTTP 429 with `Retry-After`, `code: "rate_limited"` and
a German/English message that is shown in the product form.

#### Privacy

The privacy page now contains a section "Hochgeladene Dateien (Logos,
Speisekarten, Entwürfe)" (German, with an English courtesy translation on the
English route). It states purpose (contract performance), storage in a
non-public area, access by logged-in shop managers only, that e-mails show only
the file name, automatic deletion of **unattached** files after 7 days, and that
**files attached to orders are kept with the order with no automatic deletion**
until deleted on request. Not stated, because not established: any retention
period, hosting provider or country, processors, or legal review. Facts the
owner must confirm: the actual hosting/processor details for the Hosting and
Zahlungsanbieter sections (already placeholders in the existing policy), whether
a retention period for order files should be introduced, and the legal review
of the whole text.
