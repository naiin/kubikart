# Storefront flow, CAPTCHA and email audit — 16 October 2026

## 1. Scope implemented

Audited the live WordPress/WooCommerce catalog and real Chromium flows in German and English. The inventory grew
from 24 to 26 published translated product pages during the audit; the newly published laminated-menu pair was
included before finishing. This is a functional/security/email task, not a layout redesign or product-data rewrite.

Implemented Cloudflare Turnstile for public form submissions and uploads, corrected customer login, fixed
newsletter confirmation/delivery behavior, connected native WordPress/WooCommerce mail to Mailtrap, and added
owner withdrawal notifications. Owner notifications use `info@kubikart.de`. Only the explicitly approved
`payments@kubikart.de` mailbox was used to create a customer. The existing administrator account was untouched.

**Overall: security/email implementation and broad browser audit completed. Stripe's local signed-event/payment/email
chain now passes after the owner supplied the signing secret. Remaining configuration and coverage gaps below mean
this is not an all-flows-pass or production-ready claim.**

### Findings fixed

| Finding | Change and evidence |
|---|---|
| Public form APIs lacked provider-backed CAPTCHA | Shared localized, lazily loaded Turnstile dialog plus server Siteverify validation. All nine protected production endpoints reject missing tokens and forged internal-verification headers with HTTP 403. |
| Ordinary customer login failed | Reproduced registration success followed by correct-password HTTP 401 in both locales. WordPress REST Basic accepts application passwords, not regular customer passwords. Added private integration-authenticated credential verification using WordPress authentication, with WooCommerce identity matching. Retest: HTTP 200 in DE and EN; login alerts delivered. |
| Direct backend password endpoint bypassed storefront protection | Forgot/reset/customer-login routes now require integration/admin capabilities. Anonymous HTTP requests to each returned 401. |
| Password reset email ignored English locale | Localized backend subject/body. Real DE and EN reset emails delivered; both delivered links successfully changed only the test customer's password. Replayed keys returned 400. |
| Native `wp_mail` had no Mailtrap transport | Added a configured mu-plugin covering native WordPress/WooCommerce HTML mail, attachments, Reply-To and owner recipients. Real registration/reset/on-hold/new-order messages reached Mailtrap and were marked delivered. |
| Registration sent duplicate welcome messages after connecting native mail | Observed one native WooCommerce welcome plus the branded frontend message. Added explicit mail ownership on authenticated storefront customer creation, narrowly suppressing only its native duplicate. Conditional scope is regression-tested; a second live customer was not created solely to retest suppression. |
| Newsletter link pointed to a nonexistent localized API URL | Links now use `/api/newsletter/confirm` and persist the selected language. Real confirmations returned 200 and rendered the correct DE/EN language. |
| Newsletter success could hide a failed send; rate counter incremented twice | Send failures now return 503; removed duplicate increment. Added regression tests. |
| Confirmation replay could issue/send repeatedly | Added locking, constant-time token comparison, durable confirmation/email state and replay handling. Real replay returned 200 without another welcome message. Regression tests cover invalid tokens and retryable provider failure. |
| Newsletter coupon was absent from welcome email | Localized welcome message now includes the generated coupon. DE/EN welcome messages delivered. |
| Withdrawal email required an unset template; owner was not notified | Added localized inline customer fallback and durable owner notification/status through the existing retry mechanism. DE/EN submissions returned dated receipts; both owner and customer messages delivered. |
| Storefront language could differ from browser language | Protected submissions explicitly send the selected storefront locale and Accept-Language. Tested English forms in a German browser context. |
| Paid customers received only a status update, not the full receipt | Connected the existing full order-confirmation helper to the durable paid-email delivery path. DE/EN real Stripe test payments → locally delivered signed real events → processing orders → delivered receipts with `order.pdf`, `agb.pdf`, `widerruf.pdf`. Replaying success events returned 200 without duplicate receipts. |
| Owner notification retry lacked signing configuration | Generated a distinct matching secret only in gitignored local frontend/backend configurations and enabled backend constant loading. Real signed retry of labelled audit post 1345 returned 200/accepted, persisted attempt 2, and sent one explicit resend. Accepted notifications were skipped before and after it; invalid signatures returned 401. |

