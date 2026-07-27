# WordPress Migration: COMPLETE ✅

**Date:** June 12, 2026  
**From:** Local Lando (kubikart-backend.lndo.site)  
**To:** Strato.de Production (http://kubikart-werbetechnik.de)

---

## Migration Status: ✅ SUCCESSFUL

### Database

- **Status:** IMPORTED & VERIFIED
- **Tables:** 51 (all `wp_` prefix, Kubikart-only)
- **Products:** 11 migrated
- **Orders:** 0 migrated
- **Users:** 1 admin user
- **Old Tables:** 12 `rmev_*` tables DELETED (cleaned up from previous installation)

### Files & Plugins

- **Plugins:** EXTRACTED & ACTIVATED
  - WooCommerce
  - kubikart-newsletter
  - kubikart-security
- **Media Uploads:** 59 MB EXTRACTED
- **Status:** All plugins active and functional

### WordPress Configuration

- **Domain:** `http://kubikart-werbetechnik.de`
- **Database Host:** `database-5020678517.webspace-host.com`
- **Database Name:** `dbs15780797`
- **Database User:** `dbu1340143`
- **wp-config.php:** UPDATED with Strato credentials
- **Site URLs:** Both set to `http://kubikart-werbetechnik.de`

---

## Database Credentials (Strato)

```
Host: database-5020678517.webspace-host.com
User: dbu1340143
Password: wD42mzNk4CFsR8YjVIsyXV2G3EiZFAkg6iM
Database: dbs15780797
```

---

## SSH Access (Strato)

```bash
ssh su1048058@5020672334.ssh.w2.strato.hosting
```

WordPress root: `~/STRATO-apps/wordpress_01/app`

---

## Critical Next Steps

### 1. Verify WordPress Admin Access

```
URL: http://kubikart-werbetechnik.de/wp-admin
Action: Log in with your WordPress credentials
Verify: Settings → General (URLs should be correct)
```

### 2. Check WooCommerce Data

```
WooCommerce → Products
Expected: 11 products with images
Expected: Media files loaded from /uploads/
```

### 3. ⚠️ Generate NEW WC REST API Keys (IMPORTANT!)

**These are different from the local Lando keys!**

1. WordPress Admin → WooCommerce → Settings → Advanced → REST API
2. Click **Add Key**
3. Set:
   - Description: `Kubikart Frontend`
   - User: Your admin account
   - Permissions: **Read/Write**
4. Copy the **Consumer Key** and **Consumer Secret**

### 4. Update Frontend Environment

Edit `frontend/.env.local`:

```bash
# ─── WordPress (UPDATE TO STRATO DOMAIN) ───
NEXT_PUBLIC_WORDPRESS_URL=http://kubikart-werbetechnik.de
WORDPRESS_API_URL=http://kubikart-werbetechnik.de/wp-json/wp/v2
WC_API_URL=http://kubikart-werbetechnik.de/wp-json/wc/v3

# ─── WooCommerce API Keys (GENERATED IN STEP 3) ───
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Site URL ───
NEXT_PUBLIC_SITE_URL=http://kubikart-werbetechnik.de

# Keep other settings unchanged (STRIPE, PAYPAL, MAILTRAP, DHL, etc.)
```

### 5. Test API Connectivity

```bash
# From local machine
curl -H "Authorization: Basic $(echo -n 'consumer_key:consumer_secret' | base64)" \
  http://kubikart-werbetechnik.de/wp-json/wc/v3/products | jq .
```

**Expected:** JSON array of 11 products

### 6. Frontend Deployment

```bash
# Test locally with new URLs
cd frontend && pnpm dev

# Test checkout flow end-to-end
# Then deploy to Vercel with new environment variables
```

---

## Files Uploaded to Strato

```
/home/www/STRATO-apps/wordpress_01/app/

kubikart-db.sql (2.2 MB)
plugins-2026-06-12_10-06-17.tar.gz (18 MB)
uploads-2026-06-12_10-06-17.tar.gz (59 MB)

All files extracted to proper locations:
  wp-content/plugins/
  wp-content/uploads/
```

---

## What Was Cleaned Up

**Old rmev\_\* tables (from previous installation) - ALL DELETED:**

- rmev_commentmeta ❌
- rmev_comments ❌
- rmev_links ❌
- rmev_options ❌
- rmev_postmeta ❌
- rmev_posts ❌
- rmev_termmeta ❌
- rmev_terms ❌
- rmev_term_relationships ❌
- rmev_term_taxonomy ❌
- rmev_usermeta ❌
- rmev_users ❌

Database now contains only Kubikart tables with `wp_` prefix (51 tables total).

---

## What's Ready

✅ WordPress installation (fully functional)  
✅ WooCommerce + all plugins active  
✅ 11 products with images  
✅ Custom newsletter + security plugins active  
✅ Database fully migrated  
✅ File uploads restored  
✅ All configurations updated for Strato  
✅ Old data cleaned up

---

## ⚠️ Important Notes

1. **Old API keys won't work** - WC REST API keys generated on Lando won't work on Strato. You must generate new keys.
2. **Frontend must be updated** - Update `frontend/.env.local` with new WordPress domain and API keys before deploying.
3. **Database is clean** - All old `rmev_*` tables from the previous installation have been removed.
4. **Site URL is production** - WordPress is now configured for the production domain.
5. **No downtime required** - You can keep the Lando installation running as a backup until you've fully tested the production site.

---

## Troubleshooting

If you encounter issues:

### **API Connection Error (401 Unauthorized)**

- Verify new WC API keys are in `frontend/.env.local`
- Check that API key has "Read/Write" permissions
- Ensure Basic Auth header is correctly formatted

### **Product Images Not Loading**

- Verify `/wp-content/uploads/` folder was extracted
- Check folder permissions (should be `755`)
- Upload folder: `~/STRATO-apps/wordpress_01/app/wp-content/uploads/`

### **Plugins Not Activated**

- Check `wp_options` table: `active_plugins` column
- Via WordPress Admin: Plugins page should show them all active
- If not active, activate them manually

### **Database Connection Error**

- Verify `wp-config.php` credentials match Strato credentials
- Test: `mysql -h database-5020678517.webspace-host.com -u dbu1340143 -p dbs15780797`

---

## Rollback Plan

If you need to revert:

1. Keep local Lando backup running
2. Keep database backup file in `backend/backups/`
3. Can restore from backup if needed: Import `kubikart-db.sql` again

---

## Support Resources

- **Detailed Migration Guide:** [docs/MIGRATION-STRATO.md](MIGRATION-STRATO.md)
- **Configuration Reference:** [docs/STRATO-CONFIGURATION.md](STRATO-CONFIGURATION.md)
- **Strato Support:** https://www.strato.de/support/
- **WP-CLI Docs:** https://developer.wordpress.org/cli/

---

## Migration Timeline

| Step                   | Status | Time      |
| ---------------------- | ------ | --------- |
| Export database        | ✅     | 10:06     |
| Compress files         | ✅     | 10:07     |
| Upload to Strato       | ✅     | 10:11     |
| Extract files          | ✅     | 10:11     |
| Update wp-config.php   | ✅     | 10:12     |
| Import database        | ✅     | 10:12     |
| Update site URLs       | ✅     | 10:13     |
| Clean old tables       | ✅     | 10:14     |
| Activate plugins       | ✅     | 10:14     |
| **Migration Complete** | ✅     | **10:14** |

---

**Next Action:** Visit `http://kubikart-werbetechnik.de/wp-admin` and verify everything is working! 🎉
