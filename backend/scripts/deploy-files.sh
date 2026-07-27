#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

: "${DEPLOY_SSH_HOST:?DEPLOY_SSH_HOST is required}"
: "${DEPLOY_SSH_USER:?DEPLOY_SSH_USER is required}"

REMOTE_APP_DIR="${DEPLOY_REMOTE_APP_DIR:-/home/www/STRATO-apps/wordpress_01/app}"
EXCLUDES_FILE="$REPO_ROOT/backend/scripts/rsync-excludes.txt"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required" >&2
  exit 1
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "ssh is required" >&2
  exit 1
fi

if [ ! -f "$EXCLUDES_FILE" ]; then
  echo "Missing excludes file: $EXCLUDES_FILE" >&2
  exit 1
fi

echo "Ensuring remote app directory exists..."
ssh "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}" "mkdir -p '$REMOTE_APP_DIR'"

echo "Deploying backend files with rsync..."
rsync -az --delete \
  --exclude-from="$EXCLUDES_FILE" \
  "$REPO_ROOT/backend/wordpress/" \
  "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}:$REMOTE_APP_DIR/"

echo "File deploy completed: $REMOTE_APP_DIR"
