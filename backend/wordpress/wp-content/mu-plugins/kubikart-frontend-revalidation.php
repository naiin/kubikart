<?php
/**
 * Plugin Name: Kubikart Frontend Revalidation
 * Description: Sends signed, short-timeout cache revalidation requests to the Next.js frontend whenever products, variations or product categories change.
 *
 * Configuration (wp-config.php constants, see docs/10-revalidation.md):
 *   KUBIKART_FRONTEND_URL        Base URL of the Next.js frontend, reachable from WordPress.
 *   KUBIKART_REVALIDATE_SECRET   Must equal REVALIDATE_SECRET of the frontend.
 *
 * The request mirrors a WooCommerce webhook: JSON body, base64 HMAC-SHA256
 * signature in X-WC-Webhook-Signature and the event in X-WC-Webhook-Topic.
 * Events are collected per request, de-duplicated and delivered once on
 * `shutdown` (after meta, terms and stock are written and, under PHP-FPM, after
 * the HTTP response has been flushed to the client). Delivery uses a short
 * timeout and stops after the first failure, so an unreachable frontend can
 * never fail or noticeably slow down a WordPress save. A fire-and-forget
 * (non-blocking) request was rejected on purpose: it silently lost events when
 * the frontend was busy. Industry posts are queued by the
 * kubikart-business-industries plugin through kubikart_frontend_revalidate_queue().
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('KUBIKART_REVALIDATE_META_KEYS')) {
    // Direct meta writes (e.g. `wp post meta update`) bypass WooCommerce hooks.
    define('KUBIKART_REVALIDATE_META_KEYS', [
        '_price', '_regular_price', '_sale_price', '_stock', '_stock_status', '_thumbnail_id', '_kubikart_video_ids',
    ]);
}

/**
 * Frontend endpoint and secret, or null when revalidation is not configured.
 *
 * @return array{endpoint: string, secret: string}|null
 */
function kubikart_frontend_revalidate_config(): ?array
{
    if (!defined('KUBIKART_FRONTEND_URL') || !defined('KUBIKART_REVALIDATE_SECRET')) {
        return null;
    }

    $url = trim((string) KUBIKART_FRONTEND_URL);
    $secret = (string) KUBIKART_REVALIDATE_SECRET;
    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    if ($url === '' || $secret === '' || !in_array($scheme, ['http', 'https'], true)) {
        return null;
    }

    return ['endpoint' => trailingslashit($url) . 'api/revalidate', 'secret' => $secret];
}

/**
 * Send one signed revalidation request. Never throws; failures are logged
 * without the secret. Returns true when the frontend answered with a 2xx.
 */
function kubikart_frontend_revalidate_send(string $topic, array $payload, bool $blocking = false): bool
{
    $config = kubikart_frontend_revalidate_config();
    if (!$config || !preg_match('/^[a-z_]+\.[a-z_]+$/', $topic)) {
        return false;
    }
    if (!apply_filters('kubikart_frontend_revalidate_enabled', true, $topic, $payload)) {
        return false;
    }

    $body = wp_json_encode($payload);
    if (!is_string($body)) {
        return false;
    }

    // The signature covers "<unix seconds>.<body>" so the frontend can reject replayed requests.
    $timestamp = time();

    try {
        $response = wp_remote_post($config['endpoint'], [
            'blocking' => $blocking,
            'timeout' => (float) apply_filters('kubikart_frontend_revalidate_timeout', 2.0),
            'redirection' => 0,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-WC-Webhook-Signature' => base64_encode(hash_hmac('sha256', $timestamp . '.' . $body, $config['secret'], true)),
                'X-Kubikart-Timestamp' => (string) $timestamp,
                'X-WC-Webhook-Topic' => $topic,
            ],
            'body' => $body,
        ]);
    } catch (Throwable $error) {
        error_log('[kubikart-revalidate] ' . $topic . ' request failed: ' . $error->getMessage());
        return false;
    }

    if ($response instanceof WP_Error) {
        error_log('[kubikart-revalidate] ' . $topic . ' request failed: ' . $response->get_error_message());
        return false;
    }

    $code = (int) ($response['response']['code'] ?? 0);
    if ($blocking && ($code < 200 || $code >= 300)) {
        error_log('[kubikart-revalidate] ' . $topic . ' rejected by the frontend with HTTP ' . $code
            . ' (check that KUBIKART_REVALIDATE_SECRET equals the frontend REVALIDATE_SECRET)');
        return false;
    }

    return true;
}

