<?php
/**
 * Plugin Name: Kubikart Business Kit Contents
 * Description: Display-only "Paketinhalt" and order mode for Business Kit WooCommerce products.
 * Version: 1.0.0
 * Author: Kubikart
 */

if (!defined('ABSPATH')) exit;

const KUBIKART_KIT_VERSION = '1.0.0';
const KUBIKART_KIT_SCHEMA_VERSION = 1;
const KUBIKART_KIT_ORDER_MODE_META_KEY = '_kubikart_kit_order_mode';
const KUBIKART_KIT_SCOPE_SUMMARY_META_KEY = '_kubikart_kit_scope_summary';
const KUBIKART_KIT_CONTENTS_META_KEY = '_kubikart_kit_contents';
const KUBIKART_KIT_REST_META_KEY = '_kubikart_kit';
const KUBIKART_KIT_NONCE_ACTION = 'kubikart_kit_contents_save';
const KUBIKART_KIT_NONCE_FIELD = 'kubikart_kit_contents_nonce';
const KUBIKART_KIT_MAX_ITEMS = 30;
const KUBIKART_KIT_MAX_QUANTITY = 999;
const KUBIKART_KIT_MAX_TITLE_LENGTH = 120;
const KUBIKART_KIT_MAX_DESCRIPTION_LENGTH = 500;

function kubikart_kit_category_slugs(): array {
    return ['business-kits-de', 'business-kits'];
}

function kubikart_is_business_kit($post_id): bool {
    $post_id = absint($post_id);
    if ($post_id <= 0) {
        return false;
    }

    foreach (kubikart_kit_category_slugs() as $slug) {
        if (has_term($slug, 'product_cat', $post_id)) {
            return true;
        }
    }
    return false;
}

function kubikart_kit_order_modes(): array {
    return [
        '' => 'Nicht festgelegt (nur Anfrage)',
        'purchase' => 'Direkt kaufen',
        'enquiry' => 'Nur auf Anfrage',
    ];
}

/** Unset (or anything unknown) is deliberately treated as enquiry. */
function kubikart_kit_effective_order_mode($post_id): string {
    $stored = get_post_meta($post_id, KUBIKART_KIT_ORDER_MODE_META_KEY, true);
    return $stored === 'purchase' ? 'purchase' : 'enquiry';
}

function kubikart_kit_post_language(int $post_id): string {
    if ($post_id > 0 && function_exists('pll_get_post_language')) {
        $language = pll_get_post_language($post_id, 'slug');
        if (is_string($language) && $language !== '') {
            return $language;
        }
    }
    return '';
}

function kubikart_kit_translation_id(int $post_id, string $language): int {
    if ($post_id > 0 && $language !== '' && function_exists('pll_get_post')) {
        return absint(pll_get_post($post_id, $language));
    }
    return 0;
}

/**
 * Plain text only: decode entities first so encoded markup cannot survive the
 * tag stripping, keep line breaks for multiline descriptions.
 */
