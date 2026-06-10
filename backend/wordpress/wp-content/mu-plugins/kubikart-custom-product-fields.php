<?php
/**
 * Plugin Name: Kubikart Custom Product Fields
 * Description: Adds a metabox to WooCommerce products for defining custom input fields (Gravur, Zusatztext, etc.) that appear on the frontend product page.
 * Version: 1.0.0
 * Author: Kubikart
 */

if (!defined('ABSPATH')) exit;

/**
 * Register metabox on product edit screen.
 */
add_action('add_meta_boxes', function () {
    add_meta_box(
        'kubikart_custom_fields',
        'Kubikart: Personalisierungsfelder',
        'kubikart_render_custom_fields_metabox',
        'product',
        'normal',
        'high'
    );
});

/**
 * Render the metabox UI.
 */
function kubikart_render_custom_fields_metabox($post) {
    $fields = get_post_meta($post->ID, '_kubikart_custom_fields', true);
    if (!is_array($fields)) {
        $fields = [];
    }
    wp_nonce_field('kubikart_custom_fields_nonce', 'kubikart_cf_nonce');
    ?>
    <style>
        .kubikart-fields-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .kubikart-fields-table th, .kubikart-fields-table td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
        .kubikart-fields-table th { background: #f9f9f9; font-weight: 600; }
        .kubikart-field-row input, .kubikart-field-row select { width: 100%; padding: 4px 8px; }
        .kubikart-add-field { margin-top: 8px; }
    </style>
    <p class="description">Definiere hier die personalisierbaren Eingabefelder für dieses Produkt. Diese erscheinen auf der Produktseite und werden im Warenkorb/Bestellung angezeigt.</p>
    <table class="kubikart-fields-table" id="kubikart-fields-table">
        <thead>
            <tr>
                <th style="width:15%">ID</th>
                <th style="width:20%">Label</th>
                <th style="width:12%">Typ</th>
                <th style="width:8%">Pflicht</th>
                <th style="width:15%">Placeholder</th>
                <th style="width:8%">Max</th>
                <th style="width:17%">Hilfetext</th>
                <th style="width:5%"></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($fields as $i => $field): ?>
            <tr class="kubikart-field-row">
                <td><input type="text" name="kubikart_cf[<?php echo $i; ?>][id]" value="<?php echo esc_attr($field['id'] ?? ''); ?>" /></td>
                <td><input type="text" name="kubikart_cf[<?php echo $i; ?>][label]" value="<?php echo esc_attr($field['label'] ?? ''); ?>" /></td>
                <td>
                    <select name="kubikart_cf[<?php echo $i; ?>][type]">
                        <option value="text" <?php selected($field['type'] ?? '', 'text'); ?>>Text</option>
                        <option value="textarea" <?php selected($field['type'] ?? '', 'textarea'); ?>>Textarea</option>
                        <option value="select" <?php selected($field['type'] ?? '', 'select'); ?>>Select</option>
                    </select>
                </td>
                <td><input type="checkbox" name="kubikart_cf[<?php echo $i; ?>][required]" value="1" <?php checked(!empty($field['required'])); ?> /></td>
                <td><input type="text" name="kubikart_cf[<?php echo $i; ?>][placeholder]" value="<?php echo esc_attr($field['placeholder'] ?? ''); ?>" /></td>
                <td><input type="number" name="kubikart_cf[<?php echo $i; ?>][maxLength]" value="<?php echo esc_attr($field['maxLength'] ?? ''); ?>" style="width:60px" /></td>
                <td><input type="text" name="kubikart_cf[<?php echo $i; ?>][helperText]" value="<?php echo esc_attr($field['helperText'] ?? ''); ?>" /></td>
                <td><button type="button" class="button kubikart-remove-field" onclick="this.closest('tr').remove()">×</button></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <button type="button" class="button kubikart-add-field" id="kubikart-add-field">+ Feld hinzufügen</button>
    <script>
    (function() {
        var idx = <?php echo count($fields); ?>;
        document.getElementById('kubikart-add-field').addEventListener('click', function() {
            var tbody = document.querySelector('#kubikart-fields-table tbody');
            var tr = document.createElement('tr');
            tr.className = 'kubikart-field-row';
            tr.innerHTML = '<td><input type="text" name="kubikart_cf[' + idx + '][id]" value="" /></td>' +
                '<td><input type="text" name="kubikart_cf[' + idx + '][label]" value="" /></td>' +
                '<td><select name="kubikart_cf[' + idx + '][type]"><option value="text">Text</option><option value="textarea">Textarea</option><option value="select">Select</option></select></td>' +
                '<td><input type="checkbox" name="kubikart_cf[' + idx + '][required]" value="1" /></td>' +
                '<td><input type="text" name="kubikart_cf[' + idx + '][placeholder]" value="" /></td>' +
                '<td><input type="number" name="kubikart_cf[' + idx + '][maxLength]" value="" style="width:60px" /></td>' +
                '<td><input type="text" name="kubikart_cf[' + idx + '][helperText]" value="" /></td>' +
                '<td><button type="button" class="button kubikart-remove-field" onclick="this.closest(\'tr\').remove()">×</button></td>';
            tbody.appendChild(tr);
            idx++;
        });
    })();
    </script>
    <?php
}

/**
 * Save the custom fields when product is saved.
 */
add_action('save_post_product', function ($post_id) {
    if (!isset($_POST['kubikart_cf_nonce']) || !wp_verify_nonce($_POST['kubikart_cf_nonce'], 'kubikart_custom_fields_nonce')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $raw = $_POST['kubikart_cf'] ?? [];
    $fields = [];

    foreach ($raw as $field) {
        $id = sanitize_key($field['id'] ?? '');
        $label = sanitize_text_field($field['label'] ?? '');
        if (!$id || !$label) continue;

        $fields[] = [
            'id' => $id,
            'label' => $label,
            'type' => in_array($field['type'] ?? '', ['text', 'textarea', 'select']) ? $field['type'] : 'text',
            'required' => !empty($field['required']),
            'placeholder' => sanitize_text_field($field['placeholder'] ?? ''),
            'maxLength' => absint($field['maxLength'] ?? 0) ?: null,
            'helperText' => sanitize_text_field($field['helperText'] ?? ''),
        ];
    }

    if (empty($fields)) {
        delete_post_meta($post_id, '_kubikart_custom_fields');
    } else {
        update_post_meta($post_id, '_kubikart_custom_fields', $fields);
    }
});

/**
 * Expose _kubikart_custom_fields in WC REST API response.
 */
add_filter('woocommerce_rest_prepare_product_object', function ($response, $product) {
    $fields = get_post_meta($product->get_id(), '_kubikart_custom_fields', true);
    if (is_array($fields) && !empty($fields)) {
        $data = $response->get_data();
        $data['meta_data'][] = [
            'id' => 0,
            'key' => '_kubikart_custom_fields',
            'value' => $fields,
        ];
        $response->set_data($data);
    }
    return $response;
}, 10, 2);
