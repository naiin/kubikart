#!/bin/bash

# Full reset migration flow: local Lando -> Strato production
# 1) Reset local WP admin username/password
# 2) Export full local WordPress files + DB
# 3) On production: wipe app files + empty DB
# 4) Import files + DB
# 5) Normalize production config and verify key data

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="$SCRIPT_DIR/backups/full-reset"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
RUN_DIR="$WORK_DIR/$TIMESTAMP"
mkdir -p "$RUN_DIR"

# Requested admin credentials
ADMIN_USER="kubikart-woo"
ADMIN_PASS='D@Y%reGiZH6VHO'

# Production target
SSH_HOST="su1048058@5020672334.ssh.w2.strato.hosting"
REMOTE_APP_DIR="/home/www/STRATO-apps/wordpress_01/app"
REMOTE_TMP_DIR="${REMOTE_APP_DIR}/.migration_tmp_${TIMESTAMP}"
DB_HOST="database-5020678517.webspace-host.com"
DB_NAME="dbs15780797"
DB_USER="dbu1340143"
DB_PASS='wD42mzNk4CFsR8YjVIsyXV2G3EiZFAkg6iM'
SITE_URL="http://kubikart-werbetechnik.de"

LOCAL_DB_DUMP="$RUN_DIR/wordpress-full-${TIMESTAMP}.sql"
LOCAL_DB_DUMP_GZ="$LOCAL_DB_DUMP.gz"
LOCAL_WP_ARCHIVE="$RUN_DIR/wordpress-files-${TIMESTAMP}.tar.gz"
LOCAL_WP_CONFIG_BACKUP="$RUN_DIR/wp-config-local-${TIMESTAMP}.php"
LOG_FILE="$RUN_DIR/migration.log"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

