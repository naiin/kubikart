#!/bin/bash

# Fix WordPress table prefix mismatch on Strato

DB_HOST="database-5020678517.webspace-host.com"
DB_NAME="dbs15780797"
DB_USER="dbu1340143"
DB_PASS="wD42mzNk4CFsR8YjVIsyXV2G3EiZFAkg6iM"
WP_CONFIG="/root/STRATO-apps/wordpress_01/app/wp-config.php"

echo "🔍 Checking table prefix situation..."
echo "═════════════════════════════════════════════"

# Count tables by prefix
WP_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME LIKE 'wp_%';" 2>/dev/null || echo "0")

RMEVO_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME LIKE 'rmevo_%';" 2>/dev/null || echo "0")

echo "wp_* tables found: $WP_COUNT"
echo "rmevo_* tables found: $RMEVO_COUNT"
echo ""

# Check current wp-config.php setting
CURRENT_PREFIX=$(grep "table_prefix" "$WP_CONFIG" | grep -oP "'\K[^']*")
echo "wp-config.php table_prefix: $CURRENT_PREFIX"
echo ""

# Fix logic
if [ "$RMEVO_COUNT" -gt 0 ] && [ "$WP_COUNT" -eq 0 ]; then
    echo "❌ PROBLEM: Tables have rmevo_* prefix but wp-config.php looks for wp_*"
    echo ""
    echo "SOLUTION: Update wp-config.php to use rmevo_* prefix"
    sed -i "s/\$table_prefix = 'wp_';/\$table_prefix = 'rmevo_';/" "$WP_CONFIG"
    echo "✅ Changed table_prefix to rmevo_"
    echo ""
    echo "New setting:"
    grep "table_prefix" "$WP_CONFIG"
    
elif [ "$WP_COUNT" -eq 0 ] && [ "$RMEVO_COUNT" -eq 0 ]; then
    echo "❌ CRITICAL: No tables found in database!"
    echo ""
    echo "This means either:"
    echo "  1. Database is empty"
    echo "  2. Connection failed"
    echo "  3. Wrong database selected"
    echo ""
    echo "Check your database credentials in wp-config.php"
    
elif [ "$WP_COUNT" -gt 0 ]; then
    echo "✅ wp_* tables found - wp-config.php is correctly set"
    echo "Testing WordPress admin access..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT user_login FROM wp_users WHERE ID=1;" 2>/dev/null || echo "Cannot connect to database"
fi

echo ""
echo "Done!"
