# WordPress Migration Guide: Lando → Strato.de

> Migrate your complete WordPress + WooCommerce setup from local Lando development to Strato.de production hosting.

---

## Quick Overview

**What gets migrated:**

- ✅ WordPress database (posts, pages, users, settings)
- ✅ WooCommerce data (products, orders, reviews, categories)
- ✅ Media uploads (images, PDFs, etc.)
- ✅ Plugins (kubikart-newsletter, kubikart-security, WooCommerce, Polylang Pro, etc.)
- ✅ Theme files and custom code
- ✅ Database settings and options

**What does NOT get migrated:**

- ❌ Lando-specific configuration (`.lando.yml`)
- ❌ Development-only plugins or settings
- ❌ Local SSL certificates

---

## Prerequisites

Before starting, ensure you have:

1. **Local:** Lando running with WordPress backend (`lando start`)
2. **Strato account:** Active hosting with:
   - PHP 8.3+ (or 8.2 minimum)
   - MySQL 8.0+
   - SSH/SFTP access
   - File manager access (alternative to SFTP)
   - phpMyAdmin or equivalent database admin tool
3. **Tools:** WP-CLI (optional but recommended for easier migration)

---

## Step 1: Export Database from Lando

### Option A: Using phpMyAdmin (Easiest)

1. **Access Lando WordPress database admin:**

   ```bash
   lando info | grep -i database
   ```

   This shows database name, user, password, and port.

2. **Connect to Lando database:**
   - MySQL client command:
     ```bash
     mysql -h 127.0.0.1 -u wordpress -p wordpress -P <lando-mysql-port>
     ```
   - Or open browser to **http://localhost/phpmyadmin** (if Lando exposes it)

3. **Export database:**
   - Select database → Export
   - Format: **SQL**
   - Compression: **Gzip** (keeps file size smaller)
   - Click **Go** → save as `kubikart-backup-YYYY-MM-DD.sql.gz`

### Option B: Using MySQL command line (faster)

```bash
# Export compressed database
mysqldump -h 127.0.0.1 -u wordpress -p wordpress \
  --port=<lando-mysql-port> \
  --single-transaction \
  --quick \
  --lock-tables=false \
  | gzip > kubikart-backup-$(date +%Y-%m-%d).sql.gz
```

Replace `<lando-mysql-port>` with the actual port from `lando info`.

---

## Step 2: Export Media & Plugin Files

### Export uploads folder

```bash
# From repo root
cd backend/wordpress/wp-content

# Compress uploads folder
tar -czf ../../uploads-backup-$(date +%Y-%m-%d).tar.gz uploads/

# Compress plugins folder (including custom plugins)
tar -czf ../../plugins-backup-$(date +%Y-%m-%d).tar.gz plugins/
```

Your backups should now be in:

- `backend/uploads-backup-YYYY-MM-DD.tar.gz`
- `backend/plugins-backup-YYYY-MM-DD.tar.gz`

---

## Step 3: Prepare Strato.de Server

### 3.1 Create WordPress database on Strato

1. Log in to **Strato control panel** → Databases
2. Create new MySQL database:
   - **Database name:** `kubikart_prod` (or similar)
   - **User:** `kubikart_user`
   - **Password:** Strong password (save it!)

### 3.2 Prepare directory structure

Via **Strato File Manager** or SFTP:

1. Navigate to your web root (usually `public_html/` or `www/`)
2. If WordPress is already installed:
   - Backup existing database and files first
   - Delete default `/wp-content/uploads/` and `/wp-content/plugins/` (keep theme folder)
3. Ensure these directories exist and are writable:
   - `/wp-content/`
   - `/wp-content/uploads/`
   - `/wp-content/plugins/`

### 3.3 Configure `wp-config.php` on Strato

If WordPress is already installed:

```php
// /wp-config.php (edit on Strato or via FTP)

// Update database credentials
define('DB_NAME', 'kubikart_prod');
define('DB_USER', 'kubikart_user');
define('DB_PASSWORD', 'your_strong_password');
define('DB_HOST', 'localhost'); // or provided by Strato

// Security keys (update from https://api.wordpress.org/secret-key/1.1/salt/)
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
// ... etc
```

---

## Step 4: Import Database to Strato

### Option A: Using Strato's phpMyAdmin

