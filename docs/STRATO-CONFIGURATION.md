# Strato WordPress Configuration Reference

> Use this as a reference when setting up WordPress on Strato.de

## Database Setup on Strato

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

## wp-config.php Settings

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

## Frontend Environment Variables

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

## Strato File Manager Paths

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

## Strato SSH Access (if available)

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

## PHP Configuration

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

## SSL/HTTPS Setup

Strato provides free SSL certificates (usually Let's Encrypt):

1. **Strato Control Panel** → Domains/SSL
2. Enable HTTPS for your domain
3. Ensure `wp-config.php` and `frontend/.env.local` use `https://` URLs
4. WordPress → Settings → General:
   - WordPress Address: `https://your-domain.de`
   - Site Address: `https://your-domain.de`

---

## Database Size Estimation

If your local database is large, Strato import may take time:

**Small database:** < 50 MB → Fast import (< 1 minute)
**Medium database:** 50-200 MB → 2-5 minutes
**Large database:** > 200 MB → 5-30 minutes

Monitor phpMyAdmin for import progress. If it times out, use SSH import instead.

---

## Testing API Connectivity

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

## Backup Strategy on Strato

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

## Strato Support Resources

- **Control Panel:** https://www.strato.de/
- **Knowledge Base:** https://www.strato.de/faq/
- **Email Support:** support@strato.de
- **Phone Support:** +49 (0) 30-6009000

---

## Migration Troubleshooting

See `MIGRATION-STRATO.md` in the docs folder for detailed troubleshooting steps.

Common issues:

- Database connection errors → Check `wp-config.php` credentials
- File permissions → Run `chmod -R 775 wp-content/`
- API 401 errors → Regenerate WC API keys on Strato
- Slow imports → Use SSH import instead of phpMyAdmin