### Open findings and blockers

| Priority | Finding | Evidence / next action |
|---|---|---|
| Deployment check | Automatic Stripe webhook delivery remains unverified | The owner added `STRIPE_WEBHOOK_SECRET` during the audit. Fresh DE/EN real Stripe **test-mode** payments and real Stripe success/refund events were verified locally: the harness re-signed and POSTed those events, both webhook/replay responses were 200, receipts delivered once, refunds succeeded and WooCommerce created refund records. This proves the local handler/data/email chain, not Stripe's automatic delivery to the deployed URL. Confirm that endpoint, subscribed events and signing-secret match in Stripe before launch. |
| High | `PAYPAL_WEBHOOK_ID` is missing | PayPal sandbox order initialization returned 200. Payer approval/capture and provider webhook delivery were not tested; they require an approved sandbox buyer/session and configured webhook. `PAYPAL_MODE` is unset, which the existing implementation treats as sandbox. Do not switch it to live as part of this audit. |
| Deployment check | Owner notification retry secrets must also be provisioned in the target deployment | Local matching frontend/backend secrets are configured and signed retry passes. These gitignored values are not automatically deployed. Provision matching `ENQUIRY_RETRY_SECRET` / `KUBIKART_ENQUIRY_RETRY_SECRET`, distinct from revalidation keys, on the target systems and verify the backend retry action points to the rebuilt frontend. |
| Medium | German product heading overflows at 1024 px | Opening-hours product document width was 1046 px at a 1024 px viewport. The long H1 has 440 px content in a 377 px column. Add an appropriate word-wrap/hyphenation treatment in the product-layout phase; not a CAPTCHA regression. Other inspected sizes/branches did not overflow. |
| Medium | Kit custom-field metadata is not exposed by the actual enquiry path | All ten translated kit pages route correctly to product-aware contact forms, but those forms have no upload input or structured kit configuration. Eight translated kits have required custom-field metadata that is not collected. Two representative DE/EN reception enquiries submit and preserve product identity, but only free text/contact details. Decide whether this intentionally stays a consultation flow or needs a structured configurator. |
| Medium | Custom-size enquiry drops previously uploaded product files | The current custom-size wrapper passes selection lines but an empty `fileTokens` array. Quotes do not require a logo, which is useful, but an artwork uploaded before switching to a custom size is not attached to that enquiry. Clarify the intended behavior before changing the product contract. |
| Medium | Some physical products still lack commercial metadata | Live WooCommerce business cards, opening-hours stickers and custom stickers have empty parent SKU, weight and dimensions in both translations. Business-card variations also have empty SKU/weight/dimensions. No weights or SKUs were invented. The 10 card variation prices per language match the supplied paper/pack price matrix. |
| Low | Artwork guidance and accepted formats disagree | Vinyl-logo helper text recommends SVG; the upload input/API accepts PNG, JPEG, WebP and PDF, not SVG. Align the copy with supported formats or separately implement secure SVG handling. |
| Low | Business-card business email is a free-text customization | A non-email string was accepted in that field and persisted to cart. This is separate from checkout email validation. Consider an email-type customization with matching server validation. |
| Medium | Native WooCommerce language/branding differs from storefront | Delivered native subjects still say “Kubikart Backend”; the English order's native refund email was German. Review WooCommerce per-order email locale and branding/store title; this audit did not globally rename backend settings or replace native refund templates. Existing frontend Mailtrap templates are intentionally bilingual rather than single-language. |
| Follow-up | Privacy disclosure and deployment configuration | Cloudflare is a new third-party form protection service. Owner/legal review of the privacy disclosure is needed; legal text was not edited. Configure production hostnames/keys and deploy frontend/backend together. Local `.env.local` and WordPress options do not provision another deployment automatically. |

