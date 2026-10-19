# Live website functional and security review

Date: 19 October 2026. Targets: `https://kubikart.de` and its STRATO WordPress/WooCommerce backend. Source baseline: commit `2383aec`; unrelated concurrent workspace changes were preserved.

## 1. Scope and conclusion

Real Chromium browsing, live API requests, read-only backend/provider verification, and owner-assisted CAPTCHA-protected submissions were used. This was not a unit-test-only review and is not a penetration-test certification.

**The website is not ready for an unconditional “all features work” sign-off.** Basic cart operations, many configurations, account emails and the tested access controls work. The owner subsequently passed the live business-card upload/cart retest. The final owner-assisted checkout exposed a critical payment handoff failure: two Stripe sandbox payments succeeded, but both WooCommerce orders remain pending. The PayPal Express contract bug and checkout/shipping issues also remain. No fixes or deployments were performed during this review.

The owner originally chose to place a small real order later, then independently completed two sandbox payments during the requested no-charge checkout check. The agent did not initiate payment, capture, refund, shipment, genuine withdrawal or an order-status transition. Read-only Stripe inspection confirms both payments have `livemode:false`; these were not real-money charges. No test payment card numbers were submitted by the agent.

## 2. Prioritized findings

### Critical — C1: deployed Stripe checkout uses test mode; successful sandbox payments do not update WooCommerce

The deployed `/en/checkout` JavaScript contains a `pk_test_` publishable key matching the local test configuration. This is evidence from the deployed bundle, not an assumption that local and Vercel environments match. A read-only Stripe search restricted to metadata `wc_order_id` for the owner's QA orders returned:

| QA order | Stripe sandbox result | WooCommerce result |
| --- | --- | --- |
| 1510 | `succeeded`, `livemode:false`, €72.99 received | `pending`, no paid date or transaction ID |
| 1511 | `succeeded`, `livemode:false`, €8.49 received | `pending`, no paid date or transaction ID |

Amounts/currencies match the WooCommerce orders. Both paid-order email states remain pending, without an attempted/sent timestamp. The break is between successful provider payment and WooCommerce reconciliation, before the paid-email step; do not diagnose this as Mailtrap rejecting a paid email.

The Stripe sandbox webhook-endpoint API returned no endpoint matching the Kubikart frontend/backend hosts. This points to missing/misdirected sandbox delivery configuration, but the Vercel environment, newer event-destination dashboard settings and individual delivery logs were not available to establish the exact cause or signing-secret match. Do not claim that signature verification itself has failed without a delivery response.

Relevant files: `frontend/src/components/checkout/CheckoutPayment.tsx:9`, `frontend/src/app/api/stripe/create-payment-intent/route.ts`, `frontend/src/app/api/webhooks/stripe/route.ts:36`, `frontend/src/lib/payment-transition.ts`, `frontend/src/lib/order-status-email.ts`.

