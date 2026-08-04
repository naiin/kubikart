<?php
/**
 * Plugin Name: Kubikart Business Industries
 * Description: WordPress-managed business landing-page content and WooCommerce product relationships.
 * Version: 1.0.0
 * Author: Kubikart
 * Text Domain: kubikart-business-industries
 */

if (!defined('ABSPATH')) {
    exit;
}

const KUBIKART_INDUSTRY_POST_TYPE = 'business_industry';
const KUBIKART_INDUSTRY_REST_BASE = 'business-industries';
const KUBIKART_INDUSTRY_FEATURED_KIT_META = '_kubikart_featured_kit_id';
const KUBIKART_INDUSTRY_RELATED_PRODUCTS_META = '_kubikart_related_product_ids';
const KUBIKART_INDUSTRY_NONCE_ACTION = 'kubikart_save_business_industry_products';
const KUBIKART_INDUSTRY_NONCE_NAME = 'kubikart_business_industry_nonce';

/**
 * Canonical WooCommerce category slugs. IDs remain runtime-owned by WordPress.
 */
function kubikart_industry_business_kit_slugs(): array
{
    return [
        'de' => 'business-kits-de',
        'en' => 'business-kits',
    ];
}

function kubikart_register_business_industry_post_type(): void
{
    register_post_type(KUBIKART_INDUSTRY_POST_TYPE, [
        'labels' => [
            'name' => __('Business Industries', 'kubikart-business-industries'),
            'singular_name' => __('Business Industry', 'kubikart-business-industries'),
            'add_new_item' => __('Add New Business Industry', 'kubikart-business-industries'),
            'edit_item' => __('Edit Business Industry', 'kubikart-business-industries'),
            'new_item' => __('New Business Industry', 'kubikart-business-industries'),
            'view_item' => __('View Business Industry', 'kubikart-business-industries'),
            'search_items' => __('Search Business Industries', 'kubikart-business-industries'),
            'not_found' => __('No Business Industries found.', 'kubikart-business-industries'),
            'menu_name' => __('Business Industries', 'kubikart-business-industries'),
        ],
        'public' => true,
        'show_ui' => true,
        'show_in_rest' => true,
        'rest_base' => KUBIKART_INDUSTRY_REST_BASE,
        'has_archive' => false,
        'rewrite' => false,
        'hierarchical' => false,
        'publicly_queryable' => false,
        'exclude_from_search' => true,
        'menu_icon' => 'dashicons-store',
        'supports' => [
            'title',
            'editor',
            'excerpt',
            'thumbnail',
            'revisions',
            'page-attributes',
        ],
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'delete_with_user' => false,
    ]);
}
add_action('init', 'kubikart_register_business_industry_post_type');

/**
 * Polylang discovers this post type and provides its language/translation UI
 * and REST representation. Each translation keeps independent post meta.
 */
function kubikart_industry_enable_polylang(array $post_types, bool $is_settings = false): array
{
    $post_types[KUBIKART_INDUSTRY_POST_TYPE] = KUBIKART_INDUSTRY_POST_TYPE;
    return $post_types;
}
add_filter('pll_get_post_types', 'kubikart_industry_enable_polylang', 10, 2);

function kubikart_register_business_industry_meta(): void
{
    $auth_callback = static function (bool $allowed, string $meta_key, int $post_id): bool {
        return current_user_can('edit_post', $post_id);
    };

    register_post_meta(KUBIKART_INDUSTRY_POST_TYPE, KUBIKART_INDUSTRY_FEATURED_KIT_META, [
        'type' => 'integer',
        'single' => true,
        'default' => 0,
        'show_in_rest' => [
            'schema' => [
                'type' => 'integer',
                'minimum' => 0,
                'context' => ['view', 'edit'],
            ],
        ],
        'sanitize_callback' => 'absint',
        'auth_callback' => $auth_callback,
    ]);

    register_post_meta(KUBIKART_INDUSTRY_POST_TYPE, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, [
        'type' => 'array',
        'single' => true,
        'default' => [],
        'show_in_rest' => [
            'schema' => [
                'type' => 'array',
                'items' => ['type' => 'integer'],
                'context' => ['view', 'edit'],
            ],
        ],
        'sanitize_callback' => 'kubikart_industry_sanitize_id_list',
        'auth_callback' => $auth_callback,
    ]);
}
add_action('init', 'kubikart_register_business_industry_meta', 20);

