# Kubikart production-readiness actions

Last verified: 29 July 2026

This record covers the commercial Kit hold, final full-cart mobile correction,
integration-account preparation, commerce verification blockers, and
legal/privacy implementation review. It does not certify legal compliance.

## 1. Business Kit commercial hold

All five German/English Kit pairs were inspected directly in WooCommerce.
Before this review every record was:

- published;
- a simple product;
- marked in stock;
- purchasable;
- assigned a price;
- not inventory-managed.

None had:

- a featured image or gallery;
- product weight or shipping dimensions;
- attributes or variation choices;
- structured custom-product fields;
- a managed stock quantity.

Because the repository cannot establish that the listed contents, prices, or
shipping are fulfilment-ready, all ten localized records have been put into a
reversible commercial hold:

- regular/sale/current prices are empty;
- stock status is `outofstock`;
- `is_purchasable()` is false;
- publication and catalogue visibility are retained;
- translation relationships are retained;
- descriptions now identify the listed combination as proposed and the
  product as enquiry-led.

The pre-change values are backed up outside the production tree at:

`/tmp/kubikart-business-kits-before-commercial-hold-2026-07-29.json`

The pre-change descriptions are backed up separately at:

`/tmp/kubikart-business-kits-content-before-enquiry-copy-2026-07-29.json`

The hold is the safe enquiry-led state available through the current
WooCommerce model. Do not restore a price or in-stock status until every row
below is confirmed in both languages.

## 2. Kit decision matrix

The contents below are what the current product descriptions claim. They are
not independently verified fulfilment specifications.

| Kit | Previous unconfirmed price | Currently listed contents | Missing commercial decisions |
|---|---:|---|---|
| Starter Visibility Kit | €49.90 | 1 acrylic QR/NFC review stand; 1 A5 opening-hours sticker; 1 15cm logo window sticker | Acrylic type/thickness, stand dimensions/base, sticker material/finish/adhesive, exact printed area, final price, artwork inputs, package dimensions/weight, stock model |
| Gastro Visibility Kit | €89.90 | 1 A5 tabletop acrylic QR menu stand; 1 acrylic QR/NFC review stand; 1 A5 opening-hours sticker; 2 payment or booking QR table displays | Dimensions and acrylic thickness for both stand types, sticker specification, whether “payment or booking” is an owner/customer choice, QR destinations, final price, packaging/weight, stock model |
| Barber & Salon Kit | €79.90 | 1 acrylic QR/NFC review stand; 1 booking QR display; 1 mirror-lettering set; 1 20cm logo window sticker | Display dimensions/material, mirror-lettering size/material/coverage, sticker material, supplied artwork/QR requirements, final price, package dimensions/weight, stock model |
| Reception Kit | €69.90 | 1 acrylic QR/NFC review stand; 1 A4 frosted privacy-film strip; 1 A6 payment or booking QR display; 1 opening-hours sticker | Exact privacy-film dimensions/coverage, display material/thickness, opening-hours sticker dimensions/material, payment/booking choice, final price, package dimensions/weight, stock model |
| Local Shop Window Kit | €59.90 | 1 A5 review QR window sticker; 1 A5 opening-hours window sticker; 1 25cm logo window sticker; 1 frosted decorative accent strip | Sticker materials/adhesive/inside-or-outside application, accent-strip dimensions, artwork/QR inputs, final price, rolled/flat shipping method, package dimensions/weight, stock model |

For every Kit the owner must decide:

- whether the listed quantity is correct;
- exact material, thickness, finish, dimensions, and included fixing method;
- whether artwork/setup is included;
- final gross price and tax treatment;
- whether direct online purchase is operationally acceptable;
- required custom fields and their production limits;
- whether the complete package can be shipped safely;
- whether stock represents finished Kits, components, or made-to-order
  capacity.

When confirmed, update the German and English product together, add real
imagery, configure real fields, enter shipping data, then restore price and
in-stock status only after a complete test order.

## 3. Full-cart mobile correction

The full `/cart` item row previously placed an 80px image, details, quantity,
fixed-width line total, remove button, and all gaps in one unwrappable mobile
flex row.

It now uses a responsive grid:

- 64px image and two-row control arrangement on narrow screens;
- the existing 80px desktop image and one-row arrangement from `sm`;
- long names and customisation metadata may wrap;
- the remove control has an accessible name and a 44px target.

No cart calculation, item identity, storage, serialization, quantity,
checkout, payment, or order data changed.

Browser results with a long German configured item:

| Viewport | Document overflow |
|---:|---:|
| 320px | 0px |
| 360px | 0px |
| 768px | 0px |
| 1024px | 0px |

## 4. Least-privileged integration role

The previous security policy allowed Application Passwords only for
administrators. The version-controlled security plugin now registers:

- role: `kubikart_frontend_integration`;
- capability marker: `kubikart_frontend_integration`;
- required capabilities: `read`, `edit_posts`, `publish_posts`.

`edit_posts` and `publish_posts` are required by the current REST flow because
contact fallbacks, newsletter subscriptions, and withdrawal receipts are
stored as private posts. WordPress rejects `status=private` without
`publish_posts`.

The role does not receive:

- `edit_others_posts`;
- WooCommerce management;
- user management;
- settings management;
- plugin/theme/file management.