Next verification: inspect Stripe Workbench's sandbox deliveries to `https://kubikart.de/api/webhooks/stripe`; confirm the appropriate `payment_intent.succeeded` subscription, enabled destination and matching endpoint signing secret. With approval, repair configuration and reconcile/retry only these known test events, checking one paid transition and one email. Do not switch to live or fulfil these sandbox orders as a workaround. For eventual production activation, scope matching live publishable/secret keys and the live endpoint's separate signing secret to Vercel Production, then rebuild/redeploy and perform an owner-controlled real payment. Stripe documents isolated modes and endpoint-specific secrets in its [API-key guidance](https://docs.stripe.com/keys).

### H0 — owner-assisted retest passed: previous business-card artwork blocker

Owner-assisted production test: the English business-card page displayed `Uploaded: Screenshot-from-2026-10-16-10-16-57.png` and a Remove control, but Add to Cart remained disabled. The owner separately confirmed the same flow works locally. This is a failed live flow, not a pass inferred from local tests.

Investigation:

- All ten English variations are published, priced, purchasable and in stock in the live WooCommerce API.
- A clearly labelled 68-byte PNG uploaded through the authenticated backend integration returned HTTP 201 in 271 ms. A real live pricing quote accepted that stored artwork for variation 865: subtotal €35, total €37.99. Anonymous access to the same file metadata returned 401.
- STRATO reports a production environment and an existing, writable private upload directory outside the WordPress root.
- A live React-prop snapshot showed `uploading: {}`, product in stock, ten variations, **no matched variation**, and `canAttemptAddToCart: false`. Another fresh request matched variation 865 and enabled the attempt button. This is useful evidence of inconsistent client/variation state, but does not establish the exact cause of the owner's post-upload failure.
- The served JavaScript contains `canAttemptAddToCart`; the problem cannot simply be declared an absent frontend fix. Parent and variation data are fetched separately with caching; client selections are initialized in component state. These boundaries need investigation in the actual failing session.

Files: `frontend/src/components/product/ProductPageClient.tsx` (initial selections, selected variation, lines around 690–765, upload handler around 787, button around 432); `frontend/src/lib/product-page.ts` (parent/default/variation mapping); `frontend/src/lib/option-ids.ts`; `frontend/src/lib/woocommerce.ts`.

Current status: the owner retested uploading, adding to cart and removing successfully in both the private window and their normal browser after a hard refresh. This is an owner-assisted live pass, not a deployed code fix. The precise cause of the earlier session failure was not established. Full artwork-upload testing across every paper/quantity combination was not performed. Do not remove required artwork validation or substitute local success for production evidence.

#### Follow-up: consent choice and browser-specific console errors

The owner subsequently reported that the artwork flow worked in a private window but failed in their existing browser session after choosing essential-only consent. This is a browser/session correlation, not yet proof that the preference causes the failure. The uploaded-filename state was visible in the affected session.

A controlled live comparison in two fresh Chromium contexts used the actual essential-only and accept-all buttons, then completed the same business-card layout configuration. **Both choices enabled Add to Cart and added product 538 / variation 865 / €35 to the temporary browser cart, without JavaScript exceptions.** This comparison does not retest the CAPTCHA-protected artwork upload. `CookieBanner.tsx` only gates Vercel Analytics; product/cart/CAPTCHA code does not read the consent choice. Essential commerce must not be made conditional on optional analytics consent.

The supplied PayPal console line is an `ERR_BLOCKED_BY_CLIENT` failure at `/xoplatform/logger/api/logger`, a logging endpoint; it does not demonstrate payment-creation/capture failure. A browser extension/privacy filter is a possible explanation, not an established diagnosis. The supplied Cloudflare `data:,` CSP warning originates within the challenge iframe and names a policy different from the site's report-only CSP. Do not weaken the site's CSP or require accept-all on that evidence. Cloudflare documents browser-extension interference as a possible challenge issue: [challenge troubleshooting](https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/challenge-solve-issues/).

The owner then reported successful live upload/add/remove tests in both browser contexts after refreshing. No mandatory accept-all requirement was demonstrated, and no CSP/consent weakening was applied. If the symptom recurs, capture the affected session's selections/network state before clearing data; do not clear a real customer cart without warning.

### High — H1: product-page PayPal Buy Now sends the wrong order-reference field

`PayPalExpressButton.tsx:33` saves `{ id, orderKey }` and line 37 sends it unchanged to `/api/paypal/create-order`. `payment-order.ts:20` requires `orderId`. Normal checkout correctly sends `{ orderId, orderKey }`.

A harmless live request with the Express shape and a fake reference returned **400 `Missing pending order reference`**, before any order lookup/provider operation. No order was created for this check. The full CAPTCHA-protected Express sequence was not completed, but its contract mismatch is confirmed.

Fix direction: explicitly map `id` to `orderId`; invalidate/recreate the cached pending reference when configuration or quantity changes; test cancellation/retry without charging. Files: `frontend/src/components/checkout/PayPalExpressButton.tsx`, `frontend/src/lib/payment-order.ts`, `frontend/src/app/api/paypal/create-order/route.ts`.

### High — H2: payment-step navigation bypasses required order initialization

Reproduced in both languages: fill the contact/address fields, then click the Payment/Zahlung step in the top navigation rather than Continue to payment. The UI shows **“Checking prices and shipping…” / “Preise und Versand werden geprüft…”** indefinitely because no pending order was created. The browser recorded zero order-creation attempts in this path.

`frontend/src/app/[locale]/checkout/page.tsx:225` directly calls `setStep`, while actual initialization is in `continueToPayment` around line 160 and the payment component requires `pendingOrder` around line 499.

Fix direction: gate navigation on a valid initialized order, or use the same initialization path. Verify forward/back navigation and edits to address/cart after initialization. Never display an endless loading message for an impossible state.

### High — H3: Germany-only selling is not enforced by headless checkout

Both checkout languages offer DE, AT, CH, NL, FR and BE. Live quotes for AT and CH returned HTTP 200 and €8.99 international shipping. Even the invalid country `ZZ` received the same rate.

WooCommerce admin restrictions alone are not consulted by this custom quote path. `frontend/src/lib/shipping.ts:97` treats every non-DE string as international; `frontend/src/lib/server-cart.ts:230` forwards it. Checkout's country list is at `frontend/src/app/[locale]/checkout/page.tsx:278`; order creation passes the selected country through at `frontend/src/app/api/orders/create/route.ts:48`.

Fix direction: enforce the owner-approved destination allowlist in shared server validation, checkout and Express address handling. Test DE succeeds and AT/CH/invalid codes fail clearly. No non-German order was created during testing.

### High — H4: apartment/address-line-two information is discarded

Checkout accepts an `apartment` value (`checkout/page.tsx:320`), but the order body at lines 173–179 sends only `address_1`; there is no billing or shipping `address_2`. A customer can enter delivery-critical information that never reaches the order.

Evidence is the real UI field and source payload contract; a production order was deliberately not created to demonstrate data loss.

Fix direction: persist and display address line two in order creation, summaries, payment address handling and transactional mail. Verify with a labelled test order in staging, then the owner's eventual live order.

### Medium — M1: contact/address validation checks only nonempty values

Reproduced DE/EN: `not-an-email` has browser validity false, yet Continue to shipping is enabled; postcode `invalid` is also accepted by the UI. The button at `checkout/page.tsx:365` does not submit a validating form. The order route checks email presence, not complete address validity; WooCommerce might reject malformed email later, which was not tested by creating a bad order.

Fix direction: shared client/server validation, useful localized errors and deliberate postcode rules. Keep PayPal Express's deferred address collection explicit rather than exempting all validation.

### Medium — M2: newsletter advertises a coupon without a storefront redemption flow

The footer promises 10% off and `frontend/src/app/api/newsletter/confirm/route.ts:38` creates a WooCommerce coupon. No coupon entry was present in the tested cart/checkout, and `cart-contract.ts`, `server-cart.ts` and order creation do not accept/apply coupon codes. A coupon existing in WooCommerce does not discount a headless order automatically.

Fix direction: implement server-validated redemption, restrictions and totals before advertising this as a working customer benefit. Follow-up testing confirmed newsletter double opt-in, welcome delivery and coupon creation (see section 7), but the generated coupon still has no storefront redemption flow.

### Medium — M3: session checks share the restrictive authentication rate policy

`/api/auth/session` returned HTTP 429 during the multi-page browser tests, including five occurrences in the 46-page catalogue pass. The policy at `frontend/src/lib/rate-limit.ts:19` gives every `/api/auth/*` path ten requests/minute. Session checks occur on full page loads.

Multiple QA contexts contributed traffic from one IP; this is not proof that every normal customer will hit the limit. Nevertheless, frequent browsing/shared IPs can be affected. Separate inexpensive session reads from login/register/reset protections and verify refresh/multiple tabs without weakening brute-force controls.

### Medium — M4: oversized carts still receive a single-parcel shipping quote

A read-only quote for 100 of product 1361 returned HTTP 200, a package of **35 kg / 26 × 19 × 400 cm**, and one free DHL Paket rate. This exceeds the application's own configured single-parcel limits. `shipping.ts` falls back to Paket even when no package type fits; `server-cart.ts` models quantity by stacking all item heights.

Fix direction: a deliberate multi-parcel model or a clear quotation-required limit. Do not silently issue a normal one-parcel rate for an impossible package. No bulk order was placed.

### Medium — M5: localization and customer-facing copy remain inconsistent

Observed English cart: **“Shipping + Tax wird an der Kasse berechnet.”** Both locales mix formatted currency with hard-coded `€35.00` / `€2.99`. English checkout legal link labels remain German. The tax-calculation wording is also inconsistent with the checkout's §19 no-VAT notice; owner/legal review should decide wording, not an unapproved legal edit.

Files: `frontend/src/app/[locale]/cart/page.tsx:132`, checkout summaries/legal-link labels, messages DE/EN. Stripe return URLs in `CheckoutPayment.tsx:36` and the product Express success redirect also omit the locale; preserve `/en` in a controlled payment-return test.

### Hardening / unverified payment behavior

- Live security headers include HSTS, nosniff, SAMEORIGIN, private-route noindex/no-referrer and no-store. The CSP is report-only in source, not an enforced production CSP; treat enforcement as a separately tested hardening task, especially with Stripe/PayPal/Turnstile.
- `CheckoutPayment.tsx:46` has no explicit customer outcome for a non-error Stripe `processing` result; real asynchronous/Klarna behavior was not executed. Validate in sandbox before claiming it works.
- Owner-assisted sandbox payment completion is now verified at Stripe, but the WooCommerce paid transition/email chain failed (C1). Valid webhook acceptance, replay, refund, dispute and real-money payment remain unverified. Rejection of unsigned requests proves only the negative boundary.

### Medium — M6: newsletter unsubscribe flow not implemented/verified

The actual English test welcome email has neither a `List-Unsubscribe` header nor unsubscribe text/link. No unsubscribe route or subscriber self-service control was found in `frontend/src` or the Kubikart backend plugins. `frontend/src/lib/email.ts:387` sends the coupon welcome text without such a control. The separate provider/campaign dashboard configuration was not inspected, so this is not a claim about every future campaign sent by another system or a legal compliance determination.

Define and test the complete subscribe → confirm → unsubscribe/suppression workflow before treating the mailing-list lifecycle as complete. Do not change legal wording as an incidental test fix.

### Medium — M7: account order-history failures are presented as no orders

Source inspection at `frontend/src/app/[locale]/account/orders/page.tsx:33` shows that non-2xx JSON is not checked and network failures are converted to an empty array. The UI then displays the no-orders state, which can mislead a customer during an outage or expired session. No production outage was induced. Add a distinct localized error/retry/session-expired state and verify it in an isolated fault-injection test; do not represent this source finding as a live data-leak observation.

### Medium — M8: customer enquiry acknowledgements omit the enquiry summary

The owner received only generic bilingual thanks for the English custom-size request and generic thanks for the German bundle request; the browser correctly displayed the bundle and reference `ANF-261019-SBYNVE`. Backend storage and owner notifications contain the enquiry context, so delivery success is not equivalent to an adequate customer receipt.

`frontend/src/lib/email.ts:319` passes only name, type, message and locale to the contact template, without the enquiry reference or structured product/customer details. `frontend/scripts/create-mailtrap-templates.mjs:143` defines the template as a generic bilingual thank-you and does not render even the supplied message. `frontend/src/app/api/contact/route.ts:233` already has the complete persisted `EnquiryRecord` but sends only `sanitizedData` to this acknowledgement helper.

Implement a localized customer receipt from the persisted record: reference, product/bundle and link where applicable, requested dimensions/configuration, submitted contact details and message. Escape customer content; never expose private upload tokens, storage paths or unrelated data. Verify both actual customer emails after deployment. No remote templates or application code were changed during this review.

## 3. Verified results and coverage

| Feature/boundary | Result and evidence |
| --- | --- |
| Published catalogue | 46 localized pages (23 DE/EN pairs), all HTTP 200, no JavaScript exceptions in that pass |
| Responsive product routes | 184 width checks: 360/768/1024/1440 px, no document-level horizontal overflow |
| Product configurations | 24 default/no-file configurations added in the catalogue pass; 10 file-required configurations correctly not added without files; 12 enquiry pages have no purchase button |
| Business-card layout design | Added in both languages without mandatory logo upload; switching to artwork hides business-information fields and requires artwork |
| Business-card artwork | Initial owner-reproduced failure; subsequent owner-assisted live upload → add → remove passed in normal and private browsers after refresh. No code fix or cookie-causality claim |
| Cart | DE/EN add, configuration summaries, increment/decrement, reload persistence and removal passed |
| Checkout shipping | €35 business-card layout → €2.99 shipping → €37.99 total; all four tested widths fit |
| Product tabs/media | DE/EN acrylic stand details show SKU, estimated shipping dimensions and weight; shipping tab has content; zoom opens and Escape closes |
| Navigation/search | DE/EN mobile menu opens/closes with Escape, has 13 visible links and no overflow; `q=QR` search renders nine results |
| Enquiry UI | EN opening-hours/window-logo/menu custom-size selection replaces buying with an enquiry form and size inputs; DE opening-hours/menu equivalents passed. DE/EN barber bundle forms open with privacy checkbox, no purchase button. Frosted-film custom-size dropdowns also exercised |
| Withdrawal | DE/EN details → review screens passed; declaration deliberately not submitted |
| Server commercial validation | Altered client price ignored; zero/negative quantities, mismatched/missing variants, absent required QR fields and invalid QR URL rejected; valid QR configuration priced correctly |
| Enquiry purchase exclusion | Attempt to quote an enquiry-only bundle returned 409 `enquiry_only` |
| Shipping prices | Small parcel €2.99; tested small/large/lid jar variations €5.49; domestic free shipping at configured €90 threshold |
| Account (owner-assisted) | Customer role created for marketing test account; owner confirmed creation/reset success and mailbox receipt. New-login event also evidenced by delivered alert |
| Contact (owner-assisted) | German test enquiry stored privately once, reference `ANF-261019-XWK872`; owner notification recorded accepted, one attempt |
| Mailtrap delivery | Welcome, contact acknowledgement, login alert, password-reset email to marketing test address: delivered. Exact owner notification to info@kubikart.de: delivered |
| Email links | Test reset mail links to `https://kubikart.de/de/account/reset-password`; inspected test emails contain no localhost/Lando links or backend password-reset link. Reset tokens were never saved/reported |
| Upload privacy/config | Private directory verified outside WP root; authenticated QA upload 201; anonymous metadata read for that same token 401 |

### Negative security checks

Low-volume requests to known endpoints only; no brute force, stress test, broad scanning or destructive payloads.

- Anonymous frontend orders: 401; anonymous session: 200 with no authenticated session.
- Contact/newsletter/register/reset/order/upload without CAPTCHA: 403 `captcha_invalid`.
- A forged `x-kubikart-captcha-verified` header did not bypass verification: 403.
- Cross-origin logout: 403.
- Unsigned Stripe webhook: 400; unsigned PayPal webhook: 401.
- Unsigned revalidation/enquiry retry and unauthorized shipping-label request: 401.
- Missing payment-order references: rejected before payment creation; empty PayPal capture request: 400.
- Anonymous backend orders, password integration, mail configuration and customer-file metadata: 401.
- Account/cart/checkout response headers were private/no-store, noindex and no-referrer in the checked routes.

These results do not establish cross-account isolation with two live authenticated sessions, provider signature acceptance, resistance to every attack, or security of every installed WordPress plugin.

## 4. Files changed, preservation and legacy styles

Only this new report was added by the review. Application code, products, variations, pricing, payment configuration, environment files, legal copy, analytics plan and deployment configuration were not edited. Existing unrelated changes/deletions in the worktree were left untouched. No styling changes were made; existing legacy styles remain.

Live records left intentionally:

- Owner-created marketing test account and three private test enquiries: general German contact, English custom-size request and German bundle request.
- Two unassigned harmless diagnostic uploads: `KUBIKART-QA-IGNORE-UPLOAD-DIAGNOSTIC.png` and `KUBIKART-QA-IGNORE-REMAINING.png`. They were not attached to an order. The plugin's configured pending-file cleanup policy applies. The owner's own uploads were not deleted. Rejected test files were not stored.
- Owner-submitted English newsletter test subscription; following its real test confirmation link created the normal restricted welcome coupon. The test account is now subscribed; the record/coupon were left for owner review, not deleted.
- Two owner-created QA orders, 1510 and 1511, remain pending in WooCommerce despite successful Stripe sandbox payments. Order 1510 contains the owner's business-card artwork association and configuration. Do not fulfil them or automatically cancel/delete/replay events without owner approval. No agent-created production orders, payments or shipments.

No data was deleted. No local server was started or restarted.

## 5. Commands and evidence

Browser/diagnostic scripts were written under `/tmp`, not installed into the app:

```sh
node /tmp/kubikart-live-review.cjs
node /tmp/kubikart-live-flows.cjs
QA_COMMERCE_ONLY=1 node /tmp/kubikart-live-flows.cjs
node /tmp/kubikart-live-catalog.cjs
QA_REQUESTS_ONLY=1 node /tmp/kubikart-live-interactions.cjs
node /tmp/kubikart-live-utility.cjs
node /tmp/kubikart-live-card-variants.cjs
node /tmp/kubikart-live-button-diagnostic.cjs
node /tmp/kubikart-live-consent-commerce.cjs
node --use-system-ca /tmp/kubikart-live-security.mjs
node --use-system-ca /tmp/kubikart-live-baseline.mjs
node --use-system-ca /tmp/kubikart-live-quote.mjs
node --use-system-ca /tmp/kubikart-live-owner-records.mjs
node --use-system-ca /tmp/kubikart-live-mail.mjs
node --use-system-ca /tmp/kubikart-live-mail-links.mjs
node --use-system-ca /tmp/kubikart-live-upload-diagnostic.mjs
node /tmp/kubikart-live-remaining-ui.cjs
node --use-system-ca /tmp/kubikart-live-remaining-quotes.mjs
node --use-system-ca /tmp/kubikart-live-remaining-records.mjs
node --use-system-ca /tmp/kubikart-live-newsletter-complete.mjs
node --use-system-ca /tmp/kubikart-live-newsletter-unsubscribe-check.mjs
node --use-system-ca /tmp/kubikart-live-qa-order.mjs
node --use-system-ca /tmp/kubikart-live-stripe-mode.mjs
node --use-system-ca /tmp/kubikart-live-stripe-endpoints.mjs
git diff --check
```

Evidence: `/tmp/kubikart-live-review/` contains sanitized JSON, screenshots and the published catalogue snapshot. No customer passwords, reset tokens, API credentials or raw email bodies were saved in the report/evidence. One targeted read-only SSH/WP-CLI check returned upload-directory/configuration booleans without exposing paths/secrets or reading customer file contents.

Diagnostic limitations/failures were accounted for: an initial Node diagnostic used `response.status()` instead of `response.status` and was corrected. An early browser harness did not close the expected cart drawer; this was corrected using Escape. Product tab selectors initially used button rather than their actual `tab` role; final checks used proper roles and interaction readiness. One DE window-logo branch lookup assumed adjacent product IDs; actual translations are not always adjacent, so that individual branch was not marked passed. CAPTCHA-protected automation stopped at the human checkbox; no CAPTCHA bypass/test keys were used. These tooling issues were not reported as site defects.

Lint, type-check, unit tests and production build were not rerun: this is a live review with no application-code changes, and those commands would not prove live delivery/checkout behavior. Browser, API, backend-record and provider evidence above are the relevant checks.

## 6. Known limitations and next phase

Not all combinations of every variation/add-on, every file type/size, stock races, failed provider payments, coupon redemption/unsubscribe, authenticated order-history sessions or successful withdrawal receipts were executed. Newsletter double opt-in and English custom-size enquiry mail were completed in the follow-up. Do not equate route coverage with exhaustive feature coverage. No Vercel dashboard logs or complete production payment-provider dashboard configuration were available for certification. Local `.env.local` contains Stripe test-mode credentials and defaults PayPal to sandbox; these alone were not used to assert deployed settings. Deployed Stripe test mode was separately verified from public JavaScript and the two QA PaymentIntents. No Vercel configuration was changed.

Recommended next phase: first repair and verify the Stripe payment-to-order/webhook handoff in sandbox, then approve a consistent live-mode configuration. Repair the PayPal reference contract and checkout state/validation, enforce Germany-only destinations, preserve address line two and implement coupon redemption/unsubscribe and complete localized enquiry receipts. Review large-cart shipping, session-read limits, order-history error handling and localization afterward. Monitor the business-card session symptom rather than declaring an unproven cause or removing validation. Keep free analytics.

Only after those fixes, arrange owner-controlled live payment tests: one small Stripe order and one PayPal order separately. For each, verify a single charge/capture, correct WooCommerce customer/configuration/address/shipping/total and paid status/transaction ID, one customer confirmation and the appropriate owner notification in Mailtrap, cart clearing and account order visibility. A passed Stripe order does not validate PayPal. Do not replay events, refund payments or trigger fulfilment without explicit owner direction.

## 7. Follow-up workflow completion

### Positive and negative live checks completed

- **EN custom-size enquiry:** private post 1505, reference `ANF-261019-CXUCSC`, correct English product context (`opening-hours-window-decal`, product 540) and custom-size information. Owner notification accepted once and delivered to info@kubikart.de; customer acknowledgement delivered to marketing@kubikart.de.
- **DE bundle enquiry:** private post 1508, reference `ANF-261019-SBYNVE`, German product 1468 / `barber-salon-kit-de`, enquiry-only mode. Owner notification accepted once and delivered; customer acknowledgement delivered.
- **EN newsletter:** owner submitted record 1504; confirmation email delivered. The test followed the actual email's link, validating its host/path, subscriber ID and token against the approved test record without saving the token. Invalid token → 403; valid confirmation → English 200/no-store/no-referrer; replay → already-confirmed 200, no second welcome message.
- **Newsletter state/coupon:** private record becomes confirmed, email state accepted; welcome email subsequently delivered. Exactly one matching coupon (ID 1507), 10%, one use/per-user use, restricted to the test email, expiry 17 January 2027. Coupon text/code is not published in this report. Redemption remains blocked by the missing checkout implementation, and unsubscribe controls were not found.
- **Conditional server pricing, DE/EN:** keychain back engraving adds €1; selecting engraving without back text returns 400; hidden back text does not block. Opening-hours custom font requires its specification; installation requires an address and adds the configured €100. Frosted-film extra text requires content and adds €4.99. These were real quotes from live product data, not placed orders.
- **Backend file validation:** labelled PNG accepted (201); empty file rejected (422); harmless plain text named `.png` rejected (422); 4 MB + 1 byte rejected (413). This authenticated integration check does not claim browser CAPTCHA coverage for each rejection case.
- **Remaining enquiry UI, DE/EN:** menu larger-quantity and layout-service choices produce quote forms, no size fields and no purchase button. Window-logo custom-size privacy acknowledgement is enforced before CAPTCHA with localized errors.
- **Stale cart, DE/EN:** a temporary browser-only fixture containing the actual enquiry-only window bundle receives a live availability warning, checkout is disabled, and removal empties the cart. No production commercial data was changed to simulate this.
- **Session tampering:** invalid session cookie returns `user:null` and a clearing cookie with HttpOnly, Secure and SameSite=Lax. Passing `customer=11` to orders with that invalid cookie still returns 401. Private order-history shell remains no-store/noindex. This is not a substitute for a two-authenticated-account isolation test.

### Owner-assisted checkout and payment result

The owner completed checkout and independently submitted sandbox payments. Order 1510 contains two configured business-card packs (€70), €2.99 shipping and one private artwork association; order 1511 contains a configured keychain (€5.50) plus €2.99 shipping. This proves actual artwork/configuration → cart → order persistence, not merely API quote validation. Stripe reports both exact order-bound PaymentIntents as successful test payments, with amounts matching the WooCommerce totals. WooCommerce nevertheless remains pending for both, with no paid timestamp, transaction ID or attempted paid email. This is C1, not an end-to-end payment pass. No real money was charged by these sandbox transactions. PayPal success remains untested.

Read-only Stripe inspection found no matching Kubikart endpoint in the sandbox webhook-endpoint API; the exact dashboard/delivery/signing-secret configuration needs review. The diagnostic initially inherited the account's old default Stripe API version, which rejected PaymentIntent search; explicitly setting a supported version on the read-only request allowed the restricted QA-order search. The account's default API version was not changed.

The owner also confirmed receipt of the generic enquiry acknowledgements and requested complete enquiry summaries. M8 records the missing content; receipt alone does not satisfy that requirement. The newsletter was confirmed by the agent following its legitimate test link, not spontaneously by the application; this was explained to the owner after they asked why a coupon arrived before their own click.

Only this report and temporary diagnostic artifacts were changed by the follow-up. No production code/settings were deployed; unrelated worktree edits were preserved. `git diff --check` passed. Valid webhook reconciliation, paid-order email, live-money payment and fulfilment remain unverified; no event replay, cancellation, refund or fulfilment was performed.

## 8. Owner-authorized local remediation (19 October 2026)

This section supersedes earlier statements of current state where noted; the preceding sections preserve the original audit evidence. These changes are local and have **not** been deployed by the agent.

### Scope implemented

| Finding | Local implementation / remaining boundary |
| --- | --- |
| C1 | Fresh public checkout inspection now finds `pk_live_`, not the earlier `pk_test_`: the owner's key update is deployed. New production-only guards reject test/mixed Stripe modes and signed sandbox webhook events. This does **not** verify the live secret's account or the live webhook signing secret/delivery; that configuration needs owner confirmation and a controlled real-payment check. |
| H1 | Express sends `{orderId, orderKey}`, caches by the actual configuration/quantity request and sends the locale. A changed request cannot reuse an old pending reference. |
| H2 | Payment breadcrumb uses the normal initialization function; an order is required to render payment controls. A changed checkout invalidates the active reference and shows an actionable message instead of an impossible perpetual loading state. |
| H3 | Germany-only UI, shared server-cart destination validation and a PayPal approved-address read before capture. An unsupported PayPal address cannot be charged by this capture route. |
| H4 | Checkout sends address line two for both billing/shipping and displays it in summaries; PayPal address mapping also preserves it. Existing paid-email address construction already includes it. |
| M1 | Shared client/server email, required German address and five-digit postcode checks. Express still deliberately collects its address in PayPal, then checks its destination before capture. |
| M2 | Newsletter coupon field in checkout; fresh WooCommerce validation of subscriber email, expiry, usage, actual percentage and supported restrictions; server-calculated discount; native WooCommerce `coupon_lines` on order creation. Limited deliberately to the shop's newsletter percentage coupons; unsupported coupon types/restrictions fail closed. Actual redemption/payment remains to be verified after deployment. |
| M3 | Session reads have a separate 120/min policy; login/register/reset remain protected by the existing stricter policy and distributed store. |
| M4 | No fabricated Paket fallback for oversized/invalid parcels, including forced shipping classes/free shipping; clear quote-required failure instead. No speculative multi-parcel algorithm added. |
| M5 | Localized payment-return URLs, checkout legal-link labels, remaining cart currency/shipping sentence, checkout shipping loading text, and explicit Stripe-processing messaging. Legal page text is untouched. This is not a claim that every sentence in all account/payment templates was translated. |
| M6 | New welcomes carry an unsubscribe link/header. GET only displays a confirmation screen; token-validated POST persists `unsubscribed`; old confirmation links cannot reactivate that record. This controls the website's subscriber record, not an uninspected external campaign list. Older delivered welcomes cannot be retroactively edited. |
| M7 | Non-2xx/network order-history failures show a localized error, retry and login link rather than “no orders”. |
| M8 | Customer enquiry receipts render the complete persisted record directly, in the chosen language, without depending on the minimal remote template. Reference, product/link/SKU, contact information, request/configuration and notes are included; HTML is escaped and private upload references removed. New English custom-size records use English measurement labels. |

### Files changed

Application files:

- `frontend/src/lib/email.ts`, `checkout-validation.ts` (new), `stripe-config.ts` (new), `cart-coupon.ts` (new), `rate-limit.ts`, `server-cart.ts`, `shipping.ts`.
- `frontend/src/app/api/contact/route.ts`, `newsletter/confirm/route.ts`, `newsletter/unsubscribe/route.ts` (new), `orders/create/route.ts`, `shipping/calculate/route.ts`, `paypal/capture-order/route.ts`, `stripe/create-payment-intent/route.ts`, `webhooks/stripe/route.ts`.
- `frontend/src/components/checkout/PayPalExpressButton.tsx`, `CheckoutPayment.tsx`; `frontend/src/components/product/ProductPageClient.tsx` (locale-prefixed Express return only).
- `frontend/src/app/[locale]/checkout/page.tsx`, `cart/page.tsx`, `account/orders/page.tsx`.

Regression tests: updated `api/orders-create.test.ts`, `payment-webhooks.test.ts`, `shipping-calculate.test.ts`, `newsletter-confirm.test.ts`, `lib/shipping.test.ts`; added `api/newsletter-unsubscribe.test.ts`, `components/paypal-express-contract.test.tsx`, `lib/commerce-review-fixes.test.ts`, `lib/customer-enquiry-receipt.test.ts`. This report was updated; browser/mail diagnostic scripts remain under `/tmp`.

### Existing functionality preserved / legacy styling

WooCommerce remains the source of product identity, variation/add-on pricing, stock, order totals, coupon rules and orders. Existing file handling, CAPTCHA checks, cart persistence, payment verification/idempotency, owner notifications, account sessions, routes, metadata and localization contracts remain. No legal text, credentials, products, backend database, remote templates, paid services or deployment settings were modified. Local/preview Stripe test mode remains available; Vercel Production must use live keys. Existing unrelated homepage/header/docs/fonts/message changes and deleted prior audits were preserved. Legacy styling remains on unmigrated pages; no redesign or global token removal was attempted. The React/Next.js skills informed hook-boundary, stale-state, server-only and error-state checks, not an architecture migration.

### Commands run and results

- `npm test`: **85 files / 527 tests passed**.
- `npm run typecheck`: passed.
- `npm run lint`: passed; no formatting script is configured.
- `npm run build`: passed (optimized Next.js build and static-page generation).
- `git diff --check`: passed.
- Temporarily served the production build with `npm run start -- --hostname 127.0.0.1 --port 3107`; stopped that exact process after checking. Port 3000 was untouched.
- `node /tmp/kubikart-review-fixes-browser.cjs`: actual built DE/EN checkout UI, four widths each, no horizontal overflow or page exceptions. Invalid details block Payment, only Germany is offered, a breadcrumb creates exactly one mocked pending order, address line two and coupon reach its payload. Local CAPTCHA/Stripe SDK and API fixtures prevent any actual provider/payment/order writes. This is an isolated browser contract test, **not** live provider acceptance.
- `node --use-system-ca /tmp/kubikart-fixed-receipt-test.cjs` and `.../kubikart-fixed-receipt-delivery.mjs`: two labelled receipt emails sent with the revised local sender using existing QA enquiries 1505/1508, to the approved marketing mailbox only. Mailtrap reports **both delivered**, with reference, product URL, submitted details and localized receipt labels, and no private file reference. This validates the sender/provider path but does not deploy the new route/template behavior on the website.
- Fresh read-only deployed-bundle check: public Stripe mode **live**. No production secret was printed/read from Vercel, no provider settings changed, and no order was replayed/paid/refunded/fulfilled.

Initial regression failures were old overseas/oversized expectations and fixtures without the newly required address/provider-address read. These were updated with explicit rejection tests, while preserving German-address backend-failure coverage. The first isolated browser harness blocked Stripe.js itself and induced a loader exception; a local SDK fixture corrected the harness. No such harness-induced error was reported as a live site failure.

### Known limitations and recommended next phase

Commit/review and deploy this frontend change set without overwriting the backend database. Then retest actual production DE/EN enquiry receipts, coupon redemption and unsubscribe with the owner. Check live Stripe Workbench destination URL `https://kubikart.de/api/webhooks/stripe`, live event subscription and endpoint-specific `STRIPE_WEBHOOK_SECRET`; the production publishable-key pass alone does not prove this. Verify one owner-controlled live Stripe payment and separately PayPal: one charge/capture, paid WooCommerce status/transaction, correct total/options/address and exactly one paid confirmation email. Do not fulfil QA orders 1510/1511, which were sandbox-paid; no automatic status reconciliation was performed. No general penetration-test certification, exhaustive variation coverage, external campaign-list synchronization, retroactive unsubscribe links in old messages or automatic multi-parcel packing is claimed.
