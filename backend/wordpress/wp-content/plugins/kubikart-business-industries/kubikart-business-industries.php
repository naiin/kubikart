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
/** Retired single-bundle field; only the migration reads it. */
const KUBIKART_INDUSTRY_FEATURED_KIT_META = '_kubikart_featured_kit_id';
const KUBIKART_INDUSTRY_BUNDLES_META = '_kubikart_bundle_ids';
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

    foreach ([KUBIKART_INDUSTRY_BUNDLES_META, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META] as $meta_key) {
        register_post_meta(KUBIKART_INDUSTRY_POST_TYPE, $meta_key, [
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
}
add_action('init', 'kubikart_register_business_industry_meta', 20);

/**
 * Expose the two ordered relationship lists: Business Bundles and individual
 * products. A published Industry may be read by an authenticated account with
 * read_post; writes still require edit_post and pass the same WooCommerce
 * validation as the admin metabox. The legacy single "featured kit" field no
 * longer exists (see backend/scripts/migrate-industry-relations.php).
 */
function kubikart_register_business_industry_rest_fields(): void
{
    $register = static function (string $field): void {
        register_rest_field(KUBIKART_INDUSTRY_POST_TYPE, $field, [
            'get_callback' => static function (array $object) use ($field): array {
                $post_id = absint($object['id'] ?? 0);
                if (!$post_id || !current_user_can('read_post', $post_id)) {
                    return [];
                }
                return kubikart_industry_sanitize_id_list(get_post_meta($post_id, $field, true));
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

                $bundles = $field === KUBIKART_INDUSTRY_BUNDLES_META
                    ? $value
                    : get_post_meta($post_id, KUBIKART_INDUSTRY_BUNDLES_META, true);
                $products = $field === KUBIKART_INDUSTRY_RELATED_PRODUCTS_META
                    ? $value
                    : get_post_meta($post_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true);
                $validation = kubikart_industry_validate_relationships(
                    $bundles,
                    $products,
                    kubikart_industry_post_language($post_id)
                );

                if (!$validation['valid']) {
                    return new WP_Error(
                        'kubikart_industry_invalid_relationship',
                        implode(' ', $validation['errors'] ?: $validation['warnings']),
                        ['status' => 400]
                    );
                }

                // An empty list is a deliberate choice and stays stored as an empty list.
                update_post_meta(
                    $post_id,
                    $field,
                    $field === KUBIKART_INDUSTRY_BUNDLES_META ? $validation['bundle_ids'] : $validation['product_ids']
                );
                return true;
            },
            'schema' => [
                'description' => $field === KUBIKART_INDUSTRY_BUNDLES_META
                    ? __('Ordered Business Bundle WooCommerce Product IDs for this Industry.', 'kubikart-business-industries')
                    : __('Ordered individual WooCommerce Product IDs for this Industry.', 'kubikart-business-industries'),
                'type' => 'array',
                'items' => ['type' => 'integer'],
                'context' => ['view', 'edit'],
            ],
        ]);
    };

    $register(KUBIKART_INDUSTRY_BUNDLES_META);
    $register(KUBIKART_INDUSTRY_RELATED_PRODUCTS_META);
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
 * Validate relationships without mutating metadata. Business Bundles must be
 * Business Bundle products of the Industry's language; individual products may
 * be any other existing product (a bundle belongs in the bundle list).
 */
function kubikart_industry_validate_relationships(
    mixed $bundle_ids,
    mixed $product_ids,
    string $language = ''
): array {
    $bundle_ids = kubikart_industry_sanitize_id_list($bundle_ids);
    $product_ids = kubikart_industry_sanitize_id_list($product_ids);
    $errors = [];
    $warnings = [];

    if (!kubikart_industry_woocommerce_available()) {
        return [
            'valid' => false,
            'woocommerce_available' => false,
            'bundle_ids' => $bundle_ids,
            'product_ids' => $product_ids,
            'errors' => [],
            'warnings' => [
                __('WooCommerce is unavailable. Existing product relationships were preserved.', 'kubikart-business-industries'),
            ],
        ];
    }

    foreach ($bundle_ids as $bundle_id) {
        if (!kubikart_industry_product_is_business_kit($bundle_id, $language)) {
            $errors[] = sprintf(
                __('Product ID %d is not a valid Business Bundle in this language.', 'kubikart-business-industries'),
                $bundle_id
            );
        }
    }

    foreach ($product_ids as $product_id) {
        if (!kubikart_industry_product_is_valid($product_id)) {
            $errors[] = sprintf(
                __('Product ID %d no longer refers to a WooCommerce product.', 'kubikart-business-industries'),
                $product_id
            );
            continue;
        }
        if (kubikart_industry_product_is_business_kit($product_id)) {
            $errors[] = sprintf(
                __('“%s” is a Business Bundle. Add it under Business Bundles, not Individual Products.', 'kubikart-business-industries'),
                get_the_title($product_id)
            );
        }
        if (in_array($product_id, $bundle_ids, true)) {
            $errors[] = sprintf(
                __('Product ID %d is listed as a bundle and as an individual product.', 'kubikart-business-industries'),
                $product_id
            );
        }
    }

    foreach (array_merge($bundle_ids, $product_ids) as $product_id) {
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

    return [
        'valid' => empty($errors),
        'woocommerce_available' => true,
        'bundle_ids' => $bundle_ids,
        'product_ids' => $product_ids,
        'errors' => $errors,
        'warnings' => $warnings,
    ];
}

/**
 * Products offered in the two pickers. Choices are limited to the Industry's
 * language (all languages if the Industry has none), so a German page never
 * offers English products. Each product carries its bundle flag.
 */
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

    $choices = array_map(static function ($id) use ($language) {
        $id = absint($id);
        $product_language = kubikart_industry_product_language($id);
        return [
            'id' => $id,
            'title' => get_the_title($id),
            'status' => (string) get_post_status($id),
            'language' => $product_language,
            'language_mismatch' => $language && $product_language && $language !== $product_language,
            'is_business_kit' => kubikart_industry_product_is_business_kit($id, $language ?: $product_language),
        ];
    }, $ids);

    return array_values(array_filter($choices, static fn (array $choice): bool => !$choice['language_mismatch']));
}

/**
 * One picker: the ordered, saved selection on top (up/down/remove) and the
 * searchable list of remaining eligible products below (add).
 */
function kubikart_industry_render_picker(string $dom_id, string $field_name, string $title, string $help, array $choices, array $selected_ids, string $empty_text): void
{
    $by_id = [];
    foreach ($choices as $choice) {
        $by_id[$choice['id']] = $choice;
    }

    echo '<section class="kubikart-industry-field kubikart-picker" id="' . esc_attr($dom_id) . '" data-field="' . esc_attr($field_name) . '">';
    echo '<header class="kubikart-picker__head">';
    echo '<h3>' . esc_html($title) . '</h3>';
    echo '<p class="description">' . esc_html($help) . '</p>';
    echo '</header>';
    echo '<div class="kubikart-picker__body">';
    echo '<input type="hidden" name="' . esc_attr($field_name . '_present') . '" value="1">';

    echo '<h4>' . esc_html__('Ausgewählt (Reihenfolge = Anzeige auf der Seite)', 'kubikart-business-industries') . '</h4>';
    echo '<ol class="kubikart-selected" aria-label="' . esc_attr($title) . '">';
    foreach ($selected_ids as $id) {
        $choice = $by_id[$id] ?? [
            'id' => $id,
            'title' => get_the_title($id) ?: sprintf(__('Nicht verfügbares Produkt #%d', 'kubikart-business-industries'), $id),
            'status' => (string) (get_post_status($id) ?: 'unavailable'),
            'language' => kubikart_industry_product_language($id),
            'language_mismatch' => false,
            'is_business_kit' => false,
        ];
        kubikart_industry_render_picker_row($choice, $field_name, true);
    }
    echo '</ol>';
    echo '<p class="kubikart-empty description"' . ($selected_ids ? ' hidden' : '') . '>' . esc_html($empty_text) . '</p>';

    echo '<h4>' . esc_html__('Hinzufügen', 'kubikart-business-industries') . '</h4>';
    echo '<input type="search" class="widefat kubikart-product-search" placeholder="' . esc_attr__('Suchen …', 'kubikart-business-industries') . '" aria-label="' . esc_attr(sprintf(__('%s durchsuchen', 'kubikart-business-industries'), $title)) . '">';
    echo '<ul class="kubikart-available">';
    foreach ($choices as $choice) {
        if (in_array($choice['id'], $selected_ids, true)) {
            continue;
        }
        kubikart_industry_render_picker_row($choice, $field_name, false);
    }
    echo '</ul>';
    echo '</div>';
    echo '</section>';
}

function kubikart_industry_render_picker_row(array $product, string $field_name, bool $selected): void
{
    $label = $product['title'] ?: sprintf(__('Produkt #%d', 'kubikart-business-industries'), $product['id']);
    $search = strtolower($label . ' ' . $product['status'] . ' ' . $product['language']);

    echo '<li class="kubikart-product-row" data-id="' . esc_attr((string) $product['id']) . '" data-product-search="' . esc_attr($search) . '">';
    echo '<input type="hidden" name="' . esc_attr($field_name) . '[]" value="' . esc_attr((string) $product['id']) . '"' . ($selected ? '' : ' disabled') . '>';
    echo '<span class="kubikart-product-row__content"><strong>' . esc_html($label) . '</strong>';
    echo '<small>' . esc_html(sprintf(__('ID %1$d · %2$s', 'kubikart-business-industries'), $product['id'], $product['status']));
    if ($product['language']) {
        echo ' · ' . esc_html(strtoupper($product['language']));
    }
    echo '</small></span>';
    echo '<span class="kubikart-product-row__actions">';
    echo '<button type="button" class="button button-small" data-action="up" aria-label="' . esc_attr(sprintf(__('%s nach oben', 'kubikart-business-industries'), $label)) . '">↑</button>';
    echo '<button type="button" class="button button-small" data-action="down" aria-label="' . esc_attr(sprintf(__('%s nach unten', 'kubikart-business-industries'), $label)) . '">↓</button>';
    echo '<button type="button" class="button button-small" data-action="remove" aria-label="' . esc_attr(sprintf(__('%s entfernen', 'kubikart-business-industries'), $label)) . '">' . esc_html__('Entfernen', 'kubikart-business-industries') . '</button>';
    echo '<button type="button" class="button button-small button-primary" data-action="add" aria-label="' . esc_attr(sprintf(__('%s hinzufügen', 'kubikart-business-industries'), $label)) . '">' . esc_html__('Hinzufügen', 'kubikart-business-industries') . '</button>';
    echo '</span>';
    echo '</li>';
}

function kubikart_industry_render_relationship_metabox(object $post): void
{
    wp_nonce_field(KUBIKART_INDUSTRY_NONCE_ACTION, KUBIKART_INDUSTRY_NONCE_NAME);

    if (!kubikart_industry_woocommerce_available()) {
        echo '<div class="notice notice-warning inline"><p>';
        echo esc_html__('WooCommerce is unavailable. Saved relationships are retained and cannot be edited safely.', 'kubikart-business-industries');
        echo '</p></div>';
        return;
    }

    $bundle_ids = kubikart_industry_sanitize_id_list(get_post_meta($post->ID, KUBIKART_INDUSTRY_BUNDLES_META, true));
    $product_ids = kubikart_industry_sanitize_id_list(get_post_meta($post->ID, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true));
    $choices = kubikart_industry_get_product_choices($post->ID);
    $bundle_choices = array_values(array_filter($choices, static fn (array $choice): bool => $choice['is_business_kit']));
    $product_choices = array_values(array_filter($choices, static fn (array $choice): bool => !$choice['is_business_kit']));

    echo '<div class="kubikart-industry-fields">';
    echo '<p class="description kubikart-industry-fields__intro"><strong>' . esc_html__('Hier legst du fest, welche Business-Pakete und Einzelprodukte diese Branchenseite zeigt – genau in dieser Reihenfolge.', 'kubikart-business-industries') . '</strong> ' . esc_html__('Die Auswahl bestimmt nicht, was ein Business-Paket enthält (das pflegst du im Produkt unter „Kubikart: Paketinhalt“). Eine leere Liste bleibt leer: dann erscheint der Abschnitt nicht.', 'kubikart-business-industries') . '</p>';

    kubikart_industry_render_picker(
        'kubikart-bundles-picker',
        'kubikart_bundle_ids',
        __('Business-Pakete', 'kubikart-business-industries'),
        __('Nur Produkte der Kategorie Business-Pakete in der Sprache dieser Seite. Das erste Paket wird zuerst angezeigt.', 'kubikart-business-industries'),
        $bundle_choices,
        $bundle_ids,
        __('Keine Business-Pakete ausgewählt – der Abschnitt wird auf der Seite nicht angezeigt.', 'kubikart-business-industries')
    );
    kubikart_industry_render_picker(
        'kubikart-products-picker',
        'kubikart_related_product_ids',
        __('Einzelprodukte', 'kubikart-business-industries'),
        __('Alle Produkte außer Business-Paketen in der Sprache dieser Seite.', 'kubikart-business-industries'),
        $product_choices,
        $product_ids,
        __('Keine Einzelprodukte ausgewählt – der Abschnitt wird auf der Seite nicht angezeigt.', 'kubikart-business-industries')
    );
    echo '</div>';
}

add_action('add_meta_boxes', static function (): void {
    add_meta_box(
        'kubikart-business-industry-products',
        __('Kubikart: Business-Pakete und Einzelprodukte dieser Branche', 'kubikart-business-industries'),
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

    $asset_version = static fn (string $file): string => (string) (@filemtime(__DIR__ . '/assets/' . $file) ?: '1.0.0');
    wp_enqueue_style(
        'kubikart-business-industries-admin',
        plugin_dir_url(__FILE__) . 'assets/admin.css',
        [],
        $asset_version('admin.css')
    );
    wp_enqueue_script(
        'kubikart-business-industries-admin',
        plugin_dir_url(__FILE__) . 'assets/admin.js',
        [],
        $asset_version('admin.js'),
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

    // A list is only replaced when its section was part of the submitted form;
    // a submitted-but-empty list is a deliberate choice and is stored as empty.
    $bundles_submitted = isset($_POST['kubikart_bundle_ids_present']);
    $products_submitted = isset($_POST['kubikart_related_product_ids_present']);
    if (!$bundles_submitted && !$products_submitted) {
        return;
    }

    $bundle_ids = $bundles_submitted
        ? (isset($_POST['kubikart_bundle_ids']) ? wp_unslash($_POST['kubikart_bundle_ids']) : [])
        : get_post_meta($post_id, KUBIKART_INDUSTRY_BUNDLES_META, true);
    $product_ids = $products_submitted
        ? (isset($_POST['kubikart_related_product_ids']) ? wp_unslash($_POST['kubikart_related_product_ids']) : [])
        : get_post_meta($post_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true);
    $validation = kubikart_industry_validate_relationships(
        $bundle_ids,
        $product_ids,
        kubikart_industry_post_language($post_id)
    );

    kubikart_industry_queue_admin_messages($validation['errors'], $validation['warnings']);
    if (!$validation['valid']) {
        return;
    }

    update_post_meta($post_id, KUBIKART_INDUSTRY_BUNDLES_META, $validation['bundle_ids']);
    update_post_meta($post_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, $validation['product_ids']);
    // The retired single-bundle field must not linger beside the new list.
    delete_post_meta($post_id, KUBIKART_INDUSTRY_FEATURED_KIT_META);
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

    $payload = [
        'id' => $post_id,
        'slug' => (string) ($post->post_name ?? ''),
        'status' => (string) ($post->post_status ?? ''),
        'language' => kubikart_industry_post_language($post_id),
        'translations' => $translations,
    ];
    if (function_exists('kubikart_frontend_revalidate_queue')) {
        // Deduplicated and delivered on shutdown, after REST meta has been written.
        kubikart_frontend_revalidate_queue('industry.' . sanitize_key($action), $payload);
        return;
    }

    $body = wp_json_encode($payload);
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
