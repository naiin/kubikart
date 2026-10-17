<?php
/**
 * Plugin Name: Kubikart Security
 * Description: Security hardening for the Kubikart WordPress backend.
 * Version: 1.0.0
 * Author: Kubikart
 */

if (!defined('ABSPATH')) {
    exit;
}

const KUBIKART_INTEGRATION_ROLE = 'kubikart_frontend_integration';
const KUBIKART_INTEGRATION_CAPABILITY = 'kubikart_frontend_integration';

/**
 * Register the least-privileged role used by the Next.js server.
 *
 * edit_posts and publish_posts are required because the existing contact,
 * newsletter and withdrawal endpoints store records as private posts.
 * Without publish_posts WordPress rejects a REST request with status=private.
 * The role deliberately has no edit_others_posts, WooCommerce, user,
 * settings, plugin, theme or file capabilities.
 */
function kubikart_register_frontend_integration_role(): void
{
    $capabilities = [
        'read' => true,
        'edit_posts' => true,
        'publish_posts' => true,
        KUBIKART_INTEGRATION_CAPABILITY => true,
    ];

    $role = get_role(KUBIKART_INTEGRATION_ROLE);
    if (!$role) {
        add_role(
            KUBIKART_INTEGRATION_ROLE,
            __('Kubikart Frontend Integration', 'kubikart'),
            $capabilities
        );
        return;
    }

    foreach ($capabilities as $capability => $grant) {
        if ($grant) {
            $role->add_cap($capability);
        }
    }
}
add_action('init', 'kubikart_register_frontend_integration_role');

/**
 * Next.js/Mailtrap owns payment-status customer mail for orders carrying this
 * explicit marker. WooCommerce continues to own all other order mail.
 */
function kubikart_mailtrap_owns_payment_email($enabled, $order): bool
{
    if (!$order instanceof WC_Order) {
        return (bool) $enabled;
    }

    return $order->get_meta('_kubikart_transactional_email_owner') === 'mailtrap'
        ? false
        : (bool) $enabled;
}
add_filter('woocommerce_email_enabled_customer_processing_order', 'kubikart_mailtrap_owns_payment_email', 10, 2);

// ============================================================
// 1. Disable XML-RPC completely (prevents brute force & DDoS)
// ============================================================
add_filter('xmlrpc_enabled', '__return_false');
add_filter('wp_headers', function ($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});
// Remove XML-RPC endpoint from head
remove_action('wp_head', 'rsd_link');

