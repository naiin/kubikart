#!/bin/bash

# Rename WordPress tables from wp_* to rmevo_*

DB_HOST="database-5020678517.webspace-host.com"
DB_NAME="dbs15780797"
DB_USER="dbu1340143"
DB_PASS="wD42mzNk4CFsR8YjVIsyXV2G3EiZFAkg6iM"

echo "🔄 Renaming tables from wp_* to rmevo_*"
echo "════════════════════════════════════════"
echo ""

# List of all tables to rename (remove any that don't exist)
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE wp_users RENAME TO rmevo_users;
ALTER TABLE wp_usermeta RENAME TO rmevo_usermeta;
ALTER TABLE wp_posts RENAME TO rmevo_posts;
ALTER TABLE wp_postmeta RENAME TO rmevo_postmeta;
ALTER TABLE wp_comments RENAME TO rmevo_comments;
ALTER TABLE wp_commentmeta RENAME TO rmevo_commentmeta;
ALTER TABLE wp_links RENAME TO rmevo_links;
ALTER TABLE wp_options RENAME TO rmevo_options;
ALTER TABLE wp_term_relationships RENAME TO rmevo_term_relationships;
ALTER TABLE wp_term_taxonomy RENAME TO rmevo_term_taxonomy;
ALTER TABLE wp_terms RENAME TO rmevo_terms;
ALTER TABLE wp_termmeta RENAME TO rmevo_termmeta;
ALTER TABLE wp_wc_category_lookup RENAME TO rmevo_wc_category_lookup;
ALTER TABLE wp_wc_customer_lookup RENAME TO rmevo_wc_customer_lookup;
ALTER TABLE wp_wc_download_log RENAME TO rmevo_wc_download_log;
ALTER TABLE wp_wc_order_addresses RENAME TO rmevo_wc_order_addresses;
ALTER TABLE wp_wc_order_operational_data RENAME TO rmevo_wc_order_operational_data;
ALTER TABLE wp_wc_order_product_lookup RENAME TO rmevo_wc_order_product_lookup;
ALTER TABLE wp_wc_order_stats RENAME TO rmevo_wc_order_stats;
ALTER TABLE wp_wc_orders RENAME TO rmevo_wc_orders;
ALTER TABLE wp_wc_orders_meta RENAME TO rmevo_wc_orders_meta;
ALTER TABLE wp_wc_product_attributes_lookup RENAME TO rmevo_wc_product_attributes_lookup;
ALTER TABLE wp_wc_product_download_directories RENAME TO rmevo_wc_product_download_directories;
ALTER TABLE wp_wc_product_meta_lookup RENAME TO rmevo_wc_product_meta_lookup;
ALTER TABLE wp_wc_reserved_stock RENAME TO rmevo_wc_reserved_stock;
ALTER TABLE wp_wc_tax_rate_classes RENAME TO rmevo_wc_tax_rate_classes;
ALTER TABLE wp_wc_webhooks RENAME TO rmevo_wc_webhooks;
ALTER TABLE wp_woocommerce_attribute_taxonomies RENAME TO rmevo_woocommerce_attribute_taxonomies;
ALTER TABLE wp_woocommerce_downloadable_product_permissions RENAME TO rmevo_woocommerce_downloadable_product_permissions;
ALTER TABLE wp_woocommerce_log RENAME TO rmevo_woocommerce_log;
ALTER TABLE wp_woocommerce_order_items RENAME TO rmevo_woocommerce_order_items;
ALTER TABLE wp_woocommerce_order_itemmeta RENAME TO rmevo_woocommerce_order_itemmeta;
ALTER TABLE wp_woocommerce_payment_tokenmeta RENAME TO rmevo_woocommerce_payment_tokenmeta;
ALTER TABLE wp_woocommerce_payment_tokens RENAME TO rmevo_woocommerce_payment_tokens;
ALTER TABLE wp_woocommerce_sessions RENAME TO rmevo_woocommerce_sessions;
ALTER TABLE wp_woocommerce_tax_rates RENAME TO rmevo_woocommerce_tax_rates;
ALTER TABLE wp_woocommerce_tax_rate_locations RENAME TO rmevo_woocommerce_tax_rate_locations;
ALTER TABLE wp_polylang RENAME TO rmevo_polylang;
ALTER TABLE wp_pll_languages RENAME TO rmevo_pll_languages;
ALTER TABLE wp_pll_translations RENAME TO rmevo_pll_translations;

SET FOREIGN_KEY_CHECKS=1;
SQL

echo ""
echo "✅ Table rename completed (errors for non-existent tables are expected)"
echo ""
echo "Verification:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) as rmevo_tables FROM information_schema.TABLES WHERE TABLE_SCHEMA='dbs15780797' AND TABLE_NAME LIKE 'rmevo_%';"

echo ""
echo "Admin user verification:"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT user_login, user_email FROM rmevo_users WHERE ID=1;"
