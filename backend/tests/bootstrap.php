<?php
/**
 * PHPUnit bootstrap — WordPress function stubs for unit testing plugins
 * without a running WordPress installation.
 *
 * Run from backend/ with:
 *   lando php vendor/bin/phpunit
 *   # or inside lando: lando ssh -c "cd /app && php vendor/bin/phpunit"
 */

define('ABSPATH', __DIR__ . '/');
define('MINUTE_IN_SECONDS', 60);
define('HOUR_IN_SECONDS', 3600);

// ---------------------------------------------------------------------------
// Simple hook system (mirrors WP hooks API)
// ---------------------------------------------------------------------------
$_wp_hooks    = [];
$_wp_filters  = [];
$_wp_mocks    = [];  // for mockable WP functions

function add_action(string $tag, mixed $fn, int $priority = 10, int $accepted_args = 1): void {
    global $_wp_hooks;
    $_wp_hooks[$tag][$priority][] = ['fn' => $fn, 'args' => $accepted_args];
}

function add_filter(string $tag, mixed $fn, int $priority = 10, int $accepted_args = 1): void {
    global $_wp_filters;
    $_wp_filters[$tag][$priority][] = ['fn' => $fn, 'args' => $accepted_args];
}

function remove_action(string $tag, mixed $fn): void {}
function remove_filter(string $tag, mixed $fn): void {}

function do_action(string $tag, ...$args): void {
    global $_wp_hooks;
    if (empty($_wp_hooks[$tag])) return;
    ksort($_wp_hooks[$tag]);
    foreach ($_wp_hooks[$tag] as $callbacks) {
        foreach ($callbacks as $cb) {
            call_user_func_array($cb['fn'], array_slice($args, 0, $cb['args']));
        }
    }
}

function apply_filters(string $tag, mixed $value, mixed ...$args): mixed {
    global $_wp_filters;
    if (empty($_wp_filters[$tag])) return $value;
    ksort($_wp_filters[$tag]);
    foreach ($_wp_filters[$tag] as $callbacks) {
        foreach ($callbacks as $cb) {
            $value = call_user_func_array($cb['fn'], array_merge([$value], $args));
        }
    }
    return $value;
}

function has_action(string $tag): bool {
    global $_wp_hooks;
    return !empty($_wp_hooks[$tag]);
}

function has_filter(string $tag): bool {
    global $_wp_filters;
    return !empty($_wp_filters[$tag]);
}

// ---------------------------------------------------------------------------
// WP class stubs
// ---------------------------------------------------------------------------
class WP_Error {
    public string $code;
    public string $message;
    public mixed  $data;

    public function __construct(string $code = '', string $message = '', mixed $data = '') {
        $this->code    = $code;
        $this->message = $message;
        $this->data    = $data;
    }

    public function get_error_message(): string { return $this->message; }
    public function get_error_code(): string    { return $this->code; }
    public function get_error_data(): mixed     { return $this->data; }
}

class WP_REST_Response {
    public mixed $data;
    public int   $status;

    public function __construct(mixed $data = null, int $status = 200) {
        $this->data   = $data;
        $this->status = $status;
    }

    public function get_data(): mixed  { return $this->data; }
    public function set_data(mixed $data): void { $this->data = $data; }
    public function get_status(): int  { return $this->status; }
}

class WP_REST_Request {
    private array $params;
    private array $headers;

    public function __construct(array $params = [], array $headers = []) {
        $this->params  = $params;
        $this->headers = $headers;
    }

    public function get_param(string $key): mixed {
        return $this->params[$key] ?? null;
    }

    public function get_header(string $key): ?string {
        return $this->headers[$key] ?? null;
    }
}

// ---------------------------------------------------------------------------
// Mockable WP functions
// Swap implementations via $GLOBALS['_wp_mock_{name}'] in tests.
// ---------------------------------------------------------------------------
function wp_mock_fn(string $name, array $args): mixed {
    $key = '_wp_mock_' . $name;
    if (isset($GLOBALS[$key]) && is_callable($GLOBALS[$key])) {
        return ($GLOBALS[$key])(...$args);
    }
    return null;
}

function is_wp_error(mixed $thing): bool {
    return $thing instanceof WP_Error;
}

function is_user_logged_in(): bool {
    return (bool) ($GLOBALS['_wp_mock_logged_in'] ?? false);
}

function current_user_can(string $cap): bool {
    return (bool) ($GLOBALS['_wp_mock_user_can'] ?? true);
}

function get_user_by(string $field, mixed $value): mixed {
    return wp_mock_fn('get_user_by', [$field, $value]);
}

function get_password_reset_key(object $user): string|WP_Error {
    return wp_mock_fn('get_password_reset_key', [$user]) ?? 'mock-reset-key';
}

function check_password_reset_key(string $key, string $login): stdClass|WP_Error {
    return wp_mock_fn('check_password_reset_key', [$key, $login]) ?? new stdClass();
}

function reset_password(object $user, string $password): void {
    wp_mock_fn('reset_password', [$user, $password]);
}

function wp_mail(string $to, string $subject, string $message, array $headers = [], array $attachments = []): bool {
    $result = wp_mock_fn('wp_mail', [$to, $subject, $message, $headers, $attachments]);
    return $result !== null ? (bool) $result : true;
}

