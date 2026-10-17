# Production launch

**Status:** everything described in these documents is implemented and verified **locally**; nothing has been deployed,
committed or written to production by this work, and no live payment or real customer e-mail was made. This is the one
place for deployment steps, environment variables, the account set-up and the open launch decisions. Backend release
mechanics (guarded local workflow, preflight, backup, recovery, TLS) are in
[`backend/DEPLOYMENT.md`](../backend/DEPLOYMENT.md); the long-form setup walkthrough is in
[readme section 21](../readme.md#21-production-setup-guide).

## 1. Local status and production action per area

Detail lives in [products and bundles](07-products-and-bundles.md), [commerce](08-commerce-and-payments.md) and [revalidation](10-revalidation.md).

| Area | Local status | Production action |
|---|---|---|
| Names ("Friseure & Barbershops", "Friseur- & Barber-Paket", category "Business-Pakete") | Applied in the database, config script and messages; script is idempotent | Run `configure-business-kits.php` dry-run, then `apply`, after a DB backup |
| Homepage/navigation | Hero → paths → kits → contents → single products → industries; DE/EN, header, footer, mobile agree | None |
| Package imagery | 18 reviewed AI-generated design examples imported (2 rejected, see [products and bundles](07-products-and-bundles.md)), labelled "Illustrative Darstellung" everywhere; shared by DE/EN with localised alt/caption | Run the script with the image archive; optional: real photography |
| Customer uploads | 4 MiB limit, private store, fail-closed in production, 10 per 10 min per client (429 with retry info) | Set `KUBIKART_CUSTOMER_FILES_DIR` (outside web root), deny legacy public dir, server limits ≥ 6 MB, `TRUSTED_PROXY_HOPS` |
| Privacy text | Upload section added (DE + EN courtesy translation) | Owner/legal review; retention period for order-attached files |
| Stripe | Checkout, failure, signed webhook, duplicates, amount checks verified with a locally generated secret | `STRIPE_WEBHOOK_SECRET` from Stripe CLI/Dashboard; register the production endpoint |
| Email | Provider accepted test messages to the owner address | Verify inbox arrival; decide on owner notification email |
| Revalidation | WordPress event path verified end to end | Set `REVALIDATE_SECRET` (frontend) and the matching WordPress secret via env/untracked file |
| Shipping/tax | Rules and tax settings unchanged; kits qualify for free domestic shipping | Real weight/dimensions per kit; truthful delivery time |

Environment variables (placeholders only): `KUBIKART_CUSTOMER_FILES_DIR`,
`TRUSTED_PROXY_HOPS`, `STRIPE_WEBHOOK_SECRET`, `REVALIDATE_SECRET`,
`KUBIKART_REVALIDATE_SECRET`, `KUBIKART_FRONTEND_URL`, `FREE_SHIPPING_THRESHOLD`.

Additional production actions for the catalogue work: backup; `migrate-industry-relations.php` if the old industry
structure exists; `configure-business-kits.php` dry run then apply; `create-custom-stickers.php` and
`configure-business-cards.php`; then product images and publishing the drafts (see
[products and bundles](07-products-and-bundles.md), section 5).

## 2. Launch sequence

1. **Backups first:** database and uploads; test a restore.
2. **Backend:** deploy WordPress with the tracked plugins and mu-plugins; activate `kubikart-security`,
   `kubikart-newsletter`, `kubikart-business-industries`; keep secrets out of tracked files (environment or an untracked
   override file); set `KUBIKART_CUSTOMER_FILES_DIR` outside the web root and deny any legacy public customer-files path
   (`backend/deploy/nginx-customer-files.conf.example`).
3. **Integration account:** create the least-privileged WordPress user (section 4) and WooCommerce REST keys.
4. **Content transfer:** run the scripts in the order given in [products and bundles](07-products-and-bundles.md#5-transfer-scripts)
   after reading each dry run.
5. **Frontend:** set the environment variables (section 3), build, deploy; confirm `NEXT_PUBLIC_*` values contain no secrets.
6. **Webhooks:** register `{FRONTEND_ORIGIN}/api/webhooks/stripe` and `/api/webhooks/paypal`
   ([commerce](08-commerce-and-payments.md)); set `STRIPE_WEBHOOK_SECRET` and `PAYPAL_WEBHOOK_ID`.
7. **Cache refresh:** matching `REVALIDATE_SECRET` / `KUBIKART_REVALIDATE_SECRET` and a reachable
   `KUBIKART_FRONTEND_URL` ([revalidation](10-revalidation.md)).
8. **Mail:** verified sender and owner address ([e-mail](09-email.md)).
9. **Tests on the live stack (test mode first):** German and English order with personalisation and a file upload, payment
   success and failure, webhook delivery, refund path, enquiry e-mail, revalidation after a product edit, mobile and
   desktop pages.
10. **Monitoring:** application, PHP/WordPress errors, payment webhooks and availability.
11. **SEO and legal review:** [SEO launch checklist](11-seo.md#4-manual-launch-checklist) and section 5 below.

## 3. Environment variable contract

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
| `REVALIDATE_SECRET` | Revalidation route only | Verify the timestamped HMAC of WordPress events (matches WordPress `KUBIKART_REVALIDATE_SECRET`) |
| `ENQUIRY_RETRY_SECRET` | Enquiry retry route only | Verify the timestamped HMAC of the WordPress retry button; **different value** from `REVALIDATE_SECRET` (matches WordPress `KUBIKART_ENQUIRY_RETRY_SECRET`) |
| `REVALIDATE_ALLOW_UNTIMED_WEBHOOKS` | Optional | `true` only if native WooCommerce webhooks (no timestamp) call the revalidation route; keep off otherwise |
| WordPress `KUBIKART_FRONTEND_URL` | WordPress | Frontend origin for revalidation and retry calls, and **the only base used for password-reset links** |
| `DHL_LABEL_SECRET` | Administrative route only | Authenticate WordPress-to-frontend label request |
| `DHL_API_URL`, `DHL_API_KEY`, `DHL_USERNAME`, `DHL_PASSWORD` | DHL runtime | DHL provider authentication |
| `DHL_BILLING_NUMBER_*`, `DHL_SENDER_*` | DHL runtime | Label contract and sender details |
| `FREE_SHIPPING_THRESHOLD`, `DHL_PRICE_*` | Server runtime | Server-authoritative shipping calculation |
| `CF7_FORM_ID` | Optional server runtime | Contact Form 7 integration |


## 4. Least-privileged integration account

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

Do not commit or email the generated credential. Note that `publish_posts` also lets this account publish public posts and
industry pages, so treat its Application Password as a content-publishing credential and rotate it if exposed.

## 5. Legal and privacy review

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

The privacy policy contains an upload section (customer logo/menu files: purpose, access, storage, deletion of
unattached files after a grace period, files attached to orders kept with the order). The retention period for files
attached to orders, the hosting location and processors are owner/legal decisions and are **not** invented in the text.

## 6. Hosting reference: Strato

> Use this as a reference when setting up WordPress on Strato.de

#### Database Setup on Strato

When creating your database on Strato, use these values:

```
Database Name:     kubikart_prod
Database User:     kubikart_user
Database Password: [Use a strong password - save this!]
Database Host:     localhost (typical for Strato)
Collation:         utf8mb4_unicode_ci (recommended for WordPress)
```

After creation, you'll need these credentials for `wp-config.php`.

---

#### wp-config.php Settings

Update these settings in your Strato WordPress installation:

```php
<?php
// ** Database Settings ** //
define('DB_NAME', 'kubikart_prod');
define('DB_USER', 'kubikart_user');
define('DB_PASSWORD', 'YOUR_STRONG_PASSWORD_HERE');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', 'utf8mb4_unicode_ci');

// ** Table prefix ** //
$table_prefix = 'wp_';

// ** WordPress localization ** //
define('WPLANG', 'de_DE');

// ** Authentication Unique Keys and Salts ** //
// Get fresh keys from: https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'PUT_YOUR_UNIQUE_PHRASE_HERE');
define('SECURE_AUTH_KEY',  'PUT_YOUR_UNIQUE_PHRASE_HERE');
define('LOGGED_IN_KEY',    'PUT_YOUR_UNIQUE_PHRASE_HERE');
define('NONCE_KEY',        'PUT_YOUR_UNIQUE_PHRASE_HERE');
define('AUTH_SALT',        'PUT_YOUR_UNIQUE_PHRASE_HERE');
define('SECURE_AUTH_SALT', 'PUT_YOUR_UNIQUE_PHRASE_HERE');
define('LOGGED_IN_SALT',   'PUT_YOUR_UNIQUE_PHRASE_HERE');
define('NONCE_SALT',       'PUT_YOUR_UNIQUE_PHRASE_HERE');

// ** Debug mode (disable in production after testing) ** //
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);

// ** Disable direct file editing (security best practice) ** //
define('DISALLOW_FILE_EDIT', true);

// ** Memory limit ** //
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');
```

---

#### Frontend Environment Variables

After database migration, update your frontend `.env.local` with the new Strato domain:

```bash
# ─── WordPress (Update to Strato domain) ───────────────────────────────────
NEXT_PUBLIC_WORDPRESS_URL=https://your-strato-domain.de
WORDPRESS_API_URL=https://your-strato-domain.de/wp-json/wp/v2
WC_API_URL=https://your-strato-domain.de/wp-json/wc/v3

# ─── WooCommerce REST API (Generate NEW keys on Strato) ───────────────────
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Site URL ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://your-strato-domain.de

# Keep other settings same:
# STRIPE_*, PAYPAL_*, MAILTRAP_*, DHL_*, etc.
# (These don't change between environments)
```

---

#### Strato File Manager Paths

When using Strato's web file manager, navigate to:

```
public_html/
├── wp-config.php              ← Your database settings
├── wp-content/
│   ├── plugins/               ← Upload your plugins here
│   ├── uploads/               ← Upload media files here
│   └── themes/
├── wp-admin/
└── wp-includes/
```

---

#### Strato SSH Access (if available)

If your Strato package includes SSH:

```bash
# Connect to Strato
ssh username@your-strato-server.de

# Navigate to web root
cd ~/public_html

# Check directory permissions
ls -la wp-content/

# Fix permissions if needed
chmod -R 775 wp-content/
chmod -R 755 wp-content/plugins
chmod -R 755 wp-content/uploads

# Test database connection
mysql -h localhost -u kubikart_user -p kubikart_prod

# Install WP-CLI (optional)
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp
wp --info
```

---

#### PHP Configuration

Strato typically provides:

- **PHP Version:** 8.3+ (recommended)
- **Upload Limit:** 128MB (check Strato control panel)
- **Max Execution Time:** 300 seconds (Strato default)

If you need to increase upload limit, create or update `.htaccess`:

```apache
# .htaccess (in public_html root)

php_value upload_max_filesize 256M
php_value post_max_size 256M
php_value max_execution_time 600
php_value max_input_time 600

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

---

#### SSL/HTTPS Setup

Strato provides free SSL certificates (usually Let's Encrypt):

1. **Strato Control Panel** → Domains/SSL
2. Enable HTTPS for your domain
3. Ensure `wp-config.php` and `frontend/.env.local` use `https://` URLs
4. WordPress → Settings → General:
   - WordPress Address: `https://your-domain.de`
   - Site Address: `https://your-domain.de`

---

#### Database Size Estimation

If your local database is large, Strato import may take time:

**Small database:** < 50 MB → Fast import (< 1 minute)
**Medium database:** 50-200 MB → 2-5 minutes
**Large database:** > 200 MB → 5-30 minutes

Monitor phpMyAdmin for import progress. If it times out, use SSH import instead.

---

#### Testing API Connectivity

After setup, test that your frontend can reach the WordPress API:

```bash
# From your local machine
curl -H "Authorization: Basic $(echo -n 'consumer_key:consumer_secret' | base64)" \
  https://your-strato-domain.de/wp-json/wc/v3/products \
  | jq . | head -20
```

**Expected response:** JSON list of products

**If you get 401 Unauthorized:**

- Verify API key/secret are correct
- Check WC API key has "Read" permission
- Try Basic Auth with username/password instead of API key

---

#### Backup Strategy on Strato

Set up regular backups:

1. **Database:** Weekly SQL dump (use Strato control panel or cron job)
2. **Files:** Daily backup of `wp-content/` folder
3. **Keep:** At least 4 weekly backups + 4 monthly backups

**Cron job example** (if SSH available):

```bash
# Add to crontab (crontab -e)

# Daily database backup
0 2 * * * mysqldump -h localhost -u kubikart_user -p'PASSWORD' kubikart_prod | gzip > ~/backups/db-$(date +\%Y-\%m-\%d).sql.gz

# Weekly file backup
0 3 * * 0 tar -czf ~/backups/files-$(date +\%Y-\%m-\%d).tar.gz ~/public_html/wp-content/
```

---

#### Strato Support Resources

- **Control Panel:** https://www.strato.de/
- **Knowledge Base:** https://www.strato.de/faq/
- **Email Support:** support@strato.de
- **Phone Support:** +49 (0) 30-6009000

---

#### Migration Troubleshooting

See `backend/DEPLOYMENT.md` for the guarded local-only deployment and recovery procedure.

Common issues:

- Database connection errors → Check `wp-config.php` credentials
- File permissions → Run `chmod -R 775 wp-content/`
- API 401 errors → Regenerate WC API keys on Strato
- Slow imports → Use SSH import instead of phpMyAdmin

## 7. Responsive audit (local)

Checks run (Chromium, German and English):

* **Page level**, main routes at 360/768/1024/1440 px: horizontal overflow, clipped text, small tap targets.
* **Layout level**, main routes at 320/360/390/768/1024/1280/1366/1440/1536/1920 px: elements whose content runs into a
  neighbouring element in the same row (a check added after the desktop header overlapped at 1540 px and wider), and text
  spilling out of its row.
* **Header scan**, every 20 px from 320 to 1920 px in both languages: no overlaps, no spill out of the nav, at least 8 px
  between the last nav link and the language switcher.

Findings fixed: long German legal headings, small footer/breadcrumb/cart tap targets, oversized product titles on phones,
homepage grid orphans at 768-1024 px, and the desktop header: the logo and nav padding grew at 1536 px while the header
container stays 1280 px wide, so the nav spilled over the language switcher. The growth was removed and the link padding
tightened. The German nav has only about 21 px of spare room at 1280 px, so a unit test
(`header-nav-labels.test.ts`) limits the combined label length; if it fails after a copy change, shorten the label or
re-check the header at 1280-1920 px.

Not covered: real devices, browsers other than Chromium, checkout with a filled cart, logged-in account pages, long
user-generated content (product names with 100+ characters in cart/checkout), and zoomed text (browser zoom 200%).

## 8. Credentials and decisions still required

`STRIPE_WEBHOOK_SECRET` (and the live keys), `PAYPAL_WEBHOOK_ID` and PayPal server credentials, the verified Mailtrap
sender and owner address, production `KUBIKART_FRONTEND_URL` and shared secrets, `KUBIKART_CUSTOMER_FILES_DIR` on the host,
and the commercial and catalogue decisions listed in [products and bundles](07-products-and-bundles.md#6-open-owner-inputs).