/**
 * Expose only the two approved relationship fields. A published Industry may
 * be read by an authenticated account with read_post; writes still require
 * edit_post and pass the same WooCommerce validation as the admin metabox.
 */
function kubikart_register_business_industry_rest_fields(): void
{
    $register = static function (string $field, string $type, mixed $default): void {
        register_rest_field(KUBIKART_INDUSTRY_POST_TYPE, $field, [
            'get_callback' => static function (array $object) use ($field, $default): mixed {
                $post_id = absint($object['id'] ?? 0);
                if (!$post_id || !current_user_can('read_post', $post_id)) {
                    return $default;
                }
                $value = get_post_meta($post_id, $field, true);
                if ($field === KUBIKART_INDUSTRY_RELATED_PRODUCTS_META) {
                    return kubikart_industry_sanitize_id_list($value);
                }
                return absint($value);
            },
            'update_callback' => static function (mixed $value, object $post) use ($field): bool|WP_Error {
                $post_id = absint($post->ID ?? 0);
                if (!$post_id || !current_user_can('edit_post', $post_id)) {
                    return new WP_Error(
                        'kubikart_industry_rest_forbidden',
                        __('You cannot edit this Industry’s product relationships.', 'kubikart-business-industries'),
                        ['status' => 403]
                    );
                }

                $featured = $field === KUBIKART_INDUSTRY_FEATURED_KIT_META
                    ? $value
                    : get_post_meta($post_id, KUBIKART_INDUSTRY_FEATURED_KIT_META, true);
                $related = $field === KUBIKART_INDUSTRY_RELATED_PRODUCTS_META
                    ? $value
                    : get_post_meta($post_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true);
                $validation = kubikart_industry_validate_relationships(
                    $featured,
                    $related,
                    kubikart_industry_post_language($post_id)
                );

                if (!$validation['valid']) {
                    return new WP_Error(
                        'kubikart_industry_invalid_relationship',
                        implode(' ', $validation['errors'] ?: $validation['warnings']),
                        ['status' => 400]
                    );
                }

                $saved = $field === KUBIKART_INDUSTRY_FEATURED_KIT_META
                    ? $validation['featured_kit_id']
                    : $validation['related_product_ids'];
                if ($saved === 0 || $saved === []) {
                    delete_post_meta($post_id, $field);
                } else {
                    update_post_meta($post_id, $field, $saved);
                }
                return true;
            },
            'schema' => $type === 'array'
                ? [
                    'description' => __('Ordered WooCommerce Product IDs selected for this Industry.', 'kubikart-business-industries'),
                    'type' => 'array',
                    'items' => ['type' => 'integer'],
                    'context' => ['view', 'edit'],
                ]
                : [
                    'description' => __('Featured Business Kit WooCommerce Product ID.', 'kubikart-business-industries'),
                    'type' => 'integer',
                    'minimum' => 0,
                    'context' => ['view', 'edit'],
                ],
        ]);
    };

    $register(KUBIKART_INDUSTRY_FEATURED_KIT_META, 'integer', 0);
    $register(KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, 'array', []);
}
add_action('rest_api_init', 'kubikart_register_business_industry_rest_fields');

/**
 * Convert submitted relationship values to unique positive IDs while keeping
 * the owner's ordering. Existence is validated separately before persistence.
 */
function kubikart_industry_sanitize_id_list(mixed $values): array
{
    if (!is_array($values)) {
        return [];
    }

    $ids = [];
    foreach ($values as $value) {
        $id = absint($value);
        if ($id > 0 && !in_array($id, $ids, true)) {
            $ids[] = $id;
        }
    }
    return $ids;
}

function kubikart_industry_woocommerce_available(): bool
{
    return post_type_exists('product');
}

function kubikart_industry_post_language(int $post_id): string
{
    if (function_exists('pll_get_post_language')) {
        $language = pll_get_post_language($post_id, 'slug');
        if (is_string($language) && $language !== '') {
            return $language;
        }
    }
    return '';
}

function kubikart_industry_product_language(int $product_id): string
{
    if (function_exists('pll_get_post_language')) {
        $language = pll_get_post_language($product_id, 'slug');
        if (is_string($language) && $language !== '') {
            return $language;
        }
    }
    return '';
}

