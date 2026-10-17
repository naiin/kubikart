<?php
/**
 * Must-Use Plugin: Kubikart Purchase Mode
 *
 * One explicit, data-driven purchase mode for every WooCommerce product:
 *
 *   purchase  Direct online purchase (price, options, cart, checkout).
 *   enquiry   Enquiry only. The product can never be put in a cart or paid for;
 *             a price, if one is set, is only a "from" price.
 *
 * The mode is stored in `_kubikart_purchase_mode`. It is never inferred from a
 * product name or category, with one deliberate legacy fallback: a Business
 * Bundle that has no explicit mode yet falls back to its old Bundle order mode
 * (`_kubikart_kit_order_mode`, unset = enquiry). Any other product without a
 * stored mode keeps today's behaviour (purchase).
 *
 * Enforcement: `woocommerce_is_purchasable` makes enquiry products
 * non-purchasable inside WooCommerce, the REST response exposes the decision to
 * the storefront (`_kubikart_purchase` meta entry) and the storefront's server
 * cart refuses enquiry products on every checkout path.
 *
 * Products sold in fixed sets (for example stickers) carry
 * `_kubikart_set_config`, exposed read-only as `_kubikart_set_config`:
 * { field_id, unit_label, options: { <option value>: <units per set> } }.
 */

if (!defined('ABSPATH')) {
    exit;
}

const KUBIKART_PURCHASE_MODE_META_KEY = '_kubikart_purchase_mode';
const KUBIKART_PURCHASE_REST_META_KEY = '_kubikart_purchase';
const KUBIKART_SET_CONFIG_META_KEY = '_kubikart_set_config';
const KUBIKART_PURCHASE_NONCE_ACTION = 'kubikart_purchase_mode_save';
const KUBIKART_PURCHASE_NONCE_FIELD = 'kubikart_purchase_mode_nonce';

function kubikart_purchase_modes(): array {
    return [
        'purchase' => 'Direkt kaufen (Preis, Optionen, Warenkorb)',
        'enquiry' => 'Nur auf Anfrage (kein Warenkorb, keine Zahlung)',
    ];
}

/** Resolves to the post that owns the setting (variations use their parent). */
function kubikart_purchase_owner_id($post_id): int {
    $post_id = absint($post_id);
    if ($post_id > 0 && get_post_type($post_id) === 'product_variation') {
        $parent = (int) wp_get_post_parent_id($post_id);
        return $parent > 0 ? $parent : $post_id;
    }
    return $post_id;
}

function kubikart_purchase_mode_is_explicit($post_id): bool {
    $stored = get_post_meta(kubikart_purchase_owner_id($post_id), KUBIKART_PURCHASE_MODE_META_KEY, true);
    return in_array($stored, ['purchase', 'enquiry'], true);
}

function kubikart_get_purchase_mode($post_id): string {
    $post_id = kubikart_purchase_owner_id($post_id);
    $stored = get_post_meta($post_id, KUBIKART_PURCHASE_MODE_META_KEY, true);
    if ($stored === 'purchase' || $stored === 'enquiry') {
        return $stored;
    }

    if (function_exists('kubikart_is_business_kit') && kubikart_is_business_kit($post_id) && function_exists('kubikart_kit_effective_order_mode')) {
        return kubikart_kit_effective_order_mode($post_id) === 'purchase' ? 'purchase' : 'enquiry';
    }

    return 'purchase';
}

function kubikart_set_purchase_mode($post_id, string $mode): void {
    $post_id = absint($post_id);
    if (!in_array($mode, ['purchase', 'enquiry'], true)) {
        delete_post_meta($post_id, KUBIKART_PURCHASE_MODE_META_KEY);
        return;
    }
    update_post_meta($post_id, KUBIKART_PURCHASE_MODE_META_KEY, $mode);
}

/** @return array{field_id:string,unit_label:string,options:array<string,int>}|null */
function kubikart_get_set_config($post_id): ?array {
    $raw = get_post_meta(absint($post_id), KUBIKART_SET_CONFIG_META_KEY, true);
    if (!is_array($raw) || empty($raw['field_id']) || empty($raw['options']) || !is_array($raw['options'])) {
        return null;
    }

    $options = [];
    foreach ($raw['options'] as $value => $units) {
        $units = (int) $units;
        if ($units >= 1 && $units <= 100000) {
            $options[(string) $value] = $units;
        }
    }
    if (!$options) {
        return null;
    }

    return [
        'field_id' => sanitize_key((string) $raw['field_id']),
        'unit_label' => sanitize_text_field((string) ($raw['unit_label'] ?? '')),
        'options' => $options,
    ];
}