function kubikart_kit_plain_text($value, bool $multiline = false): string {
    if (!is_string($value)) {
        return '';
    }

    $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
    $value = strip_tags($value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = $multiline
        ? preg_replace("/[ \t]+/", ' ', $value)
        : preg_replace('/\s+/u', ' ', $value);

    return trim((string) $value);
}

/**
 * Read the stored payload defensively. Never mutates it.
 */
/**
 * Symbols available for the illustrative package overview on the storefront.
 */
function kubikart_kit_icon_options(): array {
    return [
        '' => 'Kein Symbol',
        'stand' => 'Aufsteller (QR/NFC)',
        'table-stand' => 'Tischaufsteller',
        'sheet' => 'Laminiertes Blatt / Preisliste',
        'decal-logo' => 'Folie: Logo',
        'decal-hours' => 'Folie: Öffnungszeiten',
        'decal-text' => 'Folie: Text',
        'mirror-decal' => 'Spiegelbeschriftung',
        'sign' => 'Logo-Schild',
        'plaque' => 'Türschild',
        'guide' => 'Übertragungsfolie / Anleitung',
        'design' => 'Gestaltung / Entwurf',
    ];
}

function kubikart_kit_sanitize_icon($value): string {
    $value = is_string($value) ? sanitize_key($value) : '';
    return array_key_exists($value, kubikart_kit_icon_options()) ? $value : '';
}

function kubikart_kit_normalize_contents($raw): array {
    if (!is_array($raw) || !isset($raw['items']) || !is_array($raw['items'])) {
        return [];
    }

    $items = [];
    foreach ($raw['items'] as $item) {
        if (!is_array($item)) {
            continue;
        }
        $items[] = [
            'id' => is_string($item['id'] ?? null) ? $item['id'] : '',
            'product_id' => absint($item['product_id'] ?? 0),
            'variation_id' => absint($item['variation_id'] ?? 0),
            'quantity' => max(1, min(KUBIKART_KIT_MAX_QUANTITY, absint($item['quantity'] ?? 1))),
            'title' => kubikart_kit_plain_text($item['title'] ?? ''),
            'description' => kubikart_kit_plain_text($item['description'] ?? '', true),
            'image_id' => absint($item['image_id'] ?? 0),
            'icon' => kubikart_kit_sanitize_icon($item['icon'] ?? ''),
        ];
    }
    return $items;
}

function kubikart_kit_get_items(int $post_id): array {
    return kubikart_kit_normalize_contents(get_post_meta($post_id, KUBIKART_KIT_CONTENTS_META_KEY, true));
}

/**
 * Map a (product, variation) pair into the kit's Polylang language.
 *
 * Returns null when the product is in another language and has no usable
 * translation. Translation IDs are never assumed to be interchangeable.
 */
function kubikart_kit_map_language(int $product_id, int $variation_id, string $kit_language): ?array {
    $same = ['product_id' => $product_id, 'variation_id' => $variation_id, 'translated' => false];
    if ($kit_language === '') {
        return $same;
    }

    $product_language = kubikart_kit_post_language($product_id);
    if ($product_language === '' || $product_language === $kit_language) {
        return $same;
    }

    $translated_product = kubikart_kit_translation_id($product_id, $kit_language);
    if ($translated_product <= 0) {
        return null;
    }

    $translated_variation = 0;
    if ($variation_id > 0) {
        $candidate = kubikart_kit_translation_id($variation_id, $kit_language);
        $candidate_post = $candidate > 0 ? get_post($candidate) : null;
        if (
            $candidate_post
            && get_post_type($candidate) === 'product_variation'
            && absint($candidate_post->post_parent ?? 0) === $translated_product
        ) {
            $translated_variation = $candidate;
        }
    }

    return [
        'product_id' => $translated_product,
        'variation_id' => $translated_variation,
        'translated' => true,
    ];
}

function kubikart_kit_validate_content_row(int $number, array $row, int $kit_id, array &$errors): ?array {
    $label = sprintf('Eintrag %d', $number);

    foreach (['id', 'product_id', 'variation_id', 'quantity', 'title', 'description', 'image_id', 'icon'] as $key) {
        if (isset($row[$key]) && !is_scalar($row[$key])) {
            $errors[] = sprintf('%s: Ungültige Daten im Feld „%s“.', $label, $key);
            return null;
        }
    }

    $product_raw = trim((string) ($row['product_id'] ?? ''));
    $variation_raw = trim((string) ($row['variation_id'] ?? ''));
    $image_raw = trim((string) ($row['image_id'] ?? ''));
    $quantity_raw = trim((string) ($row['quantity'] ?? ''));
    $title = sanitize_text_field((string) ($row['title'] ?? ''));
    $description = str_replace(["\r\n", "\r"], "\n", sanitize_textarea_field((string) ($row['description'] ?? '')));

    $product_id = (int) $product_raw;
    $variation_id = (int) $variation_raw;
    $image_id = (int) $image_raw;

    // Rows the editor never touched (quantity defaults to 1) are skipped silently.
    if (
        !$product_id && !$variation_id && !$image_id
        && $title === '' && $description === ''
        && ($product_raw === '' || $product_raw === '0')
        && ($variation_raw === '' || $variation_raw === '0')
        && ($image_raw === '' || $image_raw === '0')
    ) {
        return null;
    }

    $valid = true;
    foreach ([['Produkt', $product_raw], ['Variante', $variation_raw], ['Bild', $image_raw]] as [$name, $raw]) {
        if ($raw !== '' && !ctype_digit($raw)) {
            $errors[] = sprintf('%s: Ungültige %s-ID.', $label, $name);
            $valid = false;
        }
    }
    if (!$valid) {
        return null;
    }

    if (!ctype_digit($quantity_raw) || (int) $quantity_raw < 1 || (int) $quantity_raw > KUBIKART_KIT_MAX_QUANTITY) {
        $errors[] = sprintf('%s: Die Menge muss eine ganze Zahl zwischen 1 und %d sein.', $label, KUBIKART_KIT_MAX_QUANTITY);
        $valid = false;
    }

    if (mb_strlen($title) > KUBIKART_KIT_MAX_TITLE_LENGTH) {
        $errors[] = sprintf('%s: Der Titel darf höchstens %d Zeichen lang sein.', $label, KUBIKART_KIT_MAX_TITLE_LENGTH);
        $valid = false;
    }
    if (mb_strlen($description) > KUBIKART_KIT_MAX_DESCRIPTION_LENGTH) {
        $errors[] = sprintf('%s: Die Beschreibung darf höchstens %d Zeichen lang sein.', $label, KUBIKART_KIT_MAX_DESCRIPTION_LENGTH);
        $valid = false;
    }

    // The WooCommerce product search returns a variation ID for variations.
    if ($product_id > 0 && $variation_id === 0 && get_post_type($product_id) === 'product_variation') {
        $variation_id = $product_id;
        $product_id = absint(get_post($variation_id)->post_parent ?? 0);
    }

    if ($product_id === 0 && $variation_id > 0) {
        $errors[] = sprintf('%s: Eine Variante benötigt ein verknüpftes Produkt.', $label);
        $valid = false;
    }

    if ($product_id > 0) {
        if ($product_id === $kit_id) {
            $errors[] = sprintf('%s: Ein Paket kann sich nicht selbst enthalten.', $label);
            $valid = false;
        } elseif (get_post_type($product_id) !== 'product' || get_post_status($product_id) === 'trash') {
            $errors[] = sprintf('%s: Das verknüpfte Produkt (ID %d) existiert nicht.', $label, $product_id);
            $valid = false;
        } elseif ($variation_id > 0) {
            $variation = get_post($variation_id);
            if (
                get_post_type($variation_id) !== 'product_variation'
                || !$variation
                || absint($variation->post_parent ?? 0) !== $product_id
            ) {
                $errors[] = sprintf('%s: Die Variante (ID %d) gehört nicht zum gewählten Produkt.', $label, $variation_id);
                $valid = false;
            }
        }
    } elseif ($title === '') {
        $errors[] = sprintf('%s: Bitte ein Produkt verknüpfen oder einen Titel angeben.', $label);
        $valid = false;
    }

    if ($image_id > 0 && !wp_attachment_is_image($image_id)) {
        $errors[] = sprintf('%s: Die Bild-ID %d ist kein gültiges Bild.', $label, $image_id);
        $valid = false;
    }

    if (!$valid) {
        return null;
    }

    $id = sanitize_key((string) ($row['id'] ?? ''));
    return [
        'id' => preg_match('/^[a-z0-9-]{8,40}$/', $id) ? $id : '',
        'product_id' => $product_id,
        'variation_id' => $variation_id,
        'quantity' => (int) $quantity_raw,
        'title' => $title,
        'description' => $description,
        'image_id' => $image_id,
        'icon' => kubikart_kit_sanitize_icon($row['icon'] ?? ''),
    ];
}

/**
 * Validate submitted rows + order mode. Any error rejects the whole save so the
 * stored meta stays untouched.
 */
function kubikart_kit_sanitize_contents_payload($raw_items, $raw_mode, $kit_id = 0): array {
    $kit_id = absint($kit_id);
    $errors = [];
    $warnings = [];
    $items = [];

    $mode = is_string($raw_mode) ? sanitize_key($raw_mode) : null;
    if ($mode === null || !array_key_exists($mode, kubikart_kit_order_modes())) {
        $errors[] = 'Die gewählte Bestellart ist ungültig.';
        $mode = '';
    }

    if ($raw_items === null || $raw_items === '') {
        $raw_items = [];
    }
    if (!is_array($raw_items)) {
        return [
            'valid' => false,
            'errors' => array_merge($errors, ['Die übermittelten Paketinhalte hatten ein ungültiges Format.']),
            'warnings' => [],
            'order_mode' => $mode,
            'payload' => null,
        ];
    }

    $kit_language = kubikart_kit_post_language($kit_id);
    $seen_ids = [];
    $number = 0;

    foreach ($raw_items as $row) {
        $number++;
        if (!is_array($row)) {
            $errors[] = sprintf('Eintrag %d ist ungültig.', $number);
            continue;
        }

        $item = kubikart_kit_validate_content_row($number, $row, $kit_id, $errors);
        if ($item === null) {
            continue;
        }

        if ($item['product_id'] > 0) {
            $mapped = kubikart_kit_map_language($item['product_id'], $item['variation_id'], $kit_language);
            if ($mapped === null) {
                $warnings[] = sprintf(
                    'Eintrag %d: „%s“ gehört zu einer anderen Sprache (%s) als dieses Paket (%s) und hat keine Übersetzung. Der Eintrag wird auf der Paketseite nicht verlinkt.',
                    $number,
                    get_the_title($item['product_id']),
                    kubikart_kit_post_language($item['product_id']),
                    $kit_language
                );
            } elseif ($mapped['translated']) {
                $warnings[] = sprintf(
                    'Eintrag %d: „%s“ wurde automatisch durch die Übersetzung in der Sprache des Pakets (%s) ersetzt (ID %d).',
                    $number,
                    get_the_title($item['product_id']),
                    $kit_language,
                    $mapped['product_id']
                );
                $item['product_id'] = $mapped['product_id'];
                $item['variation_id'] = $mapped['variation_id'];
            }
        }

        if ($item['id'] === '' || isset($seen_ids[$item['id']])) {
            $item['id'] = function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : bin2hex(random_bytes(16));
        }
        $seen_ids[$item['id']] = true;
        $items[] = $item;
    }

    if (count($items) > KUBIKART_KIT_MAX_ITEMS) {
        $errors[] = sprintf('Ein Paket darf höchstens %d Einträge enthalten.', KUBIKART_KIT_MAX_ITEMS);
    }

    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'warnings' => $warnings,
        'order_mode' => $mode,
        'payload' => [
            'schema_version' => KUBIKART_KIT_SCHEMA_VERSION,
            'items' => $items,
        ],
    ];
}