/**
 * Collect events during the request; each unique topic + id is sent once on
 * shutdown, after all meta, terms and stock have been written.
 */
function kubikart_frontend_revalidate_queue(string $topic, array $payload): void
{
    if (!kubikart_frontend_revalidate_config()) {
        return;
    }

    static $hooked = false;
    $key = $topic . ':' . ($payload['id'] ?? ($payload['slug'] ?? ''));

    $GLOBALS['kubikart_revalidate_queue'][$key] = ['topic' => $topic, 'payload' => $payload];

    if (!$hooked) {
        $hooked = true;
        add_action('shutdown', 'kubikart_frontend_revalidate_flush', 5);
    }
}

function kubikart_frontend_revalidate_flush(): void
{
    $queue = $GLOBALS['kubikart_revalidate_queue'] ?? [];
    $GLOBALS['kubikart_revalidate_queue'] = [];
    if (!$queue) {
        return;
    }

    // Let PHP-FPM complete the browser/API response before contacting the frontend.
    if (PHP_SAPI === 'fpm-fcgi' && function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }

    foreach ($queue as $event) {
        if (!kubikart_frontend_revalidate_send($event['topic'], $event['payload'], true)) {
            break; // an unreachable or misconfigured frontend should cost at most one timeout
        }
    }
}

/**
 * Resolve a product, or the parent of a variation, to its product post.
 */
function kubikart_frontend_revalidate_product_post(int $post_id): ?object
{
    $post = $post_id > 0 ? get_post($post_id) : null;
    if (!$post) {
        return null;
    }
    if ($post->post_type === 'product_variation' && (int) $post->post_parent > 0) {
        $post = get_post((int) $post->post_parent);
    }

    return $post && $post->post_type === 'product' ? $post : null;
}

/**
 * @return array<string, array{id: int, slug: string}>
 */
function kubikart_frontend_revalidate_translations(int $id, string $kind): array
{
    $function = $kind === 'term' ? 'pll_get_term_translations' : 'pll_get_post_translations';
    if (!function_exists($function)) {
        return [];
    }

    $translations = [];
    foreach ((array) $function($id) as $language => $translation_id) {
        $translation_id = (int) $translation_id;
        $object = $kind === 'term' ? get_term($translation_id) : get_post($translation_id);
        if (!$object || $object instanceof WP_Error) {
            continue;
        }
        $slug = $kind === 'term' ? ($object->slug ?? '') : ($object->post_name ?? '');
        $translations[sanitize_key((string) $language)] = ['id' => $translation_id, 'slug' => (string) $slug];
    }

    return $translations;
}

function kubikart_frontend_revalidate_product_payload(object $post): array
{
    $id = (int) $post->ID;
    $payload = [
        'id' => $id,
        'slug' => (string) ($post->post_name ?? ''),
        'status' => (string) ($post->post_status ?? ''),
    ];
    if (function_exists('pll_get_post_language')) {
        $payload['language'] = (string) pll_get_post_language($id);
    }
    $payload['translations'] = kubikart_frontend_revalidate_translations($id, 'post');

    return $payload;
}

/**
 * Queue a product event. $action: created|updated|deleted|restored.
 * Variations resolve to their parent product.
 */
function kubikart_frontend_revalidate_product(int $product_id, string $action = 'updated'): void
{
    $post = kubikart_frontend_revalidate_product_post($product_id);
    if (!$post || in_array($post->post_status ?? '', ['auto-draft', 'inherit'], true)) {
        return;
    }
    if ((int) $post->ID !== $product_id) {
        $action = 'updated'; // a variation changed; its parent product still exists
    }

    kubikart_frontend_revalidate_queue('product.' . $action, kubikart_frontend_revalidate_product_payload($post));
}

