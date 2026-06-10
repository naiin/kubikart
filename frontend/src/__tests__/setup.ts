// Global environment setup for all tests

// Set required env vars before any module is imported
process.env.NEXT_PUBLIC_WORDPRESS_URL = "https://test-wp.local";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
process.env.WP_APP_USER = "test-user";
process.env.WP_APP_PASSWORD = "test-password";
process.env.WC_API_URL = "https://test-wp.local/wp-json/wc/v3";
process.env.WC_CONSUMER_KEY = "ck_test";
process.env.WC_CONSUMER_SECRET = "cs_test";
process.env.FREE_SHIPPING_THRESHOLD = "50";
process.env.DHL_PRICE_KLEINPAKET = "3.99";
process.env.DHL_PRICE_PAKET = "5.49";