## 2. Files changed

Only audit-owned changes are listed; the worktree contained substantial unrelated changes which were preserved.

* CAPTCHA: `frontend/src/components/CaptchaProvider.tsx`, `frontend/src/lib/captcha.ts`,
  `frontend/src/lib/captcha-actions.ts`, `frontend/src/proxy.ts`, `frontend/src/lib/security.ts`,
  `frontend/src/app/[locale]/layout.tsx`, `frontend/next.config.ts`, messages `de.json` / `en.json`,
  `frontend/.env.local.example`.
* Form integration: `ContactForm.tsx`, `ProductEnquiryForm.tsx`, `Footer.tsx`, `WithdrawalFunction.tsx`,
  `product/ProductPageClient.tsx`, `checkout/PayPalExpressButton.tsx`, `lib/auth.tsx`, account login/register,
  forgot/reset pages and checkout page. Existing functional form payloads were retained.
* Email/auth APIs: `frontend/src/lib/email.ts`, `frontend/src/lib/order-status-email.ts`, `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`,
  `app/api/auth/forgot-password/route.ts`, newsletter and newsletter-confirmation routes, withdrawal route.
* Backend: new `backend/wordpress/wp-content/mu-plugins/kubikart-mailtrap.php`; targeted changes to
  `plugins/kubikart-security/kubikart-security.php` and `backend/wordpress/wp-config.php`.
* Configuration/documentation: new `frontend/scripts/configure-wordpress-mailtrap.mjs`, `docs/09-email.md`,
  this report and its sanitized evidence JSON. Gitignored local environment gained only the explicit owner recipient;
  the user-provided Turnstile keys were not replaced. Gitignored frontend/backend local configuration also received
  a newly generated matching retry signing secret; no secret was committed or displayed.
* Regression tests: new frontend CAPTCHA tests and backend Mailtrap tests; updated newsletter, confirmation,
  withdrawal, login, paid-order receipt delivery and backend security tests plus necessary WordPress test stubs.

## 3. Existing functionality preserved

WooCommerce remains the source of products, variations, prices, stock and order totals. No product descriptions,
prices, slugs, categories, weights or custom-field definitions were edited. Personalization visibility, uploads,
quantity, cart persistence, shipping calculations, payment initialization, localization and route contracts remain.
The API performs CAPTCHA validation before side effects; local add-to-cart, cart reads and shipping quotes remain
ungated. Payment endpoints still require an unguessable pending-order reference; signed machine endpoints retain
their signature checks rather than using an interactive CAPTCHA. Existing spam/origin and rate protections remain;
a live invalid-submission sequence produced 400 then 429 without storing data or sending mail.

### Browser/integration coverage