function kubikart_frontend_revalidate_category(int $term_id, string $action, ?object $term = null): void
{
    $term = $term ?: get_term($term_id, 'product_cat');
    if (!$term || $term instanceof WP_Error || ($term->taxonomy ?? 'product_cat') !== 'product_cat') {
        return;
    }

    $payload = [
        'id' => (int) $term->term_id,
        'slug' => (string) ($term->slug ?? ''),
        'name' => (string) ($term->name ?? ''),
        'taxonomy' => 'product_cat',
    ];
    if (function_exists('pll_get_term_language')) {
        $payload['language'] = (string) pll_get_term_language((int) $term->term_id);
    }
    $payload['translations'] = $action === 'deleted' ? [] : kubikart_frontend_revalidate_translations((int) $term->term_id, 'term');

    kubikart_frontend_revalidate_queue('category.' . $action, $payload);
}

/**
 * Register the WordPress / WooCommerce event listeners.
 */
function kubikart_frontend_revalidate_register_hooks(): void
{
    add_action('woocommerce_new_product', static function ($id): void {
        kubikart_frontend_revalidate_product((int) $id, 'created');
    }, 20);
    add_action('woocommerce_update_product', static function ($id): void {
        kubikart_frontend_revalidate_product((int) $id, 'updated');
    }, 20);

    // wp_update_post() and wp-cli `wp post update` do not run a WC product save.
    add_action('save_post_product', static function ($id): void {
        if (!wp_is_post_autosave((int) $id) && !wp_is_post_revision((int) $id)) {
            kubikart_frontend_revalidate_product((int) $id, 'updated');
        }
    }, 20);
    add_action('transition_post_status', static function ($new, $old, $post): void {
        if ($new !== $old && $new !== 'trash' && is_object($post) && $post->post_type === 'product') {
            kubikart_frontend_revalidate_product((int) $post->ID, 'updated');
        }
    }, 20, 3);

    // Stock, price and variation changes that skip a full product save (orders, imports).
    add_action('woocommerce_product_set_stock', static function ($product): void {
        if (is_object($product) && method_exists($product, 'get_id')) {
            kubikart_frontend_revalidate_product((int) $product->get_id(), 'updated');
        }
    }, 20);
    add_action('woocommerce_variation_set_stock', static function ($product): void {
        if (is_object($product) && method_exists($product, 'get_id')) {
            kubikart_frontend_revalidate_product((int) $product->get_id(), 'updated');
        }
    }, 20);
    foreach (['woocommerce_product_set_stock_status', 'woocommerce_variation_set_stock_status'] as $hook) {
        add_action($hook, static function ($id): void {
            kubikart_frontend_revalidate_product((int) $id, 'updated');
        }, 20);
    }
    foreach ([
        'woocommerce_new_product_variation',
        'woocommerce_update_product_variation',
        'woocommerce_trash_product_variation',
        'woocommerce_delete_product_variation',
    ] as $hook) {
        add_action($hook, static function ($id): void {
            kubikart_frontend_revalidate_product((int) $id, 'updated');
        }, 20);
    }
    foreach (['added_post_meta', 'updated_post_meta'] as $hook) {
        add_action($hook, static function ($meta_id, $post_id, $meta_key): void {
            if (in_array($meta_key, KUBIKART_REVALIDATE_META_KEYS, true)) {
                kubikart_frontend_revalidate_product((int) $post_id, 'updated');
            }
        }, 20, 4);
    }

    // Capture the slug before WordPress appends "__trashed" or deletes the row.
    add_action('wp_trash_post', static function ($id): void {
        kubikart_frontend_revalidate_product((int) $id, 'deleted');
    }, 5);
    add_action('before_delete_post', static function ($id): void {
        kubikart_frontend_revalidate_product((int) $id, 'deleted');
    }, 5);
    add_action('untrashed_post', static function ($id): void {
        kubikart_frontend_revalidate_product((int) $id, 'restored');
    }, 20);

    add_action('created_product_cat', static function ($term_id): void {
        kubikart_frontend_revalidate_category((int) $term_id, 'created');
    }, 20);
    add_action('edited_product_cat', static function ($term_id): void {
        kubikart_frontend_revalidate_category((int) $term_id, 'updated');
    }, 20);
    add_action('delete_product_cat', static function ($term_id, $tt_id = 0, $deleted_term = null): void {
        kubikart_frontend_revalidate_category((int) $term_id, 'deleted', is_object($deleted_term) ? $deleted_term : null);
    }, 20, 3);
}

kubikart_frontend_revalidate_register_hooks();