function kubikart_industry_product_is_valid(int $product_id): bool
{
    return $product_id > 0 && get_post_type($product_id) === 'product';
}

function kubikart_industry_product_is_business_kit(int $product_id, string $language = ''): bool
{
    if (!kubikart_industry_product_is_valid($product_id)) {
        return false;
    }

    $slugs = kubikart_industry_business_kit_slugs();
    $candidate_slugs = isset($slugs[$language]) ? [$slugs[$language]] : array_values($slugs);

    foreach ($candidate_slugs as $slug) {
        if (has_term($slug, 'product_cat', $product_id)) {
            return true;
        }
    }
    return false;
}

/**
 * Validate relationships without mutating metadata.
 */
function kubikart_industry_validate_relationships(
    mixed $featured_kit_id,
    mixed $related_product_ids,
    string $language = ''
): array {
    $featured_kit_id = absint($featured_kit_id);
    $related_product_ids = kubikart_industry_sanitize_id_list($related_product_ids);
    $errors = [];
    $warnings = [];

    if (!kubikart_industry_woocommerce_available()) {
        return [
            'valid' => false,
            'woocommerce_available' => false,
            'featured_kit_id' => $featured_kit_id,
            'related_product_ids' => $related_product_ids,
            'errors' => [],
            'warnings' => [
                __('WooCommerce is unavailable. Existing product relationships were preserved.', 'kubikart-business-industries'),
            ],
        ];
    }

    if ($featured_kit_id > 0 && !kubikart_industry_product_is_business_kit($featured_kit_id, $language)) {
        $errors[] = sprintf(
            __('Featured Kit ID %d is not a valid localized Business Kit product.', 'kubikart-business-industries'),
            $featured_kit_id
        );
    }

    foreach ($related_product_ids as $product_id) {
        if (!kubikart_industry_product_is_valid($product_id)) {
            $errors[] = sprintf(
                __('Related product ID %d no longer refers to a WooCommerce product.', 'kubikart-business-industries'),
                $product_id
            );
            continue;
        }

        $product_language = kubikart_industry_product_language($product_id);
        if ($language && $product_language && $product_language !== $language) {
            $warnings[] = sprintf(
                __('Product “%1$s” is assigned to %2$s rather than %3$s.', 'kubikart-business-industries'),
                get_the_title($product_id),
                $product_language,
                $language
            );
        }
    }

    if ($featured_kit_id > 0) {
        $kit_language = kubikart_industry_product_language($featured_kit_id);
        if ($language && $kit_language && $kit_language !== $language) {
            $warnings[] = sprintf(
                __('Featured Kit “%1$s” is assigned to %2$s rather than %3$s.', 'kubikart-business-industries'),
                get_the_title($featured_kit_id),
                $kit_language,
                $language
            );
        }
    }

    return [
        'valid' => empty($errors),
        'woocommerce_available' => true,
        'featured_kit_id' => $featured_kit_id,
        'related_product_ids' => $related_product_ids,
        'errors' => $errors,
        'warnings' => $warnings,
    ];
}

function kubikart_industry_get_product_choices(int $industry_id): array
{
    if (!kubikart_industry_woocommerce_available()) {
        return [];
    }

    $ids = get_posts([
        'post_type' => 'product',
        'post_status' => ['publish', 'draft', 'pending', 'private'],
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
        'fields' => 'ids',
        'suppress_filters' => false,
    ]);
    $language = kubikart_industry_post_language($industry_id);

    return array_map(static function ($id) use ($language) {
        $id = absint($id);
        $product_language = kubikart_industry_product_language($id);
        return [
            'id' => $id,
            'title' => get_the_title($id),
            'status' => (string) get_post_status($id),
            'language' => $product_language,
            'language_mismatch' => $language && $product_language && $language !== $product_language,
            'is_business_kit' => kubikart_industry_product_is_business_kit($id, $language),
        ];
    }, $ids);
}

function kubikart_industry_order_product_choices(array $products, array $selected_ids): array
{
    $selected_order = array_flip($selected_ids);
    usort($products, static function (array $left, array $right) use ($selected_order): int {
        $left_order = $selected_order[$left['id']] ?? PHP_INT_MAX;
        $right_order = $selected_order[$right['id']] ?? PHP_INT_MAX;
        if ($left_order !== $right_order) {
            return $left_order <=> $right_order;
        }
        if ($left['language_mismatch'] !== $right['language_mismatch']) {
            return $left['language_mismatch'] <=> $right['language_mismatch'];
        }
        return strcasecmp($left['title'], $right['title']);
    });
    return $products;
}

