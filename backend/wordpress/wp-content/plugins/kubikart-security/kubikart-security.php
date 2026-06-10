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
add_filter('rest_authentication_errors', function ($result) {
    if ($result !== null) {
        return $result;
    }

    // Allow these REST routes without auth
    $allowed_routes = [
        '/wp-json/wc/',                                  // WooCommerce (has its own auth)
        '/wp-json/contact-form-7/',                      // CF7 submissions
        '/wp-json/kubikart/v1/forgot-password',          // Headless password reset request (unauthenticated)
    ];

    $request_uri = $_SERVER['REQUEST_URI'] ?? '';
    foreach ($allowed_routes as $route) {
        if (strpos($request_uri, $route) !== false) {
            return $result;
        }
    }

    // Require auth for all other REST API requests
    if (!is_user_logged_in()) {
        // Check for Application Password or Basic Auth
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (empty($auth_header)) {
            return new WP_Error(
                'rest_not_logged_in',
                __('Authentication required.', 'kubikart'),
                ['status' => 401]
            );
        }
    }

    return $result;
});

// ============================================================
// 8. Disable application passwords discovery for non-admins
// ============================================================
add_filter('wp_is_application_passwords_available_for_user', function ($available, $user) {
    return user_can($user, 'manage_options');
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
//  POST /wp-json/kubikart/v1/forgot-password  — unauthenticated
//  POST /wp-json/kubikart/v1/reset-password   — requires Application Password
// ============================================================
add_action('rest_api_init', function () {

    // — Forgot Password (public) ————————————————————————————————————
    register_rest_route('kubikart/v1', '/forgot-password', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true',
        'args' => [
            'email'    => ['required' => true, 'sanitize_callback' => 'sanitize_email'],
            'locale'   => ['required' => false, 'sanitize_callback' => 'sanitize_text_field'],
            'site_url' => ['required' => false, 'sanitize_callback' => 'esc_url_raw'],
        ],
        'callback' => function (WP_REST_Request $req) {
            $email    = $req->get_param('email');
            $locale   = $req->get_param('locale') ?: 'de';
            $site_url = rtrim($req->get_param('site_url') ?: get_option('kubikart_frontend_url', site_url()), '/');

            $user = get_user_by('email', $email);

            // Always return success — never reveal whether the email exists.
            if (!$user || is_wp_error($key = get_password_reset_key($user))) {
                return new WP_REST_Response(['success' => true], 200);
            }

            $reset_url = $site_url . '/' . $locale . '/account/reset-password'
                . '?key='   . rawurlencode($key)
                . '&login=' . rawurlencode($user->user_login);

            $name    = !empty($user->first_name) ? $user->first_name : $user->display_name;
            $subject = 'Passwort zurücksetzen – Kubikart';
            $headers = ['Content-Type: text/html; charset=UTF-8'];
            $body    = kubikart_reset_email_html($name, $reset_url);

            wp_mail($user->user_email, $subject, $body, $headers);

            return new WP_REST_Response(['success' => true], 200);
        },
    ]);

    // — Reset Password (requires Application Password) ——————————————
    register_rest_route('kubikart/v1', '/reset-password', [
        'methods'             => 'POST',
        'permission_callback' => fn() => is_user_logged_in() && current_user_can('read'),
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

/** HTML email for password reset — matches Kubikart brand */
function kubikart_reset_email_html(string $name, string $reset_url): string {
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
