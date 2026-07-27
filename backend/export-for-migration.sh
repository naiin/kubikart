#!/bin/bash

# Kubikart WordPress Migration Helper
# Exports database, plugins, and media from Lando for migration to Strato.
# Run from: backend/

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

echo "🚀 Kubikart WordPress Migration Export"
echo "========================================"
echo ""

# Create backups directory
mkdir -p "$BACKUP_DIR"
echo "✓ Backup directory: $BACKUP_DIR"

# Check if Lando is running
if ! lando info > /dev/null 2>&1; then
  echo "❌ Lando is not running. Please run 'lando start' first."
  exit 1
fi
echo "✓ Lando is running"

# Extract Lando database credentials
LANDO_INFO=$(lando info 2>/dev/null | grep -A 20 "database")
DB_USER=$(echo "$LANDO_INFO" | grep -i "user:" | head -1 | awk '{print $NF}')
DB_PASSWORD=$(echo "$LANDO_INFO" | grep -i "password:" | head -1 | awk '{print $NF}')
DB_NAME=$(echo "$LANDO_INFO" | grep -i "name:" | head -1 | awk '{print $NF}')
DB_PORT=$(echo "$LANDO_INFO" | grep -i "port:" | head -1 | awk '{print $NF}')

if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo "❌ Could not extract Lando database credentials."
  echo "   Please ensure Lando is running: lando start"
  exit 1
fi

echo "✓ Database credentials extracted"
echo "  - User: $DB_USER"
echo "  - Database: $DB_NAME"
echo "  - Port: $DB_PORT"
echo ""

# 1. Export database
echo "📦 Exporting database..."
BACKUP_FILE="$BACKUP_DIR/kubikart-db-$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_DIR/kubikart-db-$TIMESTAMP.sql.gz"

mysqldump \
  -h 127.0.0.1 \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --port="$DB_PORT" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "$DB_NAME" > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"
echo "✓ Database exported: $BACKUP_FILE_GZ"
echo "  Size: $(du -h "$BACKUP_FILE_GZ" | cut -f1)"
echo ""

# 2. Export uploads folder
echo "📦 Exporting uploads folder..."
UPLOADS_BACKUP="$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"
if [ -d "$SCRIPT_DIR/wordpress/wp-content/uploads" ]; then
  cd "$SCRIPT_DIR/wordpress/wp-content"
  tar -czf "$UPLOADS_BACKUP" uploads/ 2>/dev/null
  cd "$SCRIPT_DIR"
  echo "✓ Uploads exported: $UPLOADS_BACKUP"
  echo "  Size: $(du -h "$UPLOADS_BACKUP" | cut -f1)"
else
  echo "⚠ No uploads folder found. Skipping."
fi
echo ""

# 3. Export plugins folder
echo "📦 Exporting plugins folder..."
PLUGINS_BACKUP="$BACKUP_DIR/plugins-$TIMESTAMP.tar.gz"
if [ -d "$SCRIPT_DIR/wordpress/wp-content/plugins" ]; then
  cd "$SCRIPT_DIR/wordpress/wp-content"
  tar -czf "$PLUGINS_BACKUP" plugins/ 2>/dev/null
  cd "$SCRIPT_DIR"
  echo "✓ Plugins exported: $PLUGINS_BACKUP"
  echo "  Size: $(du -h "$PLUGINS_BACKUP" | cut -f1)"
  
  # List key plugins
  echo ""
  echo "  Included plugins:"
  ls -1 "$SCRIPT_DIR/wordpress/wp-content/plugins" | while read plugin; do
    if [ "$plugin" != "." ] && [ "$plugin" != ".." ]; then
      echo "    - $plugin"
    fi
  done
else
  echo "⚠ No plugins folder found. Skipping."
fi
echo ""

# 4. Export wp-config.php settings (reference only)
echo "📋 Backing up wp-config.php reference..."
CONFIG_BACKUP="$BACKUP_DIR/wp-config-$TIMESTAMP.txt"
cp "$SCRIPT_DIR/wordpress/wp-config.php" "$CONFIG_BACKUP"
echo "✓ Reference saved: $CONFIG_BACKUP"
echo ""

# Summary
echo "=========================================="
echo "✅ Migration export complete!"
echo ""
echo "Backup files ready for upload to Strato:"
ls -lh "$BACKUP_DIR"/kubikart-db-$TIMESTAMP.sql.gz
ls -lh "$BACKUP_DIR"/uploads-$TIMESTAMP.tar.gz 2>/dev/null || echo "(no uploads)"
ls -lh "$BACKUP_DIR"/plugins-$TIMESTAMP.tar.gz 2>/dev/null || echo "(no plugins)"
echo ""
echo "📝 Next steps:"
echo "1. Log in to Strato control panel"
echo "2. Create database (name: kubikart_prod, user: kubikart_user)"
echo "3. Import database via phpMyAdmin or SSH"
echo "4. Upload plugins and media folders"
echo "5. Update wp-config.php with new database credentials"
echo "6. Update frontend/.env.local with new WordPress URLs"
echo ""
echo "For detailed instructions, see: docs/MIGRATION-STRATO.md"
