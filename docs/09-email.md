# E-mail: ownership, configuration and notifications

Which application sends which message, how the Mailtrap integration is configured, and how owner enquiry notifications work. Payment-related e-mail state is in [commerce](08-commerce-and-payments.md).

## 1. Who sends what

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

**Language and branding of WooCommerce's own e-mails (refunds, order notes).** Polylang for WooCommerce sends them in the *order's* language, so `POST /api/orders/create` sends `lang` (de/en, from the customer's language) with the order; without it every order counted as German. Verified locally: an English order's refund subject is "Your Kubikart order #… has been refunded", a German one "Deine Kubikart-Bestellung #… wurde erstattet". Orders created before this change keep their old (German) language. The `{site_title}` in those subjects is the WordPress **Site Title**, now "Kubikart" (it was "Kubikart Backend"); production gets it with the next backend deploy (the database is replaced).

Legal attachments default to `frontend/public/legal/agb.pdf` and `frontend/public/legal/widerruf.pdf`; both exist and are readable. Optional localized paths may be set with `MAIL_PDF_AGB_PATH` and `MAIL_PDF_WIDERRUF_PATH`; missing localized files fall back to the two existing generic files.

## 2. Configuration, templates and testing

Mail is sent through Mailtrap (server-side only; the token never reaches the browser).

### Configuration

| Variable | Purpose |
|---|---|
| `MAILTRAP_TOKEN` | API token (server only) |
| `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | Sender; must be a verified Mailtrap sending identity (default `noreply@kubikart.de`) |
| `ENQUIRY_OWNER_EMAIL` | Recipient of owner enquiry notifications (default `info@kubikart.de`) |
| `MAILTRAP_TEMPLATE_*` | Required for template-based newsletter confirmation, order, contact, account-created and login messages. Status variants fall back to the generic status template. Owner enquiry, withdrawal and coupon-bearing newsletter welcome also support inline messages. |
| `MAIL_PDF_AGB_PATH`, `MAIL_PDF_WIDERRUF_PATH` | Optional localized legal attachment paths; defaults are `frontend/public/legal/agb.pdf` and `widerruf.pdf` |

The full list with comments is in `frontend/.env.local.example`.

### Creating the templates

`frontend/scripts/create-mailtrap-templates.mjs` creates all Kubikart templates (bilingual subjects, variables such as
`{{order_number}}`) in the Mailtrap account, looks up the account ID itself and writes the resulting UUIDs into
`.env.local`. Run it from `frontend/` with a valid `MAILTRAP_TOKEN` (`node scripts/create-mailtrap-templates.mjs`).
Use separate templates per environment and never commit the generated `.env.local`.
`frontend/scripts/generate-widerruf-pdf.cjs` regenerates the withdrawal-form PDF attachment in `frontend/public/legal/`;
the legal wording itself is not changed by developers.

### Testing

Use a Mailtrap sandbox or a verified owner-controlled address only; never send test messages to customers. "Accepted
by the provider" is not proof of inbox delivery: confirm arrival separately.

## 3. Owner enquiry notification

### Native WordPress/WooCommerce transport

`backend/wordpress/wp-content/mu-plugins/kubikart-mailtrap.php` routes native `wp_mail` through Mailtrap as well.
It covers password-reset mail and WooCommerce lifecycle notifications that do not use the frontend templates.
The transport token is stored only in a non-autoloaded private WordPress option, never returned by REST.
The authenticated integration/admin endpoint `/wp-json/kubikart/v1/mail-transport` reports configuration and last
provider acceptance without revealing credentials. From `frontend/`, run:

```sh
NODE_OPTIONS=--use-system-ca node scripts/configure-wordpress-mailtrap.mjs --check
NODE_OPTIONS=--use-system-ca node scripts/configure-wordpress-mailtrap.mjs --configure
```

`--configure` applies the token, verified sender and owner recipient from the server environment. Repeat it on the
target WordPress installation after deployment or credential rotation. The transport preserves HTML, Reply-To,
Cc/Bcc and attachments, fails closed on provider errors, and directs WooCommerce new/cancelled/failed owner-order
notifications to the configured owner. Storefront registration explicitly owns its branded account-created mail,
so only that authenticated customer-creation path suppresses WooCommerce's duplicate welcome email.

### Public form protection

Set `CLOUDFLARE_TURNSTILE_SITEKEY` and `CLOUDFLARE_TURNSTILE_SECRET` in each deployed frontend environment.
The site key is public; the secret stays server-side. Register the actual storefront hostnames in Cloudflare.
The localized widget loads only when submitting a protected form or uploading a file. Each action obtains a fresh
token; the server validates it through Cloudflare Siteverify and checks the action and hostname before invoking
the API handler. Missing credentials/provider outages fail closed. Official testing keys are rejected in production.
Protected actions include contact/product/industry/custom enquiries, newsletter signup, login/registration,
password-reset requests/reset, pending-order creation (including express checkout), withdrawal and customer uploads.
Signed webhooks/retry/revalidation endpoints retain their own signatures; cart reads, shipping quotes and local
add-to-cart actions are not CAPTCHA-gated. The backend password endpoints require integration/admin authentication,
so the public cannot bypass the frontend challenge via the WordPress REST route.

Keep production keys unchanged during automated QA. Use Cloudflare's documented testing keys only as temporary
process overrides on an isolated development server. `RATE_LIMIT_NAMESPACE` can isolate QA counters; leave its
default `kubikart` for regular operation. Privacy-disclosure review for Cloudflare is an owner/legal follow-up;
this implementation does not change legal wording.

Newsletter links use `/api/newsletter/confirm` (no locale prefix), store the selected storefront language, and show
a localized confirmation page. Confirmed-token replay does not send another welcome message or create another
coupon. Welcome coupon codes are included in the localized email. Withdrawal submissions are durably stored first,
then notify both owner and customer; owner notification uses the existing recorded-status/retry mechanism.

The durable paid-order email path sends the full order-confirmation template, including actual WooCommerce order
items/total/shipping and the existing receipt/legal PDF attachments. Its existing lock and `_kubikart_payment_email_*`
markers prevent normal duplicate receipts on repeated success events and allow retry after provider failures.
Later status updates retain the separate status-email helper. Signed payment webhooks need their real provider
configuration; a locally re-signed test event does not prove automatic delivery to a deployed endpoint.

Every stored enquiry (bundle/product enquiry, industry enquiry, general contact) now
also emails the owner through the existing Mailtrap integration:

* **Recipient:** `ENQUIRY_OWNER_EMAIL`, default `info@kubikart.de`. **Sender:**
  `MAIL_FROM_EMAIL` (default `noreply@kubikart.de`, must be a verified Mailtrap sending
  identity), `MAIL_FROM_NAME`. **Reply-To:** the customer's validated email.
* **Content:** reference (`ANF-yymmdd-XXXXXX`, also shown to the customer and in the
  WordPress title), received time, product/bundle (name, ID, slug), page URL, language,
  order mode, customer name, email, phone, business name, message, link to the record.
* **Template:** optional `MAILTRAP_TEMPLATE_OWNER_ENQUIRY` with the variables listed in
  `.env.local.example`. Without it a plain text + HTML message is sent, so no remote
  template is required.
* **Status:** stored with the enquiry (`_kubikart_notification_status` pending /
  accepted / failed, attempts, last attempt, redacted error, provider message id) and
  shown in the Posts list column "Benachrichtigung". **"accepted" only means the
  provider accepted the message, not that it reached the inbox.**
* **Failure:** the enquiry is always stored first; a mail failure never fails the
  request or loses the enquiry. **Retry:** the Posts list row action
  "Benachrichtigung erneut senden" (WordPress → signed request) or
  `POST /api/enquiries/retry` (headers `x-kubikart-timestamp` = Unix seconds and
  `x-kubikart-signature` = base64 HMAC-SHA256 of `"<timestamp>.<body>"` with `ENQUIRY_RETRY_SECRET`, a secret of its own
  that must equal the WordPress constant `KUBIKART_ENQUIRY_RETRY_SECRET`; requests older than 5 minutes are rejected; body `{"post_id":123}` or `{}`
  for all failed/pending enquiries; `"force": true` to resend an accepted one). A retry
  only re-sends and updates the status; it cannot create or change an enquiry.
  A cron/scheduler calling the sweep is optional.
* Credentials stay server-side; stored errors have the token redacted.

Verified with a mocked provider (unit tests: recipient, Reply-To, content, template vs.
inline, escaping, accepted/failed states, redaction, attempt counting, retry without
duplicates, accepted not resent unless forced) and live with the provider disabled
(enquiry stored once, status `failed`, two retries → attempts 3, still one post). **No
real message was sent and inbox arrival was not tested.** Still needed for production:
a verified sender, the owner address (or template UUID), and (for the admin button) the
production `KUBIKART_FRONTEND_URL` and shared secret.