function get_transient(string $key): mixed {
    return $GLOBALS['_wp_transients'][$key] ?? false;
}

function set_transient(string $key, mixed $value, int $expiry = 0): bool {
    $GLOBALS['_wp_transients'][$key] = $value;
    return true;
}

function delete_transient(string $key): bool {
    unset($GLOBALS['_wp_transients'][$key]);
    return true;
}

function update_post_meta(int $post_id, string $key, mixed $value): void {
    $GLOBALS['_wp_post_meta'][$post_id][$key] = $value;
}
function add_post_meta(int $post_id, string $key, mixed $value, bool $unique = false): int|false {
    if ($unique && isset($GLOBALS['_wp_post_meta'][$post_id][$key])) return false;
    $GLOBALS['_wp_post_meta'][$post_id][$key] = $value;
    return 1;
}
function delete_post_meta(int $post_id, string $key): bool {
    unset($GLOBALS['_wp_post_meta'][$post_id][$key]);
    return true;
}
function metadata_exists(string $type, int $post_id, string $key): bool {
    return isset($GLOBALS['_wp_post_meta'][$post_id][$key]);
}

function get_post_meta(int $post_id, string $key = '', bool $single = false): mixed {
    if ($key === '') return $GLOBALS['_wp_post_meta'][$post_id] ?? [];
    return $GLOBALS['_wp_post_meta'][$post_id][$key] ?? ($single ? '' : []);
}

function get_option(string $option, mixed $default = false): mixed {
    return $GLOBALS['_wp_options'][$option] ?? $default;
}

function sanitize_email(string $email): string { return strtolower(trim($email)); }
function sanitize_text_field(string $text): string { return trim(strip_tags($text)); }
function sanitize_textarea_field(string $text): string { return trim(strip_tags($text)); }
function sanitize_key(string $key): string { return preg_replace('/[^a-z0-9_\\-]/', '', strtolower($key)) ?? ''; }
function sanitize_title(string $title): string {
    $title = strtolower(trim($title));
    return trim(preg_replace('/[^a-z0-9]+/', '-', $title) ?? '', '-');
}
function absint(mixed $value): int { return abs((int) $value); }
function wc_format_decimal(mixed $value): string { return number_format((float) str_replace(',', '.', (string) $value), 2, '.', ''); }
function esc_attr(mixed $value): string { return htmlspecialchars((string) $value, ENT_QUOTES); }
function esc_html(mixed $value): string { return htmlspecialchars((string) $value, ENT_QUOTES); }
function esc_textarea(mixed $value): string { return htmlspecialchars((string) $value, ENT_QUOTES); }
function selected(mixed $selected, mixed $current, bool $echo = true): string {
    $result = $selected === $current ? ' selected="selected"' : '';
    if ($echo) echo $result;
    return $result;
}
function checked(mixed $checked, mixed $current = true, bool $echo = true): string {
    $result = $checked == $current ? ' checked="checked"' : '';
    if ($echo) echo $result;
    return $result;
}
function wp_unslash(mixed $value): mixed { return $value; }
function wp_json_encode(mixed $value, int $flags = 0): string|false { return json_encode($value, $flags); }
function current_time(string $type, bool $gmt = false): string { return '2026-07-28 12:00:00'; }
function esc_url_raw(string $url): string { return filter_var($url, FILTER_SANITIZE_URL) ?: ''; }
function home_url(string $path = ''): string { return 'https://test.local' . $path; }
function site_url(string $path = ''): string { return 'https://test.local' . $path; }
function trailingslashit(string $url): string { return rtrim($url, '/') . '/'; }
function is_author(): bool { return false; }
function is_admin(): bool { return false; }
function register_post_type(string $slug, array $args): void {}
function register_rest_route(string $namespace, string $route, array $args): void {
    $GLOBALS['_wp_rest_routes'][$namespace . $route] = $args;
}
function wp_redirect(string $url, int $status = 302): void {}
function __return_false(): bool { return false; }
function __return_true(): bool  { return true; }
function __return_empty_string(): string { return ''; }
function __(string $text, ?string $domain = null): string { return $text; }

if (!function_exists('mb_strlen')) {
    function mb_strlen(string $s, ?string $enc = null): int { return strlen($s); }
}

// ---------------------------------------------------------------------------
// Autoload vendor (PHPUnit)
// ---------------------------------------------------------------------------
require_once __DIR__ . '/../vendor/autoload.php';

// ---------------------------------------------------------------------------
// Helper: reset all WP mocks between tests
// ---------------------------------------------------------------------------
function wp_reset_mocks(): void {
    $keys = array_filter(
        array_keys($GLOBALS),
        fn($k) => str_starts_with($k, '_wp_') && !in_array($k, ['_wp_hooks', '_wp_filters'], true)
    );
    foreach ($keys as $key) {
        unset($GLOBALS[$key]);
    }
    $GLOBALS['_wp_transients'] = [];
    $GLOBALS['_wp_post_meta']  = [];
    $GLOBALS['_wp_options']    = [];
    $GLOBALS['_wp_rest_routes'] = [];
}