function kubikart_industry_render_relationship_metabox(object $post): void
{
    wp_nonce_field(KUBIKART_INDUSTRY_NONCE_ACTION, KUBIKART_INDUSTRY_NONCE_NAME);

    $featured_kit_id = absint(get_post_meta($post->ID, KUBIKART_INDUSTRY_FEATURED_KIT_META, true));
    $related_ids = kubikart_industry_sanitize_id_list(
        get_post_meta($post->ID, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true)
    );
    $products = kubikart_industry_order_product_choices(
        kubikart_industry_get_product_choices($post->ID),
        $related_ids
    );
    $available_ids = array_column($products, 'id');
    $stale_ids = array_values(array_filter(
        $related_ids,
        static fn (int $id): bool => !in_array($id, $available_ids, true)
    ));

    if (!kubikart_industry_woocommerce_available()) {
        echo '<div class="notice notice-warning inline"><p>';
        echo esc_html__('WooCommerce is unavailable. Saved relationships are retained and cannot be edited safely.', 'kubikart-business-industries');
        echo '</p></div>';
        kubikart_industry_render_saved_ids($featured_kit_id, $related_ids);
        return;
    }

    echo '<div class="kubikart-industry-fields">';
    if (($featured_kit_id && !in_array($featured_kit_id, $available_ids, true)) || $stale_ids) {
        echo '<div class="notice notice-warning inline kubikart-industry-fields__notice"><p>';
        echo esc_html__('Some saved product relationships are stale or unavailable. They will remain stored until an administrator deliberately saves a valid replacement.', 'kubikart-business-industries');
        echo '</p>';
        kubikart_industry_render_saved_ids(
            $featured_kit_id && !in_array($featured_kit_id, $available_ids, true) ? $featured_kit_id : 0,
            $stale_ids
        );
        echo '</div>';
    }
    echo '<section class="kubikart-industry-field">';
    echo '<h3>' . esc_html__('Featured Business Kit', 'kubikart-business-industries') . '</h3>';
    echo '<p class="description">' . esc_html__('Choose one WooCommerce product from the localized Business Kits category.', 'kubikart-business-industries') . '</p>';
    echo '<input type="search" class="widefat kubikart-product-search" data-target="kubikart-featured-kit-list" placeholder="' . esc_attr__('Search Business Kits…', 'kubikart-business-industries') . '">';
    echo '<div id="kubikart-featured-kit-list" class="kubikart-product-list">';
    echo '<label class="kubikart-product-row"><input type="radio" name="kubikart_featured_kit_id" value="0"' . checked($featured_kit_id, 0, false) . '> <span>' . esc_html__('None selected', 'kubikart-business-industries') . '</span></label>';
    foreach ($products as $product) {
        if (!$product['is_business_kit'] && $product['id'] !== $featured_kit_id) {
            continue;
        }
        kubikart_industry_render_product_row($product, 'radio', $featured_kit_id === $product['id']);
    }
    echo '</div></section>';

    echo '<section class="kubikart-industry-field">';
    echo '<h3>' . esc_html__('Related Products', 'kubikart-business-industries') . '</h3>';
    echo '<p class="description">' . esc_html__('Select products and drag selected rows to set their display order.', 'kubikart-business-industries') . '</p>';
    echo '<input type="search" class="widefat kubikart-product-search" data-target="kubikart-related-products-list" placeholder="' . esc_attr__('Search products…', 'kubikart-business-industries') . '">';
    echo '<div id="kubikart-related-products-list" class="kubikart-product-list kubikart-sortable-products">';
    foreach ($products as $product) {
        kubikart_industry_render_product_row($product, 'checkbox', in_array($product['id'], $related_ids, true));
    }
    echo '</div></section></div>';
}

function kubikart_industry_render_saved_ids(int $featured_kit_id, array $related_ids): void
{
    echo '<p><strong>' . esc_html__('Saved featured Kit ID:', 'kubikart-business-industries') . '</strong> ' . esc_html((string) ($featured_kit_id ?: '—')) . '</p>';
    echo '<p><strong>' . esc_html__('Saved related product IDs:', 'kubikart-business-industries') . '</strong> ' . esc_html($related_ids ? implode(', ', $related_ids) : '—') . '</p>';
}