add_filter('woocommerce_is_purchasable', function ($purchasable, $product) {
    if (!is_object($product) || !method_exists($product, 'get_id')) {
        return $purchasable;
    }
    return kubikart_get_purchase_mode($product->get_id()) === 'enquiry' ? false : $purchasable;
}, 20, 2);

add_filter('woocommerce_rest_prepare_product_object', function ($response, $product) {
    if (!($response instanceof WP_REST_Response) || !is_object($product) || !method_exists($product, 'get_id')) {
        return $response;
    }

    $product_id = (int) $product->get_id();
    $entries = [
        KUBIKART_PURCHASE_REST_META_KEY => [
            'mode' => kubikart_get_purchase_mode($product_id),
            'explicit' => kubikart_purchase_mode_is_explicit($product_id),
        ],
    ];
    $set_config = kubikart_get_set_config($product_id);
    if ($set_config) {
        $entries[KUBIKART_SET_CONFIG_META_KEY] = $set_config;
    }

    $data = $response->get_data();
    $data['meta_data'] = array_values(array_filter($data['meta_data'] ?? [], function ($entry) use ($entries) {
        if ($entry instanceof WC_Meta_Data) {
            $entry = $entry->get_data();
        }
        return !array_key_exists(is_array($entry) ? ($entry['key'] ?? '') : '', $entries);
    }));
    foreach ($entries as $key => $value) {
        $data['meta_data'][] = ['id' => 0, 'key' => $key, 'value' => $value];
    }
    $response->set_data($data);

    return $response;
}, 15, 2);

/**
 * Admin: one setting on every product. Business Bundles keep their mode in the
 * "Paketinhalt" box (it writes the same value), so no second control appears.
 */
add_action('add_meta_boxes', function () {
    add_meta_box('kubikart_purchase_mode', 'Kubikart: Bestellart', 'kubikart_purchase_mode_render_metabox', 'product', 'side', 'high');
});

function kubikart_purchase_mode_render_metabox($post): void {
    $post_id = absint($post->ID);
    if (function_exists('kubikart_is_business_kit') && kubikart_is_business_kit($post_id)) {
        echo '<p class="description">Für Business-Pakete wird die Bestellart in der Box „Kubikart: Paketinhalt“ gepflegt. Aktuell: <strong>' . esc_html(kubikart_get_purchase_mode($post_id) === 'purchase' ? 'Direkt kaufen' : 'Nur auf Anfrage') . '</strong>.</p>';
        return;
    }

    wp_nonce_field(KUBIKART_PURCHASE_NONCE_ACTION, KUBIKART_PURCHASE_NONCE_FIELD);

    $explicit = kubikart_purchase_mode_is_explicit($post_id);
    $mode = kubikart_get_purchase_mode($post_id);
    ?>
    <p><label for="kubikart-purchase-mode" class="screen-reader-text">Bestellart</label>
        <select id="kubikart-purchase-mode" name="kubikart_purchase_mode" class="widefat">
            <?php foreach (kubikart_purchase_modes() as $value => $label): ?>
                <option value="<?php echo esc_attr($value); ?>" <?php selected($explicit && $mode === $value); ?>><?php echo esc_html($label); ?></option>
            <?php endforeach; ?>
            <option value="" <?php selected(!$explicit); ?>>Nicht festgelegt (Standard)</option>
        </select></p>
    <p class="description">„Nur auf Anfrage“ blockiert Warenkorb, Kasse und Zahlung für dieses Produkt. Ein hinterlegter Preis wird dann nur als „Ab“-Preis angezeigt. Nicht festgelegt: Business-Pakete gelten als Anfrage, alle anderen Produkte als Direktkauf.</p>
    <?php
}

add_action('save_post_product', function ($post_id) {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!isset($_POST[KUBIKART_PURCHASE_NONCE_FIELD]) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST[KUBIKART_PURCHASE_NONCE_FIELD])), KUBIKART_PURCHASE_NONCE_ACTION)) {
        return;
    }
    if (!current_user_can('edit_post', $post_id) || !isset($_POST['kubikart_purchase_mode'])) {
        return;
    }

    kubikart_set_purchase_mode($post_id, sanitize_key(wp_unslash($_POST['kubikart_purchase_mode'])));
});
