#!/usr/bin/env bash
# =============================================================================
# wp-migrate-url.sh — WordPress URL migration helper
#
# Usage:
#   ./scripts/wp-migrate-url.sh <old-url> <new-url> [wp-path] [--live]
#
# Examples:
#   # Dry run (safe — shows what would change, changes nothing):
#   ./scripts/wp-migrate-url.sh \
#     https://kubikart-backend.lndo.site \
#     https://kubikart.de
#
#   # Live run (actually changes the database):
#   ./scripts/wp-migrate-url.sh \
#     https://kubikart-backend.lndo.site \
#     https://kubikart.de \
#     ./backend/wordpress \
#     --live
#
# What this does:
#   1. Runs wp search-replace (handles serialized PHP data correctly)
#   2. Flushes rewrite rules
#   3. Clears object cache
#   4. Exports the updated DB to a timestamped .sql.gz backup
#
# IMPORTANT:
#   - Always do a dry run first
#   - Backup your database BEFORE a live run
#   - Raw SQL search-replace breaks serialized data — always use WP-CLI
# =============================================================================

set -euo pipefail

# ─── Arguments ───────────────────────────────────────────────────────────────
OLD_URL="${1:-}"
NEW_URL="${2:-}"
WP_PATH="${3:-./backend/wordpress}"
LIVE_FLAG="${4:-}"

if [[ -z "$OLD_URL" || -z "$NEW_URL" ]]; then
  echo "Usage: $0 <old-url> <new-url> [wp-path] [--live]"
  echo ""
  echo "Example (dry run):"
  echo "  $0 https://kubikart-backend.lndo.site https://kubikart.de"
  echo ""
  echo "Example (live — actually changes DB):"
  echo "  $0 https://kubikart-backend.lndo.site https://kubikart.de ./backend/wordpress --live"
  exit 1
fi

# Require WP-CLI
if ! command -v wp &>/dev/null; then
  echo "❌ WP-CLI not found. Install it: https://wp-cli.org/"
  exit 1
fi

echo "======================================================="
echo "  Kubikart — WordPress URL Migration"
echo "======================================================="
echo "  Old URL : $OLD_URL"
echo "  New URL : $NEW_URL"
echo "  WP Path : $WP_PATH"
echo ""

# ─── Dry run always first ─────────────────────────────────────────────────────
echo "🔍 Running dry run (no changes made)..."
wp search-replace "$OLD_URL" "$NEW_URL" \
  --all-tables \
  --precise \
  --dry-run \
  --path="$WP_PATH"

if [[ "$LIVE_FLAG" != "--live" ]]; then
  echo ""
  echo "ℹ️  Dry run complete. No changes were made."
  echo "   To apply changes, re-run with --live as the 4th argument."
  exit 0
fi

# ─── Live run ────────────────────────────────────────────────────────────────
echo ""
echo "⚠️  LIVE RUN — this will modify the database!"
read -r -p "   Are you sure? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# Backup first
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backup_before_migrate_${TIMESTAMP}.sql.gz"
echo ""
echo "💾 Creating database backup → $BACKUP_FILE"
wp db export - --path="$WP_PATH" | gzip >"$BACKUP_FILE"
echo "   Backup saved: $BACKUP_FILE"

# Run the actual search-replace
echo ""
echo "🔄 Running search-replace (live)..."
wp search-replace "$OLD_URL" "$NEW_URL" \
  --all-tables \
  --precise \
  --path="$WP_PATH"

# Flush rewrite rules (regenerates .htaccess permalink structure)
echo ""
echo "🔄 Flushing rewrite rules..."
wp rewrite flush --path="$WP_PATH"

# Clear object cache (Redis/Memcached or file cache)
echo "🔄 Flushing object cache..."
wp cache flush --path="$WP_PATH" 2>/dev/null || true

# Verify
echo ""
echo "✅ Migration complete!"
echo ""
echo "   Verify by checking:"
wp option get siteurl --path="$WP_PATH"
wp option get home --path="$WP_PATH"
echo ""
echo "   Next steps:"
echo "   1. Update your .env.local NEXT_PUBLIC_WORDPRESS_URL to: $NEW_URL"
echo "   2. Update WooCommerce > Settings > General > Store Address URL"
echo "   3. Test the frontend"
