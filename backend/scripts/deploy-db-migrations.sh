#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$REPO_ROOT/backend/db/migrations}"

: "${DB_HOST:?DB_HOST is required}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASS:?DB_PASS is required}"

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client is required" >&2
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No migrations directory found at $MIGRATIONS_DIR; nothing to run."
  exit 0
fi

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)

if [ ${#files[@]} -eq 0 ]; then
  echo "No SQL migrations found in $MIGRATIONS_DIR"
  exit 0
fi

for f in "${files[@]}"; do
  echo "Applying migration: $(basename "$f")"
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$f"
done

echo "Database migrations completed."