Application Password availability is permitted for this role without granting
administrator access.

Production owner action:

1. Deploy/activate the updated security plugin.
2. Create a dedicated non-human WordPress user with only
   **Kubikart Frontend Integration**.
3. Create one Application Password for the production Next.js deployment.
4. Replace `WP_APP_USER` and `WP_APP_PASSWORD` in the deployment secret store.
5. Verify Industries, newsletter, contact fallback, withdrawal, and password
   reset.
6. Revoke the old administrator Application Password.

Do not commit or email the generated credential.

## 5. Revalidation and infrastructure

The local WordPress runtime currently has:

- an HTTPS WordPress home URL;
- `KUBIKART_FRONTEND_URL` pointing to container-local `localhost`;
- no `KUBIKART_REVALIDATE_SECRET`.

The frontend local environment has `REVALIDATE_SECRET`, but WordPress must use
the same secret and a frontend URL reachable from the WordPress runtime.

Before production:

- configure matching `REVALIDATE_SECRET` and
  `KUBIKART_REVALIDATE_SECRET`;
- set `KUBIKART_FRONTEND_URL` to the real HTTPS frontend origin;
- verify a product update and each Industry lifecycle event refresh the
  frontend;
- configure database and media backups and perform a restore test;
- configure application, WordPress/PHP, payment-webhook, and availability
  monitoring;
- keep WordPress, WooCommerce, Stripe, PayPal, revalidation, and mail secrets
  server-only.

## 6. Commerce verification status

The local environment contains Stripe test credentials and a PayPal public
client ID. A PayPal server secret/mode is not configured. No live payment was
performed during this review.

Automated coverage verifies core configured-field parsing, validation,
configured prices, metadata serialization, and order-line metadata mapping.
That does not replace the requested German and English production-like order.

### Critical launch blocker discovered

The current checkout/payment flow accepts amount and paid-state information
from the browser:

- Stripe PaymentIntent creation accepts a browser-supplied amount;
- checkout PayPal is created/captured in the browser SDK;
- `/api/orders/create` accepts browser-supplied line prices,
  `set_paid`, and transaction ID;
- order creation does not independently verify the Stripe PaymentIntent or
  PayPal capture with the provider before marking the WooCommerce order paid;
- order creation does not rebuild line prices from WooCommerce product,
  variation, and server-validated paid-extra data.

Therefore a production-like order cannot be signed off safely yet. A client
could submit a manipulated price or paid state. This requires a dedicated
server-authoritative payment/order-hardening phase before public launch.

That phase must:

1. rebuild the current cart configuration on the server;
2. resolve real product/variation prices and stock;
3. validate custom fields and paid extras against WordPress configuration;
4. calculate the authoritative amount;
5. create/verify Stripe and PayPal transactions server-side;
6. create the WooCommerce order only from the verified result;
7. make webhook processing idempotent;
8. preserve the current cart and metadata contracts.

After hardening, run the requested German and English orders and inspect:

- required validation and character limits;
- variation and stock;
- paid-extra unit and quantity totals;
- tax and shipping;
- cart, checkout, and order line metadata;
- Stripe and PayPal sandbox records;
- customer/admin messages;
- cancellation/refund workflow.

Also test a simple, variable, Business Kit, out-of-stock, sale, no-custom-field,
missing-image, and invalid-slug case.

## 7. Legal and privacy implementation review

This is an implementation check, not legal advice.

### Electronic withdrawal function

The German withdrawal route contains:

- a persistently highlighted footer link labelled **Vertrag widerrufen**;
- a clear start action;
- name, electronic receipt address, contract identification, and optional
  scope;
- a separate **Widerruf bestätigen** step;
- server receipt ID plus date/time;
- private WordPress storage;
- immediate email confirmation when configured;
- a downloadable receipt when email delivery is unavailable.

These elements align structurally with the electronic withdrawal-function
requirements in § 356a BGB. The owner/legal reviewer must still confirm the
final withdrawal instruction wording, placement statement, durable-medium
delivery, exclusions for personalized goods, retention, and production email
delivery.

### Remaining legal/privacy review

- AGB, Datenschutz, Impressum, and parts of checkout contain hard-coded
  German copy even on locale-prefixed English routes.
- The privacy notice discusses ecommerce/payment processing but must be
  checked against the final production hosts and processors.
- Stripe loads on checkout and PayPal loads when selected. Their final
  disclosures and consent/legal basis require review.
- No active analytics, map, video, Google Fonts, or marketing-pixel
  integration was found in the frontend source.
- The cookie banner records “all” or “essential”, but no consent-managed
  analytics system currently consumes that choice.
- External social-profile links exist and must be confirmed as genuine.
- Shipping, tax, payment, personalized-goods withdrawal exclusions, and all
  business identity/contact data require owner/legal review.

Authoritative legal references checked:

- [§ 356a BGB](https://www.gesetze-im-internet.de/bgb/__356a.html),
  electronic withdrawal function;
- [Article 246a § 1 EGBGB](https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html),
  consumer information and withdrawal-function notice;
- [Directive (EU) 2023/2673](https://eur-lex.europa.eu/eli/dir/2023/2673/oj/eng),
  applied from 19 June 2026.

Do not describe the site as legally certified until a qualified reviewer has
approved the final production content and flows.