| Flow | German | English | Evidence boundary |
|---|---|---|---|
| Physical product default purchase | 8 pages pass | 8 pages pass | Real page → required fields/upload → cart, including variations and private file tokens; no page JS errors recorded in purchase pass. |
| Cards: simple layout without upload | Pass | Pass | Required visible fields → cart → reload persistence; hidden artwork not required. |
| Stickers: text instead of artwork | Pass | Pass | Required text options → cart → persistence; hidden file not required. |
| QR stands: blank/invalid destination | Pass | Pass | Missing required fields and malformed URL cannot enter cart. |
| Opening-hours custom font | Pass | Pass | Custom font reveals its required text field; installation reveals required address. |
| Vinyl/frosted installation and optional QR | Pass | Pass | Conditional controls reveal correctly; blank required fields block cart. |
| Custom film size | Pass | Pass | Real 130 × 45 cm requests persisted product identity, size and locale; owner/customer emails delivered. |
| Menu: custom format / larger quantity / layout service | Pass | Pass | All six branches replace purchase controls with enquiry forms; custom format has two size fields, others do not. These six branch submissions were not individually sent. |
| Business kit enquiry navigation | 5 pages pass | 5 pages pass | Actual CTAs reach product-aware contact form. Reception enquiry submitted in each language; other kits inspected through form entry. |
| General contact | Pass | Pass | Browser → API → private WordPress record → owner/customer Mailtrap delivery. |
| Newsletter signup/confirm/replay | Pass | Pass | Pending record → delivered opt-in mail → localized confirmation → coupon/welcome → replay. |
| Registration | Branded mail is bilingual | Pass | One approved customer created. Duplicate-mail suppression is regression-tested, not re-proven with another live customer. |
| Login / forgot password / valid reset | Pass | Pass | Dedicated customer only; real delivery and successful reset links; used keys rejected. |
| Withdrawal | Pass | Pass | Multi-step review → stored declaration → receipt/download → owner/customer delivery. No real withdrawal was made. |
| Checkout / Stripe initialization | Pass | Pass | Browser → server-priced WooCommerce pending order → real Stripe test PaymentIntent. |
| Paid checkout → webhook → paid confirmation | Local signed-event chain passes | Local signed-event chain passes | Real Stripe test payments/events, success webhook/replay 200, WooCommerce processing, mail marker sent, one delivered full receipt per order with three PDFs. Automatic external forwarding unverified. |
| Stripe full test refund | Pass | Pass, locale issue | Real test refunds, locally delivered signed refund events 200, WooCommerce refunded with one refund record each, native refund mails delivered. English native refund mail is German. |
| PayPal | Sandbox initialization pass | Same shared API | Approval/capture/provider webhook not tested. |
| Owner notification retry | Pass on labelled DE enquiry | Shared signed API | Invalid signature 401; accepted-message skip 200; explicit signed resend 200/accepted/stored with attempt 2; subsequent accepted-message skip 200. Provider-failure state is regression-tested rather than induced in the live transport. |
| Production CAPTCHA | Pass for tested boundaries | Pass for tested boundaries | All 9 APIs reject missing/spoofed verification; actual widget renders at 360 px, fits, and Escape cancels. |

Automated positive CAPTCHA flows used Cloudflare's **official test keys only as process overrides** on an isolated
development server, with real Siteverify calls. Production used the actual configured keys for negative checks and
widget rendering. Actual-key successful human verification is not claimed; the headless browser received the real
human checkbox. Official test keys are explicitly rejected in production.

Mailtrap reported **43 delivered messages** for the approved recipients during the audit period, across contact,
owner enquiry, newsletter confirmation/welcome, withdrawal, account-created, login-alert, paid receipts and native WordPress mail.
This includes repeated checks, one explicit retry resend and the pre-fix duplicate welcome; it is not 43 distinct flow passes. “Delivered” here
means the provider reported delivery to the receiving mail system, not proof of inbox placement or that a person read it.

## 4. Legacy styling still present

Existing product controls, account/checkout/contact forms, cart drawer and legal-page layouts still contain legacy
classes. No broad styling migration was attempted. The new CAPTCHA dialog uses approved brand/surface/error tokens
and native dialog focus/keyboard behavior. The existing German heading overflow is documented above.

## 5. Commands run

* `pnpm test`, `pnpm lint`, `pnpm typecheck` from `frontend/`.
* PHP 8.2.29 from the installed Local runtime, with its shared-library path, running `backend/vendor/bin/phpunit`.
* `NODE_OPTIONS=--use-system-ca node node_modules/next/dist/bin/next build --webpack` in an isolated frontend copy.
* Isolated `next dev --webpack -p 3132` for positive browser checks; isolated `next start -p 3133` for production smoke.
* Chromium/Playwright audit scripts covering product/cart, conditional fields, kit routing, contact, newsletter,
  withdrawal, account/reset, checkout and production CAPTCHA; read-only WooCommerce/WordPress/Mailtrap inspections.
* `NODE_OPTIONS=--use-system-ca node scripts/configure-wordpress-mailtrap.mjs --check`.

