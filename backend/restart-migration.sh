#!/bin/bash

# Restart migration from local Lando to Strato.
# 1) Reset local admin credentials
# 2) Export fresh DB/plugins/uploads
# 3) Upload and import to Strato
# 4) Apply same admin credentials on production

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"

# Required by user request
ADMIN_USER="kubikart-woo"
ADMIN_PASS="D@Y%reGiZH6VHO"

# Strato target
SSH_HOST="su1048058@5020672334.ssh.w2.strato.hosting"
REMOTE_APP_DIR="STRATO-apps/wordpress_01/app"
DB_HOST="database-5020678517.webspace-host.com"
DB_NAME="dbs15780797"
DB_USER="dbu1340143"
DB_PASS="wD42mzNk4CFsR8YjVIsyXV2G3EiZFAkg6iM"

mkdir -p "$BACKUP_DIR"

echo "== Step 1: Ensure Lando is running =="
if ! command -v lando >/dev/null 2>&1; then
  echo "ERROR: lando is not installed or not in PATH"
  exit 1
fi

if ! lando info >/dev/null 2>&1; then
  lando start
fi

echo "== Step 2: Reset local admin credentials in Lando =="
# Find user ID 1 if present, otherwise use first administrator.
if lando wp user get 1 --field=ID >/dev/null 2>&1; then
  LOCAL_ADMIN_ID=1
else
  LOCAL_ADMIN_ID="$(lando wp user list --role=administrator --field=ID --format=ids | awk '{print $1}')"
fi

if [ -z "${LOCAL_ADMIN_ID:-}" ]; then
  echo "ERROR: no administrator user found in local WordPress"
  exit 1
fi

lando wp user update "$LOCAL_ADMIN_ID" --user_login="$ADMIN_USER" --user_pass="$ADMIN_PASS"
lando wp user set-role "$LOCAL_ADMIN_ID" administrator

echo "Local admin updated: id=$LOCAL_ADMIN_ID user=$ADMIN_USER"

# Quick local verification
lando wp user get "$LOCAL_ADMIN_ID" --fields=ID,user_login,roles,user_email --format=table

echo "== Step 3: Export fresh migration files =="
"$SCRIPT_DIR/export-for-migration.sh"

LATEST_DB="$(ls -1t "$BACKUP_DIR"/kubikart-db-*.sql.gz | head -1)"
LATEST_PLUGINS="$(ls -1t "$BACKUP_DIR"/plugins-*.tar.gz | head -1)"
LATEST_UPLOADS="$(ls -1t "$BACKUP_DIR"/uploads-*.tar.gz | head -1)"

if [ -z "${LATEST_DB:-}" ] || [ -z "${LATEST_PLUGINS:-}" ] || [ -z "${LATEST_UPLOADS:-}" ]; then
  echo "ERROR: export files not found"
  exit 1
fi

echo "== Step 4: Upload files to Strato =="
scp "$LATEST_DB" "$LATEST_PLUGINS" "$LATEST_UPLOADS" "$SSH_HOST:/tmp/"

echo "== Step 5: Remote import and extraction =="
ssh -T "$SSH_HOST" <<EOSSH
set -euo pipefail

cd "$REMOTE_APP_DIR"

# Keep backup of wp-config before changes.
cp wp-config.php "wp-config.php.backup.$TIMESTAMP"

# Extract files
mkdir -p wp-content
rm -rf wp-content/plugins wp-content/uploads
tar -xzf /tmp/$(basename "$LATEST_PLUGINS") -C wp-content/
tar -xzf /tmp/$(basename "$LATEST_UPLOADS") -C wp-content/

# Import DB fresh
gzip -dc /tmp/$(basename "$LATEST_DB") | mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"

# Keep prefix aligned with imported local database tables (wp_)
sed -i "s/^\\\$table_prefix = .*/\\\$table_prefix = 'wp_';/" wp-config.php

# Ensure DB credentials are set correctly
sed -i "s/define( 'DB_NAME'.*/define( 'DB_NAME', '$DB_NAME' );/" wp-config.php
sed -i "s/define( 'DB_USER'.*/define( 'DB_USER', '$DB_USER' );/" wp-config.php
sed -i "s/define( 'DB_PASSWORD'.*/define( 'DB_PASSWORD', '$DB_PASS' );/" wp-config.php
sed -i "s/define( 'DB_HOST'.*/define( 'DB_HOST', '$DB_HOST' );/" wp-config.php

# Update site URL
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
UPDATE wp_options SET option_value='http://kubikart-werbetechnik.de' WHERE option_name IN ('siteurl','home');
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

# Lightweight verification
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT option_name, option_value FROM wp_options WHERE option_name IN ('siteurl','home');
SELECT ID, user_login, user_email FROM wp_users WHERE ID=1;
SELECT user_id, meta_key, meta_value FROM wp_usermeta WHERE user_id=1 AND meta_key IN ('wp_capabilities','wp_user_level');
"
EOSSH

echo "== Step 6: Cleanup uploaded archives on Strato =="
ssh -T "$SSH_HOST" "rm -f /tmp/$(basename "$LATEST_DB") /tmp/$(basename "$LATEST_PLUGINS") /tmp/$(basename "$LATEST_UPLOADS")"

echo ""
echo "Migration restart complete."
echo "Try login: http://kubikart-werbetechnik.de/wp-admin/"
echo "Username: $ADMIN_USER"
echo "Password: $ADMIN_PASS"
