<?php

use PHPUnit\Framework\TestCase;

/**
 * Tests for kubikart-security.php
 *
 * Covers:
 * - REST route registration for forgot/reset-password
 * - forgot-password: always returns 200, calls wp_mail, no enumeration
 * - reset-password: validates key length, calls check_password_reset_key
 * - kubikart_reset_email_html: HTML content and structure
 * - Login brute-force protection (transient-based)
 */
class KubikartSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        $GLOBALS['_wp_rest_routes'] = [];
        // Load plugin (hooks register but don't run yet)
        require_once __DIR__ . '/../../wordpress/wp-content/plugins/kubikart-security/kubikart-security.php';
        // Run rest_api_init to register REST routes
        do_action('rest_api_init');
    }

    // ── REST route registration ───────────────────────────────────────────────

    public function test_forgot_password_route_is_registered(): void
    {
        $this->assertArrayHasKey(
            'kubikart/v1/forgot-password',
            $GLOBALS['_wp_rest_routes'],
            'forgot-password REST route should be registered'
        );
    }

    public function test_reset_password_route_is_registered(): void
    {
        $this->assertArrayHasKey(
            'kubikart/v1/reset-password',
            $GLOBALS['_wp_rest_routes'],
            'reset-password REST route should be registered'
        );
    }

    // ── forgot-password callback ──────────────────────────────────────────────

    public function test_forgot_password_returns_200_for_valid_email(): void
    {
        $mockUser       = $this->createMockUser(1, 'max@test.de', 'Max');
        $GLOBALS['_wp_mock_get_user_by'] = fn($field, $value) => $value === 'max@test.de' ? $mockUser : null;
        $GLOBALS['_wp_mock_get_password_reset_key'] = fn($user) => 'valid-reset-key';

        $mailCalled = false;
        $GLOBALS['_wp_mock_wp_mail'] = function ($to, $subject, $body) use (&$mailCalled) {
            $mailCalled = true;
            return true;
        };

        $callback = $this->getRouteCallback('kubikart/v1/forgot-password');
        $req      = new WP_REST_Request(['email' => 'max@test.de', 'locale' => 'de', 'site_url' => 'https://kubikart.de']);
        $response = $callback($req);

        $this->assertInstanceOf(WP_REST_Response::class, $response);
        $this->assertSame(200, $response->get_status());
        $this->assertTrue($response->get_data()['success']);
        $this->assertTrue($mailCalled, 'wp_mail should have been called');
    }

    public function test_forgot_password_returns_200_for_nonexistent_email(): void
    {
        // No user found — must still return 200 (no enumeration)
        $GLOBALS['_wp_mock_get_user_by'] = fn() => null;
        $mailCalled = false;
        $GLOBALS['_wp_mock_wp_mail'] = function () use (&$mailCalled) { $mailCalled = true; return true; };

        $callback = $this->getRouteCallback('kubikart/v1/forgot-password');
        $req      = new WP_REST_Request(['email' => 'nobody@test.de', 'locale' => 'de']);
        $response = $callback($req);

        $this->assertSame(200, $response->get_status());
        $this->assertFalse($mailCalled, 'wp_mail must NOT be called for non-existent user');
    }

    public function test_forgot_password_reset_link_uses_correct_locale(): void
    {
        $mockUser = $this->createMockUser(1, 'user@test.de', 'Anna');
        $GLOBALS['_wp_mock_get_user_by'] = fn() => $mockUser;
        $GLOBALS['_wp_mock_get_password_reset_key'] = fn() => 'key-xyz';

        $capturedBody = '';
        $GLOBALS['_wp_mock_wp_mail'] = function ($to, $subject, $body) use (&$capturedBody) {
            $capturedBody = $body;
            return true;
        };

        $callback = $this->getRouteCallback('kubikart/v1/forgot-password');
        $req      = new WP_REST_Request([
            'email'    => 'user@test.de',
            'locale'   => 'en',
            'site_url' => 'https://kubikart.de',
        ]);
        $callback($req);

        $this->assertStringContainsString('/en/account/reset-password', $capturedBody);
        $this->assertStringContainsString('key-xyz', $capturedBody);
    }

    // ── reset-password callback ───────────────────────────────────────────────

    public function test_reset_password_returns_error_for_short_password(): void
    {
        $GLOBALS['_wp_mock_logged_in'] = true;

        $callback = $this->getRouteCallback('kubikart/v1/reset-password');
        $req      = new WP_REST_Request(['key' => 'k', 'login' => 'user', 'password' => 'short']);
        $response = $callback($req);

        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertSame('password_too_short', $response->get_error_code());
    }

    public function test_reset_password_returns_error_for_unknown_user(): void
    {
        $GLOBALS['_wp_mock_logged_in'] = true;
        $GLOBALS['_wp_mock_get_user_by'] = fn() => null;

        $callback = $this->getRouteCallback('kubikart/v1/reset-password');
        $req      = new WP_REST_Request(['key' => 'valid-key', 'login' => 'nobody', 'password' => 'newpass123']);
        $response = $callback($req);

        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertSame('invalid_key', $response->get_error_code());
    }

    public function test_reset_password_returns_error_for_expired_key(): void
    {
        $GLOBALS['_wp_mock_logged_in'] = true;
        $GLOBALS['_wp_mock_get_user_by'] = fn() => $this->createMockUser(1, 'u@t.de', 'U');
        $GLOBALS['_wp_mock_check_password_reset_key'] = fn() => new WP_Error('expired', 'Expired');

        $callback = $this->getRouteCallback('kubikart/v1/reset-password');
        $req      = new WP_REST_Request(['key' => 'expired-key', 'login' => 'user', 'password' => 'newpassword']);
        $response = $callback($req);

        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertSame('invalid_key', $response->get_error_code());
    }

    public function test_reset_password_calls_reset_password_on_valid_key(): void
    {
        $GLOBALS['_wp_mock_logged_in'] = true;
        $mockUser = $this->createMockUser(1, 'u@t.de', 'U');
        $GLOBALS['_wp_mock_get_user_by'] = fn() => $mockUser;
        $GLOBALS['_wp_mock_check_password_reset_key'] = fn() => new stdClass(); // valid

        $resetCalled = false;
        $GLOBALS['_wp_mock_reset_password'] = function ($user, $pass) use (&$resetCalled) {
            $resetCalled = true;
        };

        $callback = $this->getRouteCallback('kubikart/v1/reset-password');
        $req      = new WP_REST_Request(['key' => 'valid', 'login' => 'user', 'password' => 'strongpassword']);
        $response = $callback($req);

        $this->assertInstanceOf(WP_REST_Response::class, $response);
        $this->assertSame(200, $response->get_status());
        $this->assertTrue($resetCalled, 'reset_password() should have been called');
    }

    // ── Email HTML generation ─────────────────────────────────────────────────

    public function test_reset_email_html_contains_name_and_url(): void
    {
        $html = kubikart_reset_email_html('Max', 'https://kubikart.de/de/account/reset-password?key=abc');
        $this->assertStringContainsString('Max', $html);
        $this->assertStringContainsString('https://kubikart.de/de/account/reset-password?key=abc', $html);
        $this->assertStringContainsString('Kubikart', $html);
    }

    public function test_reset_email_html_is_valid_html(): void
    {
        $html = kubikart_reset_email_html('Anna', 'https://kubikart.de/en/account/reset-password?key=xyz');
        $this->assertStringStartsWith('<!DOCTYPE html>', $html);
        $this->assertStringContainsString('</html>', $html);
    }

    // ── Brute force protection ────────────────────────────────────────────────

    public function test_login_brute_force_blocks_after_5_attempts(): void
    {
        $_SERVER['REMOTE_ADDR'] = '10.0.0.1';

        $ip         = '10.0.0.1';
        $transient  = 'login_attempts_' . md5($ip);

        // Simulate 5 previous failed attempts
        set_transient($transient, 5, 15 * MINUTE_IN_SECONDS);

        // The authenticate filter runs on login
        $callbacks = $GLOBALS['_wp_filters']['authenticate'] ?? [];
        $filterFn  = null;
        foreach ($callbacks as $priority => $cbs) {
            foreach ($cbs as $cb) {
                // Find our filter (priority 30)
                if ($priority === 30) $filterFn = $cb['fn'];
            }
        }
        $this->assertNotNull($filterFn, 'Brute force authenticate filter should be registered');

        $result = $filterFn(null, 'user@test.de', 'wrongpass');
        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertSame('too_many_attempts', $result->get_error_code());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function createMockUser(int $id, string $email, string $firstName): object
    {
        $user             = new stdClass();
        $user->ID         = $id;
        $user->user_email = $email;
        $user->user_login = $email;
        $user->first_name = $firstName;
        $user->display_name = $firstName;
        return $user;
    }

    private function getRouteCallback(string $route): callable
    {
        $this->assertArrayHasKey($route, $GLOBALS['_wp_rest_routes'], "Route $route not registered");
        return $GLOBALS['_wp_rest_routes'][$route]['callback'];
    }
}