function kubikart_kit_price($post_id): float {
    if (function_exists('wc_get_product')) {
        $product = wc_get_product($post_id);
        if ($product) {
            return (float) $product->get_price();
        }
    }
    $price = get_post_meta($post_id, '_price', true);
    return is_numeric($price) ? (float) $price : 0.0;
}

function kubikart_kit_has_custom_fields($post_id): bool {
    $raw = get_post_meta($post_id, '_kubikart_custom_fields', true);
    if (!is_array($raw)) {
        return false;
    }
    $fields = isset($raw['fields']) && is_array($raw['fields']) ? $raw['fields'] : (array_is_list($raw) ? $raw : []);
    return !empty($fields);
}

/**
 * REST resolution
 */
function kubikart_kit_attachment_data(int $attachment_id, string $fallback_alt = ''): ?array {
    if ($attachment_id <= 0) {
        return null;
    }
    $src = wp_get_attachment_image_url($attachment_id, 'large');
    if (!is_string($src) || $src === '') {
        return null;
    }
    $alt = kubikart_kit_plain_text((string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true));
    return ['src' => $src, 'alt' => $alt !== '' ? $alt : $fallback_alt];
}

/**
 * Resolve a linked product for display. Availability (stock) is intentionally
 * never considered.
 */
function kubikart_kit_load_linked_product(int $product_id, int $variation_id): ?array {
    if (!function_exists('wc_get_product') || get_post_type($product_id) !== 'product') {
        return null;
    }

    $parent = wc_get_product($product_id);
    if (
        !$parent
        || $parent->get_status() !== 'publish'
        || $parent->get_catalog_visibility() === 'hidden'
    ) {
        return null;
    }

    $source = $parent;
    if ($variation_id > 0) {
        $variation = get_post_type($variation_id) === 'product_variation' ? wc_get_product($variation_id) : false;
        if (
            !$variation
            || $variation->get_status() !== 'publish'
            || absint($variation->get_parent_id()) !== $product_id
        ) {
            return null;
        }
        $source = $variation;
    }

    $name = kubikart_kit_plain_text((string) $source->get_name());
    $image_id = absint($source->get_image_id()) ?: absint($parent->get_image_id());

    return [
        'id' => $product_id,
        'variation_id' => $variation_id,
        'name' => $name,
        'slug' => (string) $parent->get_slug(),
        'image' => kubikart_kit_attachment_data($image_id, $name),
    ];
}