function kubikart_industry_render_product_row(array $product, string $control_type, bool $selected): void
{
    $name = $control_type === 'radio'
        ? 'kubikart_featured_kit_id'
        : 'kubikart_related_product_ids[]';
    $classes = 'kubikart-product-row' . ($selected ? ' is-selected' : '');
    $label = $product['title'] ?: sprintf(__('Product #%d', 'kubikart-business-industries'), $product['id']);
    $search = strtolower($label . ' ' . $product['status'] . ' ' . $product['language']);

    echo '<label class="' . esc_attr($classes) . '" data-product-search="' . esc_attr($search) . '" draggable="' . ($control_type === 'checkbox' ? 'true' : 'false') . '">';
    echo '<input type="' . esc_attr($control_type) . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $product['id']) . '"' . checked($selected, true, false) . '>';
    echo '<span class="kubikart-product-row__content"><strong>' . esc_html($label) . '</strong>';
    echo '<small>' . esc_html(sprintf(
        __('ID %1$d · %2$s', 'kubikart-business-industries'),
        $product['id'],
        $product['status']
    ));
    if ($product['language']) {
        echo ' · ' . esc_html(strtoupper($product['language']));
    }
    echo '</small></span>';
    if ($product['language_mismatch']) {
        echo '<span class="kubikart-language-warning" title="' . esc_attr__('Language differs from this Industry.', 'kubikart-business-industries') . '">!</span>';
    }
    if ($control_type === 'checkbox') {
        echo '<span class="dashicons dashicons-move" aria-hidden="true"></span>';
    }
    echo '</label>';
}

add_action('add_meta_boxes', static function (): void {
    add_meta_box(
        'kubikart-business-industry-products',
        __('Kubikart Product Relationships', 'kubikart-business-industries'),
        'kubikart_industry_render_relationship_metabox',
        KUBIKART_INDUSTRY_POST_TYPE,
        'normal',
        'default'
    );
});

add_action('admin_enqueue_scripts', static function (): void {
    if (!function_exists('get_current_screen')) {
        return;
    }
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== KUBIKART_INDUSTRY_POST_TYPE || !in_array($screen->base, ['post', 'post-new'], true)) {
        return;
    }

    $version = '1.0.0';
    wp_enqueue_style(
        'kubikart-business-industries-admin',
        plugin_dir_url(__FILE__) . 'assets/admin.css',
        [],
        $version
    );
    wp_enqueue_script(
        'kubikart-business-industries-admin',
        plugin_dir_url(__FILE__) . 'assets/admin.js',
        [],
        $version,
        true
    );
});

function kubikart_industry_queue_admin_messages(array $errors, array $warnings): void
{
    if (!$errors && !$warnings) {
        return;
    }
    set_transient(
        'kubikart_industry_messages_' . get_current_user_id(),
        ['errors' => $errors, 'warnings' => $warnings],
        MINUTE_IN_SECONDS
    );
}

add_action('admin_notices', static function (): void {
    $key = 'kubikart_industry_messages_' . get_current_user_id();
    $messages = get_transient($key);
    if (!is_array($messages)) {
        return;
    }
    delete_transient($key);

    foreach (['errors' => 'error', 'warnings' => 'warning'] as $group => $notice_type) {
        foreach (($messages[$group] ?? []) as $message) {
            echo '<div class="notice notice-' . esc_attr($notice_type) . ' is-dismissible"><p>' . esc_html($message) . '</p></div>';
        }
    }
});