1. **Log in to Strato control panel** → Databases → phpMyAdmin
2. Select your **kubikart_prod** database
3. Click **Import** tab
4. **Choose file:** Upload your `kubikart-backup-YYYY-MM-DD.sql.gz`
5. Click **Go**
6. Wait for import to complete (may take minutes for large databases)

### Option B: Using SSH (faster for large databases)

If Strato provides SSH access:

```bash
# From your local machine
# 1. Upload database backup via SFTP or Strato file manager
# 2. SSH into Strato server
ssh username@your-strato-server.de

# 3. Navigate to uploads directory and import
cd ~/public_html

# Decompress and import
gunzip < kubikart-backup-YYYY-MM-DD.sql.gz | \
  mysql -h localhost -u kubikart_user -p kubikart_prod

# Enter password when prompted
```

---

## Step 5: Update WordPress URLs & Settings

### 5.1 Update site URL in database

After import, WordPress still points to `kubikart-backend.lndo.site`. Update it:

**Via phpMyAdmin:**

1. Open database → `wp_options` table
2. Find and edit:
   - `siteurl` → change to `https://your-domain.de`
   - `home` → change to `https://your-domain.de`
   - `admin_email` → update to your admin email

**Via WordPress Admin:**

1. Log in to Strato WordPress (`https://your-domain.de/wp-admin`)
2. Settings → General
   - WordPress Address: `https://your-domain.de`
   - Site Address: `https://your-domain.de`
3. Click Save

### 5.2 Update NextJS frontend environment variables

Update `frontend/.env.local` for production:

```bash
# Old (Lando)
NEXT_PUBLIC_WORDPRESS_URL=https://kubikart-backend.lndo.site
WORDPRESS_API_URL=https://kubikart-backend.lndo.site/wp-json/wp/v2
WC_API_URL=https://kubikart-backend.lndo.site/wp-json/wc/v3

# New (Strato production)
NEXT_PUBLIC_WORDPRESS_URL=https://your-domain.de
WORDPRESS_API_URL=https://your-domain.de/wp-json/wp/v2
WC_API_URL=https://your-domain.de/wp-json/wc/v3
```

---

## Step 6: Upload Plugins & Media Files

### 6.1 Upload plugins

**Via SFTP (recommended):**

```bash
# From your local machine
cd backend

# Extract and upload plugins
tar -xzf plugins-backup-YYYY-MM-DD.tar.gz
sftp username@your-strato-server.de
  cd public_html/wp-content
  put -r plugins/*
  exit
```

**Via Strato File Manager:**

1. Go to Strato panel → File Manager
2. Navigate to `public_html/wp-content/plugins/`
3. Upload each plugin folder (drag & drop or upload)

### 6.2 Upload media files

```bash
# From your local machine
cd backend

# Extract and upload uploads
tar -xzf uploads-backup-YYYY-MM-DD.tar.gz
sftp username@your-strato-server.de
  cd public_html/wp-content
  put -r uploads/*
  exit
```

---

## Step 7: Verify & Test

### 7.1 Check WordPress admin

1. Navigate to `https://your-domain.de/wp-admin`
2. Log in with your local WordPress username/password
3. Verify:
   - **Dashboard** shows no errors
   - **Products** are visible (WooCommerce → Products)
   - **Media Library** shows uploaded files
   - **Users** are present

### 7.2 Check WooCommerce

1. Go to **WooCommerce → Products**
   - All products should be visible
   - Images should load correctly
2. Go to **WooCommerce → Orders**
   - All orders should be present
3. Go to **WooCommerce → Settings**
   - Payment gateways configured
   - Shipping settings intact

### 7.3 Check custom plugins

1. Go to **Plugins** page
   - kubikart-newsletter should be active
   - kubikart-security should be active
2. Test functionality:
   - **kubikart-newsletter:** Check `/wp-json/kubikart/v1/subscribers`
   - **kubikart-security:** Verify password reset endpoint works

### 7.4 Verify frontend connectivity

Test that your Next.js frontend can reach the Strato WordPress API:

```bash
# From your local machine
curl -H "Authorization: Basic $(echo -n 'user:pass' | base64)" \
  https://your-domain.de/wp-json/wc/v3/products \
  | jq . | head -20
```

If you see products JSON, the API is reachable.

---

## Step 8: Update WooCommerce REST API Keys

Your local WC API credentials (consumer key/secret) will NOT work on Strato. Create new ones:

1. **Strato WordPress admin** → WooCommerce → Settings → Advanced → REST API
2. Click **Add Key**
3. Set:
   - **Description:** Kubikart Frontend
   - **User:** (select your admin account)
   - **Permissions:** Read/Write
4. Copy **Consumer Key** and **Consumer Secret**
5. Update `frontend/.env.production` with new keys (do NOT commit to git)

---

## Step 9: Configure SSL & Domain

### On Strato:

1. **SSL Certificate:**
   - If using Let's Encrypt (free): Enable via Strato control panel
   - Usually auto-setup, verify with https://your-domain.de

2. **WordPress → Settings → General:**
   - Both URLs should use `https://`

3. **Next.js frontend:**
   - Update `NEXT_PUBLIC_SITE_URL` to use `https://your-domain.de`

---

## Step 10: Optional — Setup WP-CLI on Strato

If Strato supports SSH, WP-CLI makes future migrations easier:

```bash
ssh into-strato

# Install WP-CLI (if not already installed)
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp

# Verify
wp --info

# Future commands
wp db export backup.sql
wp plugin activate kubikart-newsletter
wp option update siteurl https://your-domain.de
```

---

## Troubleshooting

### Issue: "Error establishing a database connection"

**Solution:**

1. Verify database credentials in `wp-config.php`
2. Check that database user has permissions on the database
3. Confirm database host (often `localhost` on Strato)

### Issue: Images/uploads not loading

**Solution:**

1. Verify `/wp-content/uploads/` folder was uploaded
2. Check folder permissions (should be `755` or `775`)
3. Confirm media URLs in `wp_posts` table match new domain

**Check in database:**

```sql
SELECT guid FROM wp_posts WHERE post_type = 'attachment' LIMIT 5;
```

Should show URLs like `https://your-domain.de/wp-content/uploads/...`

If still showing old domain, run search-replace:

```bash
wp search-replace 'kubikart-backend.lndo.site' 'your-domain.de' --all-tables
```

### Issue: WooCommerce API 401 Unauthorized

**Solution:**

1. Verify new WC API key is in `frontend/.env.local`
2. Check that API key has **Read/Write** permissions
3. Ensure Basic Auth header is correctly formatted: `Authorization: Basic {base64(key:secret)}`

### Issue: Polylang Pro license not working

**Solution:**

1. Go to WordPress → Polylang → Settings → License
2. Re-activate license with Strato domain
3. Contact Polylang support if license is per-domain

### Issue: "Permission denied" uploading files via FTP

**Solution:**

1. Ensure `/wp-content/` folder permissions are `775` (writable by web server)
2. Use FTP client "Set Permissions" feature to fix
3. Or via SSH: `chmod -R 775 /home/username/public_html/wp-content/`

---

## Post-Migration Checklist

- [ ] Database imported successfully
- [ ] All products visible in WooCommerce
- [ ] All orders preserved
- [ ] Media files accessible
- [ ] Custom plugins active (kubikart-newsletter, kubikart-security)
- [ ] WC API keys regenerated
- [ ] Frontend `.env.local` updated with new URLs
- [ ] Frontend can connect to WordPress API
- [ ] SSL certificate active
- [ ] WordPress admin accessible
- [ ] Newsletter signup working
- [ ] Contact form working
- [ ] Payment gateways configured (Stripe, PayPal)
- [ ] Email templates working (Mailtrap)

---

## Next Steps

Once migration is complete:

1. **Test checkout flow** end-to-end on production
2. **Monitor error logs** (WP debug log, Strato logs)
3. **Update DNS** to point to Strato (if moving domain)
4. **Set up backups** on Strato (daily database + uploads)
5. **Update Vercel environment** to use production WordPress domain
6. **Enable caching** (Strato may provide caching plugin)

---

## Rollback Plan

If migration fails:

1. Keep your local Lando backup running
2. Keep database backup file (`kubikart-backup-YYYY-MM-DD.sql.gz`)
3. Delete Strato database and re-import if needed
4. Revert frontend `.env.local` to local Lando URLs

---

## Support

For Strato-specific help:

- **Strato Support:** https://www.strato.de/support/
- **WP-CLI Docs:** https://developer.wordpress.org/cli/commands/
- **WordPress Migration Guide:** https://wordpress.org/support/article/moving-wordpress/

For kubikart-specific issues:

- Check `backend/tests/` for plugin tests
- Review custom plugin code in `backend/wordpress/wp-content/plugins/`