function kubikart_kit_resolve_link(array $item, string $kit_language): array {
    if ($item['product_id'] <= 0) {
        return ['state' => 'unlinked', 'product' => null];
    }

    $mapped = kubikart_kit_map_language($item['product_id'], $item['variation_id'], $kit_language);
    if ($mapped === null) {
        return ['state' => 'language_mismatch', 'product' => null];
    }

    $product = kubikart_kit_load_linked_product($mapped['product_id'], $mapped['variation_id']);
    return $product
        ? ['state' => 'linked', 'product' => $product]
        : ['state' => 'unavailable', 'product' => null];
}

/**
 * Build the read-only REST value; null for non-kit products.
 */
function kubikart_kit_build_rest_payload($post_id): ?array {
    $post_id = absint($post_id);
    if (!kubikart_is_business_kit($post_id)) {
        return null;
    }

    $stored_mode = function_exists('kubikart_get_purchase_mode')
        ? (function_exists('kubikart_purchase_mode_is_explicit') && kubikart_purchase_mode_is_explicit($post_id) ? kubikart_get_purchase_mode($post_id) : get_post_meta($post_id, KUBIKART_KIT_ORDER_MODE_META_KEY, true))
        : get_post_meta($post_id, KUBIKART_KIT_ORDER_MODE_META_KEY, true);
    $kit_language = kubikart_kit_post_language($post_id);
    $items = [];
    $skipped = 0;

    foreach (kubikart_kit_get_items($post_id) as $item) {
        $link = kubikart_kit_resolve_link($item, $kit_language);
        $display_name = $item['title'] !== '' ? $item['title'] : ($link['product']['name'] ?? '');
        if ($display_name === '') {
            $skipped++;
            continue;
        }

        $image = null;
        $image_data = kubikart_kit_attachment_data($item['image_id'], $display_name);
        if ($image_data) {
            $image = ['id' => $item['image_id'], 'src' => $image_data['src'], 'alt' => $image_data['alt']];
        }

        $items[] = [
            'id' => $item['id'],
            'quantity' => $item['quantity'],
            'title' => $item['title'],
            'description' => $item['description'],
            'image' => $image,
            'icon' => $item['icon'] ?? '',
            'link_state' => $link['state'],
            'product' => $link['product'],
        ];
    }

    return [
        'schema_version' => KUBIKART_KIT_SCHEMA_VERSION,
        'is_business_kit' => true,
        'order_mode' => $stored_mode === 'purchase' ? 'purchase' : 'enquiry',
        'order_mode_explicit' => $stored_mode === 'purchase' || $stored_mode === 'enquiry',
        'needs_contents' => empty($items),
        'scope_summary' => sanitize_text_field((string) get_post_meta($post_id, KUBIKART_KIT_SCOPE_SUMMARY_META_KEY, true)),
        'items' => $items,
        'skipped_items' => $skipped,
    ];
}