function kubikart_save_business_industry_relationships(int $post_id): void
{
    if (
        wp_is_post_autosave($post_id) ||
        wp_is_post_revision($post_id) ||
        get_post_type($post_id) !== KUBIKART_INDUSTRY_POST_TYPE
    ) {
        return;
    }

    $nonce = isset($_POST[KUBIKART_INDUSTRY_NONCE_NAME])
        ? sanitize_text_field(wp_unslash($_POST[KUBIKART_INDUSTRY_NONCE_NAME]))
        : '';
    if (!$nonce || !wp_verify_nonce($nonce, KUBIKART_INDUSTRY_NONCE_ACTION)) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $featured_kit_id = isset($_POST['kubikart_featured_kit_id'])
        ? absint(wp_unslash($_POST['kubikart_featured_kit_id']))
        : 0;
    $related_ids = isset($_POST['kubikart_related_product_ids'])
        ? wp_unslash($_POST['kubikart_related_product_ids'])
        : [];
    $validation = kubikart_industry_validate_relationships(
        $featured_kit_id,
        $related_ids,
        kubikart_industry_post_language($post_id)
    );

    kubikart_industry_queue_admin_messages($validation['errors'], $validation['warnings']);
    if (!$validation['valid']) {
        return;
    }

    if ($validation['featured_kit_id'] > 0) {
        update_post_meta($post_id, KUBIKART_INDUSTRY_FEATURED_KIT_META, $validation['featured_kit_id']);
    } else {
        delete_post_meta($post_id, KUBIKART_INDUSTRY_FEATURED_KIT_META);
    }

    if ($validation['related_product_ids']) {
        update_post_meta($post_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, $validation['related_product_ids']);
    } else {
        delete_post_meta($post_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META);
    }
}
add_action('save_post_' . KUBIKART_INDUSTRY_POST_TYPE, 'kubikart_save_business_industry_relationships');

/**
 * Send a signed future-facing Industry event through the existing revalidation
 * endpoint. Phase 7B can map these topics to its final tags and paths.
 */
function kubikart_revalidate_business_industry(int $post_id, string $action = 'updated'): void
{
    $post = get_post($post_id);
    if (!$post || $post->post_type !== KUBIKART_INDUSTRY_POST_TYPE) {
        return;
    }
    if (!defined('KUBIKART_FRONTEND_URL') || !defined('KUBIKART_REVALIDATE_SECRET') || !KUBIKART_REVALIDATE_SECRET) {
        return;
    }

    $translations = [];
    if (function_exists('pll_get_post_translations')) {
        foreach ((array) pll_get_post_translations($post_id) as $language => $translation_id) {
            $translation = get_post(absint($translation_id));
            if ($translation && $translation->post_type === KUBIKART_INDUSTRY_POST_TYPE) {
                $translations[sanitize_key($language)] = [
                    'id' => absint($translation_id),
                    'slug' => (string) ($translation->post_name ?? ''),
                ];
            }
        }
    }
    if (!$translations) {
        $language = kubikart_industry_post_language($post_id);
        if ($language) {
            $translations[$language] = [
                'id' => $post_id,
                'slug' => (string) ($post->post_name ?? ''),
            ];
        }
    }

    $body = wp_json_encode([
        'id' => $post_id,
        'slug' => (string) ($post->post_name ?? ''),
        'status' => (string) ($post->post_status ?? ''),
        'language' => kubikart_industry_post_language($post_id),
        'translations' => $translations,
    ]);
    $signature = base64_encode(hash_hmac('sha256', $body, KUBIKART_REVALIDATE_SECRET, true));

    wp_remote_post(trailingslashit(KUBIKART_FRONTEND_URL) . 'api/revalidate', [
        'blocking' => false,
        'timeout' => 0.5,
        'headers' => [
            'Content-Type' => 'application/json',
            'X-WC-Webhook-Signature' => $signature,
            'X-WC-Webhook-Topic' => 'industry.' . sanitize_key($action),
        ],
        'body' => $body,
    ]);
}

add_action('save_post_' . KUBIKART_INDUSTRY_POST_TYPE, static function (int $post_id): void {
    if (!wp_is_post_autosave($post_id) && !wp_is_post_revision($post_id)) {
        kubikart_revalidate_business_industry($post_id, 'updated');
    }
}, 20);
add_action('trashed_post', static function (int $post_id): void {
    kubikart_revalidate_business_industry($post_id, 'trashed');
});
add_action('untrashed_post', static function (int $post_id): void {
    kubikart_revalidate_business_industry($post_id, 'restored');
});
add_action('before_delete_post', static function (int $post_id): void {
    kubikart_revalidate_business_industry($post_id, 'deleted');
});

function kubikart_activate_business_industries(): void
{
    kubikart_register_business_industry_post_type();
    flush_rewrite_rules();
}

function kubikart_deactivate_business_industries(): void
{
    flush_rewrite_rules();
}

register_activation_hook(__FILE__, 'kubikart_activate_business_industries');
register_deactivation_hook(__FILE__, 'kubikart_deactivate_business_industries');
