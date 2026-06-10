# Running Backend Tests

PHP tests use **PHPUnit** with WordPress function stubs (no live WP install needed).

## Setup (once)

```bash
# From project root — runs inside Lando's PHP container
cd backend
lando php composer install
```

Or if you have Composer locally:

```bash
cd backend
composer install
```

## Run Tests

```bash
# Inside Lando
lando ssh -c "cd /app && php vendor/bin/phpunit"

# Or via lando php
cd backend
lando php vendor/bin/phpunit

# With coverage (requires Xdebug or pcov)
lando php vendor/bin/phpunit --coverage-text
```

## Test Files

| Test File | Plugin | What It Covers |
|---|---|---|
| `KubikartSecurityTest.php` | `kubikart-security.php` | Password reset endpoints, email HTML, brute-force protection |
| `KubikartNewsletterTest.php` | `kubikart-newsletter.php` | CPT registration, admin columns |
| `KubikartRatingSyncTest.php` | `kubikart-rating-sync.php` | Rating avg calculation, edge cases |
| `KubikartPaymentGatewayTest.php` | `kubikart-payment-gateway.php` | Stripe/PayPal refund error paths |

## Notes

- WordPress functions are stubbed in `tests/bootstrap.php` — no WP install required.
- Use `wp_reset_mocks()` in `setUp()` to reset state between tests.
- Override WP behavior with `$GLOBALS['_wp_mock_{fn}']` callable.
