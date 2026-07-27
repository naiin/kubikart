#!/bin/bash

SSH_HOST="su1048058@5020672334.ssh.w2.strato.hosting"

# Test basic SSH
echo "Testing SSH connectivity..."
if ssh "$SSH_HOST" 'pwd' 2>&1; then
  echo "✓ SSH works"
else
  echo "✗ SSH failed"
  exit 1
fi

# Create a test file
TEST_FILE="/tmp/scp-test-$RANDOM.txt"
echo "Test content for SCP" > "$TEST_FILE"
echo "Created test file: $TEST_FILE"

# Try SCP to the app directory
echo "Testing SCP upload to app directory..."
if scp "$TEST_FILE" "$SSH_HOST:STRATO-apps/wordpress_01/app/test-scp.txt" 2>&1; then
  echo "✓ SCP upload succeeded"
  # Verify file exists on remote
  if ssh "$SSH_HOST" "test -f STRATO-apps/wordpress_01/app/test-scp.txt && echo ✓ File verified on remote" 2>&1; then
    echo "✓ File exists on remote"
  else
    echo "✗ File not found on remote after upload"
  fi
else
  echo "✗ SCP upload failed"
fi

# Clean up
rm "$TEST_FILE"
ssh "$SSH_HOST" "rm -f STRATO-apps/wordpress_01/app/test-scp.txt" 2>&1 || true