// ============================================================
// 2. Disable user enumeration via REST API and ?author=N
// ============================================================
add_filter('rest_endpoints', function ($endpoints) {
    // Remove /wp/v2/users endpoint for unauthenticated requests
    if (!is_user_logged_in()) {
        unset($endpoints['/wp/v2/users']);
        unset($endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});

// Block ?author=N enumeration
add_action('template_redirect', function () {
    if (is_author() && !is_user_logged_in()) {
        wp_redirect(home_url(), 301);
        exit;
    }
});

// ============================================================
// 3. Remove WordPress version from head and feeds
// ============================================================
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

// ============================================================
// 4. Disable file editing from WP Admin (security best practice)
// ============================================================
if (!defined('DISALLOW_FILE_EDIT')) {
    define('DISALLOW_FILE_EDIT', true);
}

// ============================================================
// 5. Add security headers to all responses
// ============================================================
add_action('send_headers', function () {
    if (!is_admin()) {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
    }
});

// ============================================================
// 6. Limit login attempts (basic brute force protection)
// ============================================================
add_filter('authenticate', function ($user, $username, $password) {
    if (empty($username) || empty($password)) {
        return $user;
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $transient_key = 'login_attempts_' . md5($ip);
    $attempts = get_transient($transient_key) ?: 0;

    if ($attempts >= 5) {
        return new WP_Error(
            'too_many_attempts',
            __('Zu viele Anmeldeversuche. Bitte versuche es in 15 Minuten erneut.', 'kubikart')
        );
    }

    return $user;
}, 30, 3);

add_action('wp_login_failed', function () {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $transient_key = 'login_attempts_' . md5($ip);
    $attempts = get_transient($transient_key) ?: 0;
    set_transient($transient_key, $attempts + 1, 15 * MINUTE_IN_SECONDS);
});

// Reset on successful login
add_action('wp_login', function () {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $transient_key = 'login_attempts_' . md5($ip);
    delete_transient($transient_key);
});

// ============================================================
// 7. Disable REST API for unauthenticated users (except needed endpoints)
// ============================================================
/**
 * REST route (for example "/wc/v3/products") of the current request, taken from WordPress's own parsed
 * request and not from the raw URI, so a query string or path suffix cannot impersonate an allowed route.
 */
function kubikart_current_rest_route(): string {
    $route = isset($GLOBALS['wp']->query_vars['rest_route']) ? (string) $GLOBALS['wp']->query_vars['rest_route'] : '';
    return '/' . ltrim($route, '/');
}

/** Whether a REST route may be called without authentication. */
function kubikart_rest_route_is_public(string $route): bool {
    // Namespaces that authenticate themselves, plus the one public Kubikart endpoint (exact match).
    foreach (['/wc/', '/contact-form-7/'] as $prefix) {
        if (str_starts_with($route, $prefix)) {
            return true;
        }
    }
    return false;
}

add_filter('rest_authentication_errors', function ($result) {
    if ($result !== null) {
        return $result;
    }

    if (kubikart_rest_route_is_public(kubikart_current_rest_route())) {
        return $result;
    }

    // Everything else needs a logged-in user. A valid Application Password has already authenticated the user
    // by this point, so a bare Authorization header proves nothing and is not accepted on its own.
    if (!is_user_logged_in()) {
        return new WP_Error(
            'rest_not_logged_in',
            __('Authentication required.', 'kubikart'),
            ['status' => 401]
        );
    }

    return $result;
});

// ============================================================
// 8. Restrict application passwords to administrators and the integration role
// ============================================================
add_filter('wp_is_application_passwords_available_for_user', function ($available, $user) {
    return user_can($user, 'manage_options') || user_can($user, KUBIKART_INTEGRATION_CAPABILITY);
}, 10, 2);

// ============================================================
// 9. Remove unnecessary default WordPress meta tags
// ============================================================
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
remove_action('wp_head', 'rest_output_link_wp_head');
remove_action('wp_head', 'wp_oembed_add_discovery_links');
remove_action('wp_head', 'feed_links_extra', 3);

// ============================================================
// 10. Password reset REST endpoints (headless frontend)
//
//  POST /wp-json/kubikart/v1/forgot-password  — requires frontend integration authentication
//  POST /wp-json/kubikart/v1/reset-password   — requires Application Password
// ============================================================
add_action('rest_api_init', function () {

    // REST Basic authentication accepts application passwords, not customer passwords.
    // Keep customer credential verification behind the server's integration identity.
    register_rest_route('kubikart/v1', '/customer-login', [
        'methods' => 'POST',
        'permission_callback' => fn() => current_user_can('manage_options') || current_user_can(KUBIKART_INTEGRATION_CAPABILITY),
        'callback' => function (WP_REST_Request $request) {
            $email = sanitize_email($request->get_param('email') ?? '');
            $password = $request->get_param('password');
            if (!$email || !is_string($password) || $password === '') {
                return new WP_Error('invalid_credentials', 'Invalid email or password.', ['status' => 401]);
            }
            $user = wp_authenticate($email, $password);
            if (is_wp_error($user)) {
                return new WP_Error('invalid_credentials', 'Invalid email or password.', ['status' => 401]);
            }
            do_action('wp_login', $user->user_login, $user);
            return new WP_REST_Response(['id' => (int) $user->ID], 200);
        },
    ]);

    // — Forgot Password (CAPTCHA is verified by the authenticated frontend proxy) —
    register_rest_route('kubikart/v1', '/forgot-password', [
        'methods'             => 'POST',
        'permission_callback' => fn() => current_user_can('manage_options') || current_user_can(KUBIKART_INTEGRATION_CAPABILITY),
        'args' => [
            'email'  => ['required' => true, 'sanitize_callback' => 'sanitize_email'],
            'locale' => ['required' => false, 'sanitize_callback' => 'sanitize_key'],
        ],
        'callback' => function (WP_REST_Request $req) {
            $email  = $req->get_param('email');
            // Only the two storefront locales; anything else falls back to German.
            $locale = in_array($req->get_param('locale'), ['de', 'en'], true) ? $req->get_param('locale') : 'de';
            // The link base comes from server configuration only. A caller-supplied URL would let anyone send
            // a victim a genuine reset e-mail that points at a site they control.
            $site_url = kubikart_reset_link_base_url();

            $user = get_user_by('email', $email);

            // Always return success — never reveal whether the email exists.
            if (!$user || is_wp_error($key = get_password_reset_key($user))) {
                return new WP_REST_Response(['success' => true], 200);
            }

            $reset_url = $site_url . '/' . $locale . '/account/reset-password'
                . '?key='   . rawurlencode($key)
                . '&login=' . rawurlencode($user->user_login);

            $name    = !empty($user->first_name) ? $user->first_name : $user->display_name;
            $subject = $locale === 'en' ? 'Reset your password – Kubikart' : 'Passwort zurücksetzen – Kubikart';
            $headers = ['Content-Type: text/html; charset=UTF-8'];
            $body    = kubikart_reset_email_html($name, $reset_url, $locale);

            wp_mail($user->user_email, $subject, $body, $headers);

            return new WP_REST_Response(['success' => true], 200);
        },
    ]);

    // — Reset Password (requires Application Password) ——————————————
    register_rest_route('kubikart/v1', '/reset-password', [
        'methods'             => 'POST',
        'permission_callback' => fn() => current_user_can('manage_options') || current_user_can(KUBIKART_INTEGRATION_CAPABILITY),
        'args' => [
            'key'      => ['required' => true, 'sanitize_callback' => 'sanitize_text_field'],
            'login'    => ['required' => true, 'sanitize_callback' => 'sanitize_text_field'],
            'password' => ['required' => true],
        ],
        'callback' => function (WP_REST_Request $req) {
            $key      = $req->get_param('key');
            $login    = $req->get_param('login');
            $password = $req->get_param('password');

            if (mb_strlen($password) < 8) {
                return new WP_Error('password_too_short', 'Das Passwort muss mindestens 8 Zeichen lang sein.', ['status' => 400]);
            }

            $user  = get_user_by('login', $login);
            $check = $user ? check_password_reset_key($key, $user->user_login) : null;

            if (!$user || is_wp_error($check)) {
                return new WP_Error('invalid_key', 'Dieser Link ist ungültig oder abgelaufen.', ['status' => 400]);
            }

            reset_password($user, $password);

            return new WP_REST_Response(['success' => true], 200);
        },
    ]);
});

/** Trusted storefront origin for reset links: KUBIKART_FRONTEND_URL, then the stored option, then the site URL. */
function kubikart_reset_link_base_url(): string {
    $configured = defined('KUBIKART_FRONTEND_URL') ? trim((string) KUBIKART_FRONTEND_URL) : '';
    $base = $configured !== '' ? $configured : (string) get_option('kubikart_frontend_url', site_url());
    return rtrim(esc_url_raw($base), '/');
}

/** HTML email for password reset — matches Kubikart brand */
function kubikart_reset_email_html(string $name, string $reset_url, string $locale = 'de'): string {
    $name = esc_html($name);
    $reset_url = esc_url($reset_url);
    if ($locale === 'en') {
        return '<!doctype html><html lang="en"><head><meta charset="UTF-8"></head><body>'
            . '<h1>Reset your password</h1><p>Hello ' . $name . ',</p>'
            . '<p>We received a request to reset your Kubikart account password.</p>'
            . '<p><a href="' . $reset_url . '">Set a new password</a></p>'
            . '<p>This link is valid for 24 hours. If you did not request this, you can ignore this email.</p>'
            . '<p>Kubikart</p></body></html>';
    }
    return <<<HTML
<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;">
      <tr><td style="background:#0a1d37;padding:24px 40px;border-radius:16px 16px 0 0;">
        <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">Kubikart</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0a1d37;">Passwort zurücksetzen</p>
        <p style="margin:0 0 20px;font-size:15px;color:#344054;line-height:1.6;">Hallo {$name},<br><br>wir haben eine Anfrage erhalten, das Passwort für dein Kubikart-Konto zurückzusetzen.</p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="border-radius:10px;background:#f78801;">
            <a href="{$reset_url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
              Neues Passwort festlegen
            </a>
          </td>
        </tr></table>
        <p style="margin:24px 0 0;font-size:13px;color:#667085;line-height:1.6;">
          Dieser Link ist 24 Stunden gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.<br><br>
          <a href="{$reset_url}" style="color:#0a1d37;word-break:break-all;">{$reset_url}</a>
        </p>
      </td></tr>
      <tr><td style="padding:16px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#667085;">© 2026 Kubikart · Franz-Lehar-Str. 08, 89134 Blaustein</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
HTML;
}