add_filter('woocommerce_rest_prepare_product_object', function ($response, $product) {
    $payload = kubikart_kit_build_rest_payload($product->get_id());
    if ($payload === null) {
        return $response;
    }

    $data = $response->get_data();
    $data['meta_data'] = array_values(array_filter($data['meta_data'] ?? [], function ($entry) {
        if ($entry instanceof WC_Meta_Data) {
            $entry = $entry->get_data();
        }

        return (is_array($entry) ? ($entry['key'] ?? '') : '') !== KUBIKART_KIT_REST_META_KEY;
    }));
    $data['meta_data'][] = [
        'id' => 0,
        'key' => KUBIKART_KIT_REST_META_KEY,
        'value' => $payload,
    ];
    $response->set_data($data);

    return $response;
}, 10, 2);

/**
 * Admin: metabox, assets, save
 */
add_action('add_meta_boxes', function () {
    add_meta_box(
        'kubikart_kit_contents',
        'Kubikart: Paketinhalt',
        'kubikart_kit_render_metabox',
        'product',
        'normal',
        'high'
    );
});

add_action('admin_enqueue_scripts', function () {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->post_type !== 'product' || !in_array($screen->base, ['post', 'post-new'], true)) {
        return;
    }

    wp_enqueue_media();
    $base_url = plugin_dir_url(__FILE__);
    wp_enqueue_style(
        'kubikart-business-kit-contents-admin',
        $base_url . 'assets/kubikart-business-kit-contents-admin.css',
        [],
        KUBIKART_KIT_VERSION
    );
    wp_enqueue_script(
        'kubikart-business-kit-contents-admin',
        $base_url . 'assets/kubikart-business-kit-contents-admin.js',
        ['jquery'],
        KUBIKART_KIT_VERSION,
        true
    );
});

function kubikart_kit_product_option_label(int $product_id, int $variation_id): string {
    $id = $variation_id > 0 ? $variation_id : $product_id;
    $title = get_the_title($id);
    if ($title === '') {
        return sprintf('Produkt #%d (nicht mehr vorhanden)', $id);
    }
    return sprintf('%s (#%d)', $title, $id);
}