No server was started or stopped on port 3000. Test processes used separate ports; an initial shared build-file
collision was isolated by moving subsequent servers/builds to separate temporary copies. Browser harness selector,
streaming-readiness and HTML-decoding errors were corrected and are not presented as website defects.
Both temporary audit servers were stopped after verification. The final port check showed only the user's server
listening on port 3000; ports 3132 and 3133 were free. The actual CAPTCHA keys remained configured, no official
testing key was persisted, and the supplied Stripe and generated retry signing secrets were present.

The full-story verification skill guided checks across browser → API → stored data → provider → rendered response.
React/routing guidance kept the CAPTCHA as a small client interaction with server-side validation and native dialog
focus/cancellation, without converting server-rendered pages or rewriting commerce architecture.

## 6. Results

* Frontend: **394 tests pass**; lint and type-check pass.
* Backend: **200 tests pass, 757 assertions**; **two deprecation warnings remain**.
* Production build: **pass**.
* Changed backend PHP files: syntax checks pass.
* Production missing-token/forged-header protection: **9/9 reject with 403**.
* Native WordPress mail transport: configured; verified sender `noreply@kubikart.de`, owner `info@kubikart.de`.
* Runtime/browser findings and delivery boundaries: see coverage matrix and sanitized evidence JSON.

### Audit artifacts and cleanup state

* Test customer: **ID 10**, `payments@kubikart.de`, regular customer. Its password was changed only for reset tests;
  generated credentials are not committed or printed. Existing administrator/customer accounts were not changed.
* Test orders: **1337 / 1338**, clearly labelled **AUDIT / DO NOT FULFIL**, both cancelled after checks.
  The Stripe test-mode payment for 1338 was fully test-refunded. No real funds were charged.
* Subsequent paid-email test orders: **1349 / 1350**, clearly labelled **AUDIT / DO NOT FULFIL**. Both test payments
  were fully test-refunded; both WooCommerce orders are refunded with one refund record each. Their owner notices,
  full customer confirmations and native customer refund emails were reported delivered.
* Confirmed newsletter test records: **1327 / 1331**; test coupon IDs **1328 / 1332**, restricted to the approved owner
  mailbox. An earlier pending opt-in test record and clearly labelled enquiry/withdrawal records are retained for review.
* Stored enquiry/withdrawal evidence includes posts **1322, 1324, 1329, 1333, 1335, 1339, 1341, 1343, 1345, 1347**.
  Some repeated browser checks produced additional labelled test records/messages. No real enquiries were removed.
* Temporary screenshots, logs, private test credentials, reset-mail content and upload tokens were kept out of the
  committed evidence. The report/evidence contain no service secrets, reset/confirmation links or private file tokens.

## 7. Known limitations

This is a representative end-to-end audit across every published product page, not exhaustive execution of every
variation combination, payment provider/3DS branch, account-management action, browser engine or fulfillment state.
Real customer accounts and real payment methods were not used. Automatic external webhook forwarding, PayPal capture,
automatic WordPress admin-row retry navigation, manual actual-key CAPTCHA completion and deployment-specific hostname behavior remain unverified as stated.
Email provider failures were regression-tested, not induced by breaking the live WordPress transport.

Local source/backend changes are not evidence of deployment elsewhere. Rebuild/restart the user's frontend and
deploy the backend changes together; otherwise an older frontend will not use the new private authentication routes
and CAPTCHA integration. Keep actual keys in the target environment and configure native transport there with the
provided script. Do not deploy testing-key overrides.

## 8. Recommended next phase

First verify deployed Stripe webhook forwarding, provision PayPal webhook configuration and matching enquiry retry
secrets, then rerun provider delivery/capture, signed retry, order-state/email idempotency and actual-key human CAPTCHA checks in the target
environment. Next resolve the documented kit/custom-size configuration gaps and truthful product metadata, followed
by the small responsive/localization/branding corrections. Keep layout redesign separate from commerce/security fixes.

References: [Cloudflare server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[official testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/),
[Mailtrap email logs](https://docs.mailtrap.io/email-api-smtp/analytics/logs).
