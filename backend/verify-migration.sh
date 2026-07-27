#!/bin/bash

# Post-Migration Verification Script
# Run this on Strato after importing database and uploading files

echo "🔍 Kubikart Post-Migration Verification"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper function
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
  fi
}

# 1. Check WordPress installation
echo "📋 Checking WordPress installation..."
if [ -f "wp-config.php" ]; then
  check "wp-config.php exists"
  
  # Check database settings
  grep -q "define('DB_NAME'" wp-config.php
  check "Database name configured"
  
  grep -q "define('DB_USER'" wp-config.php
  check "Database user configured"
else
  echo -e "${RED}✗${NC} wp-config.php not found"
  ((CHECKS_FAILED++))
fi
echo ""

# 2. Check directory structure
echo "📁 Checking directory structure..."
if [ -d "wp-content/uploads" ]; then
  check "wp-content/uploads folder exists"
  COUNT=$(find wp-content/uploads -type f 2>/dev/null | wc -l)
  echo "  └─ Contains $COUNT files"
else
  echo -e "${RED}✗${NC} wp-content/uploads folder missing"
  ((CHECKS_FAILED++))
fi

if [ -d "wp-content/plugins" ]; then
  check "wp-content/plugins folder exists"
  PLUGINS=$(ls -1 wp-content/plugins | grep -v "^\." | wc -l)
  echo "  └─ Contains $PLUGINS plugins"
else
  echo -e "${RED}✗${NC} wp-content/plugins folder missing"
  ((CHECKS_FAILED++))
fi
echo ""

# 3. Check permissions
echo "🔐 Checking folder permissions..."
if [ -w "wp-content/uploads" ]; then
  check "wp-content/uploads is writable"
else
  echo -e "${YELLOW}⚠${NC} wp-content/uploads not writable (may need chmod 775)"
  ((CHECKS_FAILED++))
fi

if [ -w "wp-content/plugins" ]; then
  check "wp-content/plugins is writable"
else
  echo -e "${YELLOW}⚠${NC} wp-content/plugins not writable"
  ((CHECKS_FAILED++))
fi
echo ""

# 4. Check database connectivity (if WP-CLI available)
echo "🗄️  Checking database..."
if command -v wp &> /dev/null; then
  wp db check > /dev/null 2>&1
  check "Database connection works"
  
  # Count posts
  POST_COUNT=$(wp post list --post_type=post --format=count 2>/dev/null || echo "0")
  echo "  └─ Posts: $POST_COUNT"
  
  # Count products (WooCommerce)
  PRODUCT_COUNT=$(wp post list --post_type=product --format=count 2>/dev/null || echo "0")
  echo "  └─ Products: $PRODUCT_COUNT"
  
  # Count orders (WooCommerce)
  ORDER_COUNT=$(wp post list --post_type=shop_order --format=count 2>/dev/null || echo "0")
  echo "  └─ Orders: $ORDER_COUNT"
  
  # Count users
  USER_COUNT=$(wp user list --format=count 2>/dev/null || echo "0")
  echo "  └─ Users: $USER_COUNT"
else
  echo -e "${YELLOW}⚠${NC} WP-CLI not installed (cannot verify database)"
  ((CHECKS_FAILED++))
fi
echo ""

# 5. Check plugins
echo "🔌 Checking installed plugins..."
if command -v wp &> /dev/null; then
  # Check for custom plugins
  wp plugin list --status=active 2>/dev/null | grep -q "kubikart-newsletter"
  if [ $? -eq 0 ]; then
    check "kubikart-newsletter plugin is active"
  else
    echo -e "${YELLOW}⚠${NC} kubikart-newsletter not active"
  fi
  
  wp plugin list --status=active 2>/dev/null | grep -q "kubikart-security"
  if [ $? -eq 0 ]; then
    check "kubikart-security plugin is active"
  else
    echo -e "${YELLOW}⚠${NC} kubikart-security not active"
  fi
  
  wp plugin list --status=active 2>/dev/null | grep -q "woocommerce"
  if [ $? -eq 0 ]; then
    check "WooCommerce plugin is active"
  else
    echo -e "${RED}✗${NC} WooCommerce plugin not active"
    ((CHECKS_FAILED++))
  fi
else
  echo -e "${YELLOW}⚠${NC} Cannot verify plugins without WP-CLI"
fi
echo ""

# 6. Check URLs
echo "🌐 Checking site configuration..."
if command -v wp &> /dev/null; then
  SITE_URL=$(wp option get siteurl 2>/dev/null)
  if [ ! -z "$SITE_URL" ]; then
    echo "  └─ Site URL: $SITE_URL"
    check "Site URL is configured"
  else
    echo -e "${RED}✗${NC} Site URL not found"
    ((CHECKS_FAILED++))
  fi
  
  HOME_URL=$(wp option get home 2>/dev/null)
  if [ ! -z "$HOME_URL" ]; then
    echo "  └─ Home URL: $HOME_URL"
    check "Home URL is configured"
  else
    echo -e "${RED}✗${NC} Home URL not found"
    ((CHECKS_FAILED++))
  fi
fi
echo ""

# 7. Check media files
echo "🖼️  Checking media files..."
if [ -d "wp-content/uploads" ]; then
  IMAGE_COUNT=$(find wp-content/uploads -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" \) 2>/dev/null | wc -l)
  if [ $IMAGE_COUNT -gt 0 ]; then
    echo "  └─ Image files: $IMAGE_COUNT"
    check "Media files are present"
  else
    echo -e "${YELLOW}⚠${NC} No image files found in uploads"
  fi
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Verification Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Migration appears successful.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Test WordPress admin: https://your-domain.de/wp-admin"
  echo "2. Verify products in WooCommerce → Products"
  echo "3. Check orders in WooCommerce → Orders"
  echo "4. Test REST API: https://your-domain.de/wp-json/wc/v3/products"
  echo "5. Update frontend .env.local with new API URLs"
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed. Review items above and take corrective action.${NC}"
  echo ""
  echo "Common issues:"
  echo "- Permissions: chmod -R 775 wp-content/"
  echo "- Database: Verify wp-config.php credentials"
  echo "- URLs: Update siteurl and home via WordPress admin"
  exit 1
fi
