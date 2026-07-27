#!/bin/bash

# Restart migration without Lando (uses recovery backups).
# - Imports SQL dump from backend/recovery
# - Uploads/extracts wp-content archive
# - Forces admin credentials requested by user

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RECOVERY_DIR="$SCRIPT_DIR/recovery"

ADMIN_USER="kubikart-woo"
ADMIN_PASS="D@Y%reGiZH6VHO"

SSH_HOST="su1048058@5020672334.ssh.w2.strato.hosting"
REMOTE_APP_DIR="STRATO-apps/wordpress_01/app"
DB_HOST="database-5020678517.webspace-host.com"
DB_NAME="dbs15780797"
DB_USER="dbu1340143"
DB_PASS="wD42mzNk4CFsR8YjVIsyXV2G3EiZFAkg6iM"
SITE_URL="http://kubikart-werbetechnik.de"
SSH_OPTS="-o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"

SQL_DUMP="$RECOVERY_DIR/wordpress-current-2026-06-05.sql"
CONTENT_ARCHIVE="$RECOVERY_DIR/wp-content-current-2026-06-05.tar.gz"

if [ ! -f "$SQL_DUMP" ]; then
  echo "ERROR: SQL dump not found: $SQL_DUMP"
  exit 1
fi

if [ ! -f "$CONTENT_ARCHIVE" ]; then
  echo "ERROR: wp-content archive not found: $CONTENT_ARCHIVE"
  exit 1
fi

echo "== Uploading migration archives to Strato =="
scp $SSH_OPTS "$SQL_DUMP" "$CONTENT_ARCHIVE" "$SSH_HOST:/tmp/"

echo "== Running remote restart migration =="
ssh $SSH_OPTS -T "$SSH_HOST" <<EOSSH
set -euo pipefail

cd "$REMOTE_APP_DIR"

cp wp-config.php wp-config.php.backup.restart.$(date +%Y%m%d-%H%M%S)

# Replace wp-content with backup snapshot
rm -rf wp-content
tar -xzf /tmp/$(basename "$CONTENT_ARCHIVE")

# Clean import into target DB
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SET FOREIGN_KEY_CHECKS=0;"

# Drop existing WordPress tables (both possible prefixes)
TABLES=\$(mysql -N -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='$DB_NAME' AND (table_name LIKE 'wp_%' OR table_name LIKE 'rmevo_%');")

if [ -n "\$TABLES" ]; then
  for t in \$TABLES; do
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DROP TABLE IF EXISTS \`\$t\`;"
  done
fi

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /tmp/$(basename "$SQL_DUMP")

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SET FOREIGN_KEY_CHECKS=1;"

# Normalize WordPress config to imported dump prefix (wp_)
sed -i "s/^\\\$table_prefix = .*/\\\$table_prefix = 'wp_';/" wp-config.php

# Normalize site URLs
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
UPDATE wp_options
SET option_value='$SITE_URL'
WHERE option_name IN ('siteurl', 'home');
"

# Enforce requested admin credentials and role
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
UPDATE wp_users
SET user_login='${ADMIN_USER}', user_pass=MD5('${ADMIN_PASS}')
WHERE ID=1;
INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
VALUES (1, 'wp_capabilities', 'a:1:{s:13:\"administrator\";b:1;}')
ON DUPLICATE KEY UPDATE meta_value='a:1:{s:13:\"administrator\";b:1;}';
INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
VALUES (1, 'wp_user_level', '10')
ON DUPLICATE KEY UPDATE meta_value='10';
"

# Verify critical values
echo "-- Verification --"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SHOW TABLES LIKE 'wp_users';
SHOW TABLES LIKE 'wp_usermeta';
SELECT option_name, option_value FROM wp_options WHERE option_name IN ('siteurl','home');
SELECT ID, user_login, user_email FROM wp_users WHERE ID=1;
SELECT user_id, meta_key, meta_value FROM wp_usermeta WHERE user_id=1 AND meta_key IN ('wp_capabilities','wp_user_level');
"
EOSSH

echo "== Cleaning temporary upload files on Strato =="
ssh $SSH_OPTS -T "$SSH_HOST" "rm -f /tmp/$(basename "$SQL_DUMP") /tmp/$(basename "$CONTENT_ARCHIVE")"

echo "Done. Try wp-admin login now:"
echo "URL: $SITE_URL/wp-admin/"
echo "User: $ADMIN_USER"
echo "Pass: $ADMIN_PASS"