function kubikart_kit_render_item_row($index, array $item = [], string $kit_language = ''): void {
    $name = 'kubikart_kit_items[' . $index . ']';
    $product_id = absint($item['product_id'] ?? 0);
    $variation_id = absint($item['variation_id'] ?? 0);
    $image_id = absint($item['image_id'] ?? 0);
    $selected_id = $variation_id > 0 ? $variation_id : $product_id;
    $link_state = $product_id > 0 ? kubikart_kit_resolve_link([
        'product_id' => $product_id,
        'variation_id' => $variation_id,
    ], $kit_language)['state'] : 'unlinked';
    $image_url = $image_id > 0 ? wp_get_attachment_image_url($image_id, 'thumbnail') : '';
    ?>
    <div class="kubikart-kit-row" data-kit-row>
        <input type="hidden" name="<?php echo esc_attr($name); ?>[id]" value="<?php echo esc_attr($item['id'] ?? ''); ?>" />
        <div class="kubikart-kit-row__header">
            <strong class="kubikart-kit-row__number" data-kit-row-number>Eintrag</strong>
            <span class="kubikart-kit-row__actions">
                <button type="button" class="button" data-kit-move="up" aria-label="Eintrag nach oben verschieben">↑</button>
                <button type="button" class="button" data-kit-move="down" aria-label="Eintrag nach unten verschieben">↓</button>
                <button type="button" class="button" data-kit-remove aria-label="Eintrag entfernen">Entfernen</button>
            </span>
        </div>
        <div class="kubikart-kit-row__grid">
            <div class="kubikart-kit-field kubikart-kit-field--wide">
                <label>Verknüpftes Produkt (optional)
                    <select class="wc-product-search" style="width:100%" name="<?php echo esc_attr($name); ?>[product_id]" data-kit-product data-action="woocommerce_json_search_products_and_variations" data-allow_clear="true" data-placeholder="Produkt oder Variante suchen …">
                        <?php if ($selected_id > 0): ?>
                            <option value="<?php echo esc_attr($selected_id); ?>" selected="selected"><?php echo esc_html(kubikart_kit_product_option_label($product_id, $variation_id)); ?></option>
                        <?php endif; ?>
                    </select>
                </label>
                <?php if ($link_state === 'unavailable'): ?>
                    <p class="kubikart-kit-row__status">Dieses Produkt ist aktuell nicht verfügbar (nicht veröffentlicht, ausgeblendet oder gelöscht) und wird auf der Paketseite nur mit dem Titel angezeigt.</p>
                <?php elseif ($link_state === 'language_mismatch'): ?>
                    <p class="kubikart-kit-row__status">Dieses Produkt gehört zu einer anderen Sprache als das Paket und hat keine Übersetzung. Es wird nicht verlinkt.</p>
                <?php endif; ?>
            </div>
            <div class="kubikart-kit-field">
                <label>Menge
                    <input type="number" min="1" max="<?php echo esc_attr(KUBIKART_KIT_MAX_QUANTITY); ?>" step="1" name="<?php echo esc_attr($name); ?>[quantity]" value="<?php echo esc_attr($item['quantity'] ?? 1); ?>" />
                </label>
            </div>
            <div class="kubikart-kit-field">
                <label>Titel im Paket
                    <input type="text" maxlength="<?php echo esc_attr(KUBIKART_KIT_MAX_TITLE_LENGTH); ?>" name="<?php echo esc_attr($name); ?>[title]" value="<?php echo esc_attr($item['title'] ?? ''); ?>" placeholder="Pflicht, wenn kein Produkt verknüpft ist" />
                </label>
            </div>
            <div class="kubikart-kit-field kubikart-kit-field--wide">
                <label>Beschreibung / Spezifikationen
                    <textarea rows="3" maxlength="<?php echo esc_attr(KUBIKART_KIT_MAX_DESCRIPTION_LENGTH); ?>" name="<?php echo esc_attr($name); ?>[description]"><?php echo esc_textarea($item['description'] ?? ''); ?></textarea>
                </label>
                <p class="description">z. B. Größe, Material/Farbe, Anzahl der QR-Ziele, enthaltene Gestaltungsleistung. Nur Text, maximal <?php echo esc_html(KUBIKART_KIT_MAX_DESCRIPTION_LENGTH); ?> Zeichen.</p>
            </div>
            <div class="kubikart-kit-field">
                <label>Symbol in der Paketübersicht
                    <select name="<?php echo esc_attr($name); ?>[icon]">
                        <?php foreach (kubikart_kit_icon_options() as $icon_value => $icon_label): ?>
                            <option value="<?php echo esc_attr($icon_value); ?>" <?php selected($item['icon'] ?? '', $icon_value); ?>><?php echo esc_html($icon_label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
            </div>
            <div class="kubikart-kit-field kubikart-kit-field--wide kubikart-kit-image" data-kit-image<?php echo $product_id > 0 ? ' hidden' : ''; ?>>
                <span class="kubikart-kit-image__label">Bild (nur für Einträge ohne verknüpftes Produkt)</span>
                <input type="hidden" name="<?php echo esc_attr($name); ?>[image_id]" value="<?php echo esc_attr($image_id ?: ''); ?>" data-kit-image-id />
                <img class="kubikart-kit-image__preview" data-kit-image-preview src="<?php echo esc_url($image_url ?: ''); ?>" alt=""<?php echo $image_url ? '' : ' hidden'; ?> />
                <button type="button" class="button" data-kit-image-select>Bild auswählen</button>
                <button type="button" class="button-link" data-kit-image-clear<?php echo $image_id ? '' : ' hidden'; ?>>Bild entfernen</button>
            </div>
        </div>
    </div>
    <?php
}

function kubikart_kit_render_metabox($post) {
    $post_id = absint($post->ID);

    if (!kubikart_is_business_kit($post_id)) {
        echo '<p class="description">Weise zuerst die Kategorie Business-Pakete zu und speichere das Produkt. Danach kannst du hier den Paketinhalt und die Bestellart pflegen.</p>';
        return;
    }

    wp_nonce_field(KUBIKART_KIT_NONCE_ACTION, KUBIKART_KIT_NONCE_FIELD);

    $stored_mode = (string) get_post_meta($post_id, KUBIKART_KIT_ORDER_MODE_META_KEY, true);
    $items = kubikart_kit_get_items($post_id);
    $kit_language = kubikart_kit_post_language($post_id);
    $needs_price_warning = $stored_mode === 'purchase' && kubikart_kit_price($post_id) <= 0;
    $needs_fields_warning = $stored_mode === 'purchase' && !kubikart_kit_has_custom_fields($post_id);
    ?>
    <div class="kubikart-kit-box">
        <?php if (empty($items)): ?>
            <div class="notice notice-warning inline" role="alert"><p><strong>Paketinhalt fehlt.</strong> Für dieses Business-Paket sind noch keine Inhalte hinterlegt. Auf der Paketseite wird deshalb kein Inhalt angezeigt.</p></div>
        <?php endif; ?>

        <h4>Bestellart</h4>
        <p>
            <label for="kubikart-kit-order-mode" class="screen-reader-text">Bestellart</label>
            <select id="kubikart-kit-order-mode" name="kubikart_kit_order_mode">
                <?php foreach (kubikart_kit_order_modes() as $value => $label): ?>
                    <option value="<?php echo esc_attr($value); ?>" <?php selected($stored_mode, $value); ?>><?php echo esc_html($label); ?></option>
                <?php endforeach; ?>
            </select>
        </p>
        <p class="description">„Direkt kaufen“ setzt einen echten Preis und genau die Personalisierungsfelder voraus, die das Paket wirklich braucht (Box „Kubikart: Personalisierungsfelder“). „Nicht festgelegt“ verhält sich wie „Nur auf Anfrage“: ohne ausdrückliche Wahl gibt es keinen Warenkorb-Button.</p>
        <?php if ($needs_price_warning): ?>
            <div class="notice notice-warning inline" role="alert"><p>Direkter Kauf ist gewählt, aber das Produkt hat keinen Preis (oder 0 €). Bitte einen echten Preis hinterlegen.</p></div>
        <?php endif; ?>
        <?php if ($needs_fields_warning): ?>
            <div class="notice notice-warning inline" role="alert"><p>Direkter Kauf ist gewählt, aber das Produkt hat keine Personalisierungsfelder. Bitte lege die Felder an, die für dieses Paket wirklich benötigt werden.</p></div>
        <?php endif; ?>

        <h4>Leistungsumfang (Kurzzeile)</h4>
        <p>
            <label for="kubikart-kit-scope-summary" class="screen-reader-text">Leistungsumfang</label>
            <input type="text" id="kubikart-kit-scope-summary" class="large-text" maxlength="200" name="kubikart_kit_scope_summary" value="<?php echo esc_attr((string) get_post_meta($post_id, KUBIKART_KIT_SCOPE_SUMMARY_META_KEY, true)); ?>" />
        </p>
        <p class="description">Wird direkt bei den Kaufbuttons angezeigt, z. B. „Mit vorhandenem Logo · digitaler Entwurf vor Fertigung · eine Korrekturrunde inklusive · ohne Montage“. Nur Leistungen nennen, die wirklich zugesagt sind.</p>

        <h4>Inhalt des Pakets</h4>
        <p class="description">Verknüpfte Produkte werden auf der Paketseite als „im Paketpreis enthalten“ dargestellt. Der Lagerbestand der Bestandteile wird <strong>nicht</strong> reduziert und beeinflusst die Verfügbarkeit des Pakets nicht. Die Reihenfolge entspricht der Anzeige.</p>
        <div id="kubikart-kit-items" class="kubikart-kit-items" data-next-index="<?php echo esc_attr(count($items)); ?>" data-max-items="<?php echo esc_attr(KUBIKART_KIT_MAX_ITEMS); ?>">
            <?php foreach ($items as $i => $item) kubikart_kit_render_item_row($i, $item, $kit_language); ?>
        </div>
        <p class="screen-reader-text" id="kubikart-kit-live" role="status" aria-live="polite"></p>
        <button type="button" class="button" id="kubikart-kit-add">+ Eintrag hinzufügen</button>
        <template id="kubikart-kit-row-template"><?php kubikart_kit_render_item_row('__INDEX__', ['quantity' => 1], $kit_language); ?></template>
    </div>
    <?php
}

function kubikart_kit_handle_save($post_id) {
    $post_id = absint($post_id);
    if (!isset($_POST[KUBIKART_KIT_NONCE_FIELD]) || !wp_verify_nonce($_POST[KUBIKART_KIT_NONCE_FIELD], KUBIKART_KIT_NONCE_ACTION)) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    if (!kubikart_is_business_kit($post_id)) {
        return;
    }

    $existing_mode = (string) get_post_meta($post_id, KUBIKART_KIT_ORDER_MODE_META_KEY, true);
    $raw_mode = isset($_POST['kubikart_kit_order_mode']) ? wp_unslash($_POST['kubikart_kit_order_mode']) : $existing_mode;
    $raw_items = wp_unslash($_POST['kubikart_kit_items'] ?? []);

    $result = kubikart_kit_sanitize_contents_payload($raw_items, $raw_mode, $post_id);
    if (!$result['valid']) {
        set_transient('kubikart_kit_contents_error_' . $post_id, $result['errors'], 60);
        return;
    }

    if ($result['order_mode'] === '') {
        delete_post_meta($post_id, KUBIKART_KIT_ORDER_MODE_META_KEY);
    } else {
        update_post_meta($post_id, KUBIKART_KIT_ORDER_MODE_META_KEY, $result['order_mode']);
    }
    if (function_exists('kubikart_set_purchase_mode')) {
        kubikart_set_purchase_mode($post_id, (string) $result['order_mode']);
    }
    update_post_meta($post_id, KUBIKART_KIT_CONTENTS_META_KEY, $result['payload']);

    if (isset($_POST['kubikart_kit_scope_summary'])) {
        $summary = mb_substr(sanitize_text_field(wp_unslash($_POST['kubikart_kit_scope_summary'])), 0, 200);
        if ($summary === '') {
            delete_post_meta($post_id, KUBIKART_KIT_SCOPE_SUMMARY_META_KEY);
        } else {
            update_post_meta($post_id, KUBIKART_KIT_SCOPE_SUMMARY_META_KEY, $summary);
        }
    }

    if (!empty($result['warnings'])) {
        set_transient('kubikart_kit_contents_warning_' . $post_id, $result['warnings'], 60);
    }

    if (function_exists('kubikart_revalidate_product_fields')) {
        kubikart_revalidate_product_fields($post_id);
    }
}
add_action('save_post_product', 'kubikart_kit_handle_save');

add_action('admin_notices', function () {
    $post_id = isset($_GET['post']) ? absint($_GET['post']) : 0;
    if (!$post_id) return;

    $errors = get_transient('kubikart_kit_contents_error_' . $post_id);
    if ($errors) {
        delete_transient('kubikart_kit_contents_error_' . $post_id);
        echo '<div class="notice notice-error"><p><strong>Der Paketinhalt wurde nicht gespeichert.</strong></p><ul>';
        foreach ((array) $errors as $error) {
            echo '<li>' . esc_html($error) . '</li>';
        }
        echo '</ul><p>Die zuvor gespeicherten Paketdaten wurden nicht verändert.</p></div>';
    }

    $warnings = get_transient('kubikart_kit_contents_warning_' . $post_id);
    if ($warnings) {
        delete_transient('kubikart_kit_contents_warning_' . $post_id);
        echo '<div class="notice notice-warning"><p><strong>Paketinhalt gespeichert – bitte prüfen:</strong></p><ul>';
        foreach ((array) $warnings as $warning) {
            echo '<li>' . esc_html($warning) . '</li>';
        }
        echo '</ul></div>';
    }
});

/**
 * Products list column
 */
add_filter('manage_product_posts_columns', function ($columns) {
    $columns['kubikart_kit_contents'] = 'Paketinhalt';
    return $columns;
});

add_action('manage_product_posts_custom_column', function ($column, $post_id) {
    if ($column !== 'kubikart_kit_contents') {
        return;
    }

    if (!kubikart_is_business_kit($post_id)) {
        echo '–';
        return;
    }

    $count = count(kubikart_kit_get_items(absint($post_id)));
    $mode = kubikart_kit_effective_order_mode($post_id) === 'purchase' ? 'Direkt kaufen' : 'Anfrage';
    if ($count === 0) {
        echo '<strong style="color:#b32d2e">Fehlt</strong>';
    } else {
        echo esc_html(sprintf($count === 1 ? '%d Eintrag' : '%d Einträge', $count));
    }
    echo '<br><small>' . esc_html($mode) . '</small>';
}, 10, 2);

/**
 * WP-CLI: read-only audit of all published kits.
 */
function kubikart_kit_audit_product(int $post_id): array {
    $payload = kubikart_kit_build_rest_payload($post_id) ?? [];
    $stored_items = kubikart_kit_get_items($post_id);
    $order_mode = $payload['order_mode'] ?? 'enquiry';
    $warnings = [];

    if (empty($payload['items'])) {
        $warnings[] = 'missing_contents';
    }
    if ($order_mode === 'purchase' && kubikart_kit_price($post_id) <= 0) {
        $warnings[] = 'purchase_mode_without_price';
    }
    if ($order_mode === 'purchase' && !kubikart_kit_has_custom_fields($post_id)) {
        $warnings[] = 'purchase_mode_without_custom_fields';
    }
    foreach ($payload['items'] ?? [] as $item) {
        if ($item['link_state'] === 'unavailable' || $item['link_state'] === 'language_mismatch') {
            $warnings[] = 'item_' . $item['link_state'] . ':' . $item['id'];
        }
    }
    if (!empty($payload['skipped_items'])) {
        $warnings[] = 'skipped_items:' . $payload['skipped_items'];
    }

    return [
        'id' => $post_id,
        'slug' => get_post_field('post_name', $post_id),
        'lang' => kubikart_kit_post_language($post_id),
        'price' => kubikart_kit_price($post_id),
        'order_mode' => $order_mode,
        'order_mode_explicit' => $payload['order_mode_explicit'] ?? false,
        'item_count' => count($stored_items),
        'missing_contents' => !empty($payload['needs_contents']),
        'warnings' => $warnings,
    ];
}

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('kubikart kits audit', function () {
        $ids = get_posts([
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'orderby' => 'ID',
            'order' => 'ASC',
            'lang' => '',
            'tax_query' => [[
                'taxonomy' => 'product_cat',
                'field' => 'slug',
                'terms' => kubikart_kit_category_slugs(),
            ]],
        ]);

        $results = array_map(fn ($id) => kubikart_kit_audit_product(absint($id)), $ids);
        WP_CLI::line(wp_json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    });
}