fail() {
  log "ERROR: $*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

log "=== FULL RESET MIGRATION START ==="
log "Run directory: $RUN_DIR"

require_cmd lando
require_cmd ssh
require_cmd scp
require_cmd tar
require_cmd gzip
require_cmd rsync

SSH_OPTS=(
  -o BatchMode=yes
  -o ConnectTimeout=20
  -o StrictHostKeyChecking=accept-new
)
SSH_RSYNC_CMD="ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=accept-new"

log "Step 1/10: Validate and start Lando"
cd "$SCRIPT_DIR"
if ! lando info >/dev/null 2>&1; then
  log "Lando not running, starting it now"
  lando start >>"$LOG_FILE" 2>&1
fi

log "Step 2/10: Reset local admin credentials"
if lando ssh -c "cd /app/wordpress && wp user get ${ADMIN_USER} --field=ID" >>"$LOG_FILE" 2>&1; then
  lando ssh -c "cd /app/wordpress && wp user update ${ADMIN_USER} --user_pass='${ADMIN_PASS}' --skip-email" >>"$LOG_FILE" 2>&1
  lando ssh -c "cd /app/wordpress && wp user set-role ${ADMIN_USER} administrator" >>"$LOG_FILE" 2>&1
else
  lando ssh -c "cd /app/wordpress && wp user create ${ADMIN_USER} kubikart-woo@kubikart.local --role=administrator --user_pass='${ADMIN_PASS}' --porcelain" >>"$LOG_FILE" 2>&1
fi
lando ssh -c "cd /app/wordpress && wp user get ${ADMIN_USER} --fields=ID,user_login,user_email,roles --format=table" >>"$LOG_FILE" 2>&1

log "Step 3/10: Export full local database"
lando ssh -c "cd /app/wordpress && wp db export -" > "$LOCAL_DB_DUMP"
gzip -f "$LOCAL_DB_DUMP"

log "Step 4/10: Archive full local WordPress files"
cp "$SCRIPT_DIR/wordpress/wp-config.php" "$LOCAL_WP_CONFIG_BACKUP"
tar -czf "$LOCAL_WP_ARCHIVE" -C "$SCRIPT_DIR" wordpress

log "Local artifacts:"
log "- DB dump: $LOCAL_DB_DUMP_GZ"
log "- Files archive: $LOCAL_WP_ARCHIVE"

log "Step 5/10: Upload artifacts to production"
ssh -T "${SSH_OPTS[@]}" "$SSH_HOST" "mkdir -p '$REMOTE_APP_DIR' '$REMOTE_TMP_DIR'" >>"$LOG_FILE" 2>&1

rsync -az -e "$SSH_RSYNC_CMD" "$LOCAL_DB_DUMP_GZ" "$SSH_HOST:$REMOTE_TMP_DIR/" >>"$LOG_FILE" 2>&1
rsync -az -e "$SSH_RSYNC_CMD" "$LOCAL_WP_ARCHIVE" "$SSH_HOST:$REMOTE_TMP_DIR/" >>"$LOG_FILE" 2>&1

REMOTE_DB_GZ="$REMOTE_TMP_DIR/$(basename "$LOCAL_DB_DUMP_GZ")"
REMOTE_WP_TAR="$REMOTE_TMP_DIR/$(basename "$LOCAL_WP_ARCHIVE")"

ssh -T "${SSH_OPTS[@]}" "$SSH_HOST" "test -f '$REMOTE_DB_GZ' && test -f '$REMOTE_WP_TAR'" >>"$LOG_FILE" 2>&1 || fail "Upload verification failed on remote host"

log "Step 6/10: Hard reset production files and DB"
ssh -T "${SSH_OPTS[@]}" "$SSH_HOST" <<EOSSH >>"$LOG_FILE" 2>&1
set -euo pipefail

cd "$REMOTE_APP_DIR"

# Backup current wp-config before wipe
if [ -f wp-config.php ]; then
  cp wp-config.php "$REMOTE_TMP_DIR/wp-config.before-reset.php"
fi

# Remove everything from app directory except migration temp folder
find . -mindepth 1 -maxdepth 1 \
  ! -name "$(basename "$REMOTE_TMP_DIR")" \
  -exec rm -rf {} +

# Extract full WordPress files from local export
mkdir -p .
tar -xzf "$REMOTE_WP_TAR" --strip-components=1

# Empty and refill production DB on the remote host.
MYSQL_BASE=(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" --connect-timeout=10)

# Validate DB connectivity with a few attempts before destructive operations.
DB_READY=0
for _ in 1 2 3 4 5; do
  if "${MYSQL_BASE[@]}" -N -e "SELECT 1" >/dev/null 2>&1; then
    DB_READY=1
    break
  fi
done

if [ "$DB_READY" -ne 1 ]; then
  echo "ERROR: Cannot connect to production DB at $DB_HOST"
  exit 1
fi

TABLES="$("${MYSQL_BASE[@]}" -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$DB_NAME';" || true)"
if [ -n "$TABLES" ]; then
  for t in $TABLES; do
    "${MYSQL_BASE[@]}" -e "DROP TABLE IF EXISTS \`$t\`;"
  done
fi

gzip -dc "$REMOTE_DB_GZ" | "${MYSQL_BASE[@]}"
EOSSH

log "Step 7/10: Normalize production wp-config and URLs"
ssh -T "${SSH_OPTS[@]}" "$SSH_HOST" <<EOSSH >>"$LOG_FILE" 2>&1
set -euo pipefail

cd "$REMOTE_APP_DIR"

# Force production DB connection settings
sed -i "s|define( 'DB_NAME'.*|define( 'DB_NAME', '$DB_NAME' );|" wp-config.php
sed -i "s|define( 'DB_USER'.*|define( 'DB_USER', '$DB_USER' );|" wp-config.php
sed -i "s|define( 'DB_PASSWORD'.*|define( 'DB_PASSWORD', '$DB_PASS' );|" wp-config.php
sed -i "s|define( 'DB_HOST'.*|define( 'DB_HOST', '$DB_HOST' );|" wp-config.php

# Keep table prefix aligned with fresh import from local
sed -i "s|^\\\$table_prefix = .*|\\\$table_prefix = 'wp_';|" wp-config.php

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
UPDATE wp_options SET option_value='$SITE_URL' WHERE option_name IN ('siteurl','home');
UPDATE wp_users SET user_login='${ADMIN_USER}', user_pass=MD5('${ADMIN_PASS}') WHERE ID=1;
INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
VALUES (1, 'wp_capabilities', 'a:1:{s:13:\"administrator\";b:1;}')
ON DUPLICATE KEY UPDATE meta_value='a:1:{s:13:\"administrator\";b:1;}';
INSERT INTO wp_usermeta (user_id, meta_key, meta_value)
VALUES (1, 'wp_user_level', '10')
ON DUPLICATE KEY UPDATE meta_value='10';
"

# Ensure permissions are readable by web server
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
EOSSH

log "Step 8/10: Verify critical migration data"
ssh -T "${SSH_OPTS[@]}" "$SSH_HOST" <<EOSSH >>"$LOG_FILE" 2>&1
set -euo pipefail

cd "$REMOTE_APP_DIR"

echo "--- VERIFY: FILES ---"
echo -n "plugin_dirs="; find wp-content/plugins -mindepth 1 -maxdepth 1 -type d | wc -l
echo -n "mu_plugin_files="; find wp-content/mu-plugins -type f | wc -l
echo -n "upload_files="; find wp-content/uploads -type f | wc -l

# Optional plugin list via WP-CLI (if available)
if command -v /usr/local/bin/wp >/dev/null 2>&1; then
  echo "--- VERIFY: ACTIVE PLUGINS ---"
  /usr/local/bin/wp --path=. plugin list --status=active --field=name || true
fi

  echo "--- VERIFY: DATABASE COUNTS ---"
  mysql -N -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<'SQL'
SELECT CONCAT('products=', COUNT(*)) FROM wp_posts WHERE post_type='product';
SELECT CONCAT('attachments=', COUNT(*)) FROM wp_posts WHERE post_type='attachment';
SELECT CONCAT('reviews=', COUNT(*)) FROM wp_comments;
SELECT CONCAT('newsletter_subscribers=', COUNT(*)) FROM wp_posts WHERE post_type='newsletter_sub';
SQL

  echo "--- VERIFY: LOGIN USER ---"
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT ID,user_login,user_email FROM wp_users WHERE ID=1;
SELECT user_id,meta_key,meta_value FROM wp_usermeta WHERE user_id=1 AND meta_key IN ('wp_capabilities','wp_user_level');
SELECT option_name,option_value FROM wp_options WHERE option_name IN ('siteurl','home');
"
EOSSH

log "Step 9/10: Cleanup migration artifacts on production"
ssh -T "${SSH_OPTS[@]}" "$SSH_HOST" "rm -rf '$REMOTE_TMP_DIR'" >>"$LOG_FILE" 2>&1 || true

log "Step 10/10: Done"
log "Migration complete."
log "Login URL: $SITE_URL/wp-admin/"
log "Username: $ADMIN_USER"
log "Password: $ADMIN_PASS"
log "Full log: $LOG_FILE"

echo ""
echo "SUCCESS: Full reset migration completed"
echo "Log file: $LOG_FILE"
