<?php
/**
 * Plugin Name: Kubikart Custom Product Fields
 * Description: Adds data-driven personalization fields and paid extras to WooCommerce products.
 * Version: 1.4.0
 * Author: Kubikart
 */

if (!defined('ABSPATH')) exit;

const KUBIKART_PRODUCT_FIELDS_SCHEMA_VERSION = 3;
const KUBIKART_PRODUCT_FIELDS_META_KEY = '_kubikart_custom_fields';
const KUBIKART_PRODUCT_FIELDS_BACKUP_META_KEY = '_kubikart_custom_fields_backup_v1';

/**
 * Read both the original list format and the versioned schema without
 * mutating it. Missing/unknown field types are deliberately not inferred
 * from labels or helper text.
 */
function kubikart_normalize_custom_fields_payload($raw) {
    $schema_version = 1;
    $fields = [];

    if (is_array($raw) && isset($raw['fields']) && is_array($raw['fields'])) {
        $schema_version = absint($raw['schema_version'] ?? 1);
        $fields = $raw['fields'];
    } elseif (is_array($raw) && array_is_list($raw)) {
        $fields = $raw;
    } elseif ($raw !== '' && $raw !== null && $raw !== []) {
        return [
            'schema_version' => $schema_version,
            'fields' => [],
            'requires_review' => true,
            'warnings' => ['The stored value is not a supported field list or versioned schema.'],
            'raw' => $raw,
        ];
    }

    $warnings = [];
    foreach ($fields as $index => $field) {
        $type = is_array($field) ? ($field['type'] ?? '') : '';
        if (!is_array($field) || !in_array($type, ['text', 'textarea', 'select', 'checkbox'], true)) {
            $warnings[] = sprintf(
                'Field row %d (%s) has no supported explicit type and requires owner review.',
                $index + 1,
                is_array($field) ? ($field['id'] ?? 'unknown') : 'unknown'
            );
        }
    }

    return [
        'schema_version' => $schema_version,
        'fields' => $fields,
        'requires_review' => !empty($warnings),
        'warnings' => $warnings,
        'raw' => $raw,
    ];
}

/**
 * Sanitize submitted controls according to their explicitly selected type.
 * Any unsupported row rejects the whole save so the original meta survives.
 */
function kubikart_sanitize_custom_fields_payload($raw_fields) {
    $fields = [];
    $errors = [];

    if (!is_array($raw_fields)) {
        return [
            'valid' => false,
            'errors' => ['Submitted custom fields were not an array.'],
            'payload' => null,
        ];
    }

    foreach ($raw_fields as $index => $field) {
        if (!is_array($field)) {
            $errors[] = sprintf('Field row %d is invalid.', $index + 1);
            continue;
        }

        $id = sanitize_key($field['id'] ?? '');
        $label = sanitize_text_field($field['label'] ?? '');
        if (!$id && !$label) {
            continue;
        }
        if (!$id || !$label) {
            $errors[] = sprintf('Field row %d requires both an ID and label.', $index + 1);
            continue;
        }

        $type = sanitize_key($field['type'] ?? '');
        if (!in_array($type, ['text', 'textarea', 'select', 'checkbox'], true)) {
            $errors[] = sprintf('Field "%s" has unsupported type "%s".', $id, $type ?: 'missing');
            continue;
        }

        $saved_field = [
            'id' => $id,
            'label' => $label,
            'type' => $type,
            'required' => !empty($field['required']),
            'helperText' => sanitize_text_field($field['helperText'] ?? ''),
        ];

        if ($type === 'text' || $type === 'textarea') {
            $saved_field['placeholder'] = sanitize_text_field($field['placeholder'] ?? '');
            $saved_field['maxLength'] = absint($field['maxLength'] ?? 0) ?: null;
        }

        if ($type === 'select') {
            $options = [];
            $option_lines = preg_split('/\r\n|\r|\n/', sanitize_textarea_field($field['options'] ?? ''));
            foreach ($option_lines as $option_line) {
                $option_line = trim($option_line);
                if ($option_line === '') continue;

                $parts = array_map('trim', explode('|', $option_line, 2));
                $option_value = sanitize_title($parts[0]);
                $option_label = sanitize_text_field($parts[1] ?? $parts[0]);
                if ($option_value && $option_label) {
                    $options[] = ['label' => $option_label, 'value' => $option_value];
                }
            }

            $saved_field['options'] = $options;
            $default_value = sanitize_title($field['defaultValue'] ?? '');
            if ($default_value && in_array($default_value, array_column($options, 'value'), true)) {
                $saved_field['defaultValue'] = $default_value;
            }
        }

        $saved_field['price'] = max(0, (float) wc_format_decimal($field['price'] ?? 0));

        $fields[] = $saved_field;
    }

    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'payload' => [
            'schema_version' => KUBIKART_PRODUCT_FIELDS_SCHEMA_VERSION,
            'fields' => $fields,
        ],
    ];
}

function kubikart_backup_legacy_custom_fields($post_id, $existing) {
    $normalized = kubikart_normalize_custom_fields_payload($existing);
    if (
        $existing === '' ||
        $normalized['schema_version'] >= KUBIKART_PRODUCT_FIELDS_SCHEMA_VERSION ||
        metadata_exists('post', $post_id, KUBIKART_PRODUCT_FIELDS_BACKUP_META_KEY)
    ) {
        return false;
    }

    return (bool) add_post_meta($post_id, KUBIKART_PRODUCT_FIELDS_BACKUP_META_KEY, [
        'created_at' => current_time('mysql', true),
        'payload' => $existing,
    ], true);
}

/**
 * Revalidate the matching Next.js product cache after fields are saved.
 *
 * Configure KUBIKART_FRONTEND_URL and KUBIKART_REVALIDATE_SECRET in
 * wp-config.php. The secret must match REVALIDATE_SECRET in the frontend.
 */
function kubikart_revalidate_product_fields($post_id) {
    if (!defined('KUBIKART_FRONTEND_URL') || !defined('KUBIKART_REVALIDATE_SECRET') || !KUBIKART_REVALIDATE_SECRET) {
        return;
    }

    $product = wc_get_product($post_id);
    if (!$product) {
        return;
    }

    $body = wp_json_encode([
        'id' => $product->get_id(),
        'slug' => $product->get_slug(),
    ]);
    $signature = base64_encode(hash_hmac('sha256', $body, KUBIKART_REVALIDATE_SECRET, true));
    $endpoint = trailingslashit(KUBIKART_FRONTEND_URL) . 'api/revalidate';

    wp_remote_post($endpoint, [
        'blocking' => false,
        'timeout' => 0.5,
        'headers' => [
            'Content-Type' => 'application/json',
            'X-WC-Webhook-Signature' => $signature,
            'X-WC-Webhook-Topic' => 'product.updated',
        ],
        'body' => $body,
    ]);
}

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

add_action('admin_enqueue_scripts', function () {
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== 'product' || !in_array($screen->base, ['post', 'post-new'], true)) {
        return;
    }

    $base_url = plugin_dir_url(__FILE__);
    wp_enqueue_style(
        'kubikart-custom-product-fields-admin',
        $base_url . 'assets/kubikart-custom-product-fields-admin.css',
        [],
        '1.4.0'
    );
    wp_enqueue_script(
        'kubikart-custom-product-fields-admin',
        $base_url . 'assets/kubikart-custom-product-fields-admin.js',
        [],
        '1.4.0',
        true
    );
});

function kubikart_render_custom_field_row($index, $field = []) {
    $type = $field['type'] ?? '';
    $known_type = in_array($type, ['text', 'textarea', 'select', 'checkbox'], true);
    $is_new_row = !$type && empty($field['id']) && empty($field['label']);
    $name_prefix = 'kubikart_cf[' . $index . ']';
    $option_lines = array_map(function ($option) {
        return ($option['value'] ?? '') . '|' . ($option['label'] ?? '');
    }, is_array($field['options'] ?? null) ? $field['options'] : []);
    ?>
    <tr class="kubikart-field-row" data-field-row<?php echo $known_type ? '' : ' data-requires-review="true"'; ?>>
        <td data-column="ID"><input type="text" name="<?php echo esc_attr($name_prefix); ?>[id]" value="<?php echo esc_attr($field['id'] ?? ''); ?>" /></td>
        <td data-column="Label"><input type="text" name="<?php echo esc_attr($name_prefix); ?>[label]" value="<?php echo esc_attr($field['label'] ?? ''); ?>" /></td>
        <td data-column="Typ">
            <select name="<?php echo esc_attr($name_prefix); ?>[type]" data-field-type>
                <?php if (!$known_type): ?>
                    <option value="" selected><?php echo $is_new_row ? 'Typ auswählen' : 'Überprüfung erforderlich'; ?></option>
                <?php endif; ?>
                <option value="text" <?php selected($type, 'text'); ?>>Text</option>
                <option value="textarea" <?php selected($type, 'textarea'); ?>>Textarea</option>
                <option value="select" <?php selected($type, 'select'); ?>>Select</option>
                <option value="checkbox" <?php selected($type, 'checkbox'); ?>>Checkbox / Extra</option>
            </select>
        </td>
        <td data-column="Pflicht"><input type="checkbox" name="<?php echo esc_attr($name_prefix); ?>[required]" value="1" <?php checked(!empty($field['required'])); ?> /></td>
        <td data-column="Placeholder" data-field-control="text"><input type="text" name="<?php echo esc_attr($name_prefix); ?>[placeholder]" value="<?php echo esc_attr($field['placeholder'] ?? ''); ?>" /></td>
        <td data-column="Max" data-field-control="text"><input type="number" min="1" name="<?php echo esc_attr($name_prefix); ?>[maxLength]" value="<?php echo esc_attr($field['maxLength'] ?? ''); ?>" /></td>
        <td data-column="Optionen" data-field-control="select"><textarea name="<?php echo esc_attr($name_prefix); ?>[options]" placeholder="wert|Beschriftung&#10;modern|Modern"><?php echo esc_textarea(implode("\n", $option_lines)); ?></textarea></td>
        <td data-column="Standardwert" data-field-control="select"><input type="text" name="<?php echo esc_attr($name_prefix); ?>[defaultValue]" value="<?php echo esc_attr($field['defaultValue'] ?? ''); ?>" placeholder="z. B. classic" /></td>
        <td data-column="Aufpreis (€)" class="kubikart-price-field"><input type="number" min="0" step="0.01" inputmode="decimal" name="<?php echo esc_attr($name_prefix); ?>[price]" value="<?php echo esc_attr($field['price'] ?? ''); ?>" placeholder="0,00" aria-label="Aufpreis in Euro für <?php echo esc_attr($field['label'] ?? 'dieses Feld'); ?>" /></td>
        <td data-column="Hilfetext (keine Preisangabe)"><input type="text" name="<?php echo esc_attr($name_prefix); ?>[helperText]" value="<?php echo esc_attr($field['helperText'] ?? ''); ?>" placeholder="Optionale Erklärung für Kunden" /></td>
        <td data-column="Aktion"><button type="button" class="button kubikart-remove-field" data-remove-field aria-label="Feld entfernen">×</button></td>
    </tr>
    <?php
}

/**
 * Render the metabox UI.
 */
function kubikart_render_custom_fields_metabox($post) {
    $stored = get_post_meta($post->ID, KUBIKART_PRODUCT_FIELDS_META_KEY, true);
    $normalized = kubikart_normalize_custom_fields_payload($stored);
    $fields = $normalized['fields'];
    wp_nonce_field('kubikart_custom_fields_nonce', 'kubikart_cf_nonce');
    ?>
    <input type="hidden" name="kubikart_cf_schema_version" value="<?php echo esc_attr(KUBIKART_PRODUCT_FIELDS_SCHEMA_VERSION); ?>" />
    <p class="description">Definiere hier die personalisierbaren Eingabefelder für dieses Produkt. Diese erscheinen auf der Produktseite und werden im Warenkorb/Bestellung angezeigt.</p>
    <?php if ($normalized['schema_version'] < KUBIKART_PRODUCT_FIELDS_SCHEMA_VERSION): ?>
        <div class="notice notice-info inline"><p>Dieses Produkt verwendet das ältere Feldformat. Beim nächsten ausdrücklich gespeicherten Bearbeiten wird zuerst eine Sicherung angelegt und anschließend Schema Version 2 gespeichert.</p></div>
    <?php endif; ?>
    <?php if ($normalized['requires_review']): ?>
        <div class="notice notice-warning inline" role="alert">
            <p><strong>Mindestens ein Feld hat keinen unterstützten expliziten Typ.</strong> Die vorhandenen Rohdaten bleiben erhalten, bis alle markierten Zeilen geprüft und ausdrücklich gespeichert wurden.</p>
            <ul>
                <?php foreach ($normalized['warnings'] as $warning): ?>
                    <li><?php echo esc_html($warning); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>
    <div class="kubikart-fields-table-wrap">
    <table class="kubikart-fields-table" id="kubikart-fields-table" data-next-index="<?php echo esc_attr(count($fields)); ?>">
        <thead>
            <tr>
                <th style="width:9%">ID</th>
                <th style="width:14%">Label</th>
                <th style="width:10%">Typ</th>
                <th style="width:6%">Pflicht</th>
                <th style="width:11%">Placeholder</th>
                <th style="width:5%">Max</th>
                <th style="width:13%">Optionen</th>
                <th style="width:9%">Standardwert</th>
                <th style="width:8%">Aufpreis (€)</th>
                <th style="width:11%">Hilfetext</th>
                <th style="width:4%"></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($fields as $i => $field) kubikart_render_custom_field_row($i, is_array($field) ? $field : []); ?>
        </tbody>
    </table>
    </div>
    <button type="button" class="button kubikart-add-field" id="kubikart-add-field">+ Feld hinzufügen</button>
    <template id="kubikart-field-row-template"><?php kubikart_render_custom_field_row('__INDEX__'); ?></template>
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

    $result = kubikart_sanitize_custom_fields_payload(wp_unslash($_POST['kubikart_cf'] ?? []));
    if (!$result['valid']) {
        set_transient('kubikart_product_fields_error_' . $post_id, $result['errors'], 60);
        return;
    }

    $existing = get_post_meta($post_id, KUBIKART_PRODUCT_FIELDS_META_KEY, true);
    kubikart_backup_legacy_custom_fields($post_id, $existing);
    update_post_meta($post_id, KUBIKART_PRODUCT_FIELDS_META_KEY, $result['payload']);

    kubikart_revalidate_product_fields($post_id);
});

add_action('admin_notices', function () {
    $post_id = isset($_GET['post']) ? absint($_GET['post']) : 0;
    if (!$post_id) return;

    $errors = get_transient('kubikart_product_fields_error_' . $post_id);
    if (!$errors) return;

    delete_transient('kubikart_product_fields_error_' . $post_id);
    echo '<div class="notice notice-error"><p><strong>Kubikart-Felder wurden nicht gespeichert.</strong></p><ul>';
    foreach ((array) $errors as $error) {
        echo '<li>' . esc_html($error) . '</li>';
    }
    echo '</ul><p>Die zuvor gespeicherten Rohdaten wurden nicht verändert.</p></div>';
});

/**
 * Expose _kubikart_custom_fields in WC REST API response.
 */
add_filter('woocommerce_rest_prepare_product_object', function ($response, $product) {
    $stored = get_post_meta($product->get_id(), KUBIKART_PRODUCT_FIELDS_META_KEY, true);
    $normalized = kubikart_normalize_custom_fields_payload($stored);
    if (!empty($normalized['fields'])) {
        $data = $response->get_data();
        $data['meta_data'] = array_values(array_filter($data['meta_data'] ?? [], function ($entry) {
            if ($entry instanceof WC_Meta_Data) {
                $entry = $entry->get_data();
            }

            return (is_array($entry) ? ($entry['key'] ?? '') : '') !== '_kubikart_custom_fields';
        }));
        $data['meta_data'][] = [
            'id' => 0,
            'key' => KUBIKART_PRODUCT_FIELDS_META_KEY,
            'value' => [
                'schema_version' => $normalized['schema_version'],
                'fields' => $normalized['fields'],
                'requires_review' => $normalized['requires_review'],
            ],
        ];
        $response->set_data($data);
    }
    return $response;
}, 10, 2);

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('kubikart product-fields audit', function ($args, $assoc_args) {
        $ids = isset($assoc_args['product'])
            ? array_filter(array_map('absint', explode(',', $assoc_args['product'])))
            : [83, 82, 67, 66];
        $results = [];

        foreach ($ids as $product_id) {
            $raw = get_post_meta($product_id, KUBIKART_PRODUCT_FIELDS_META_KEY, true);
            $normalized = kubikart_normalize_custom_fields_payload($raw);
            $results[] = [
                'product_id' => $product_id,
                'slug' => get_post_field('post_name', $product_id),
                'stored_payload' => $raw,
                'admin_normalized' => [
                    'schema_version' => $normalized['schema_version'],
                    'fields' => $normalized['fields'],
                    'requires_review' => $normalized['requires_review'],
                    'warnings' => $normalized['warnings'],
                ],
                'backup' => get_post_meta($product_id, KUBIKART_PRODUCT_FIELDS_BACKUP_META_KEY, true),
            ];
        }

        WP_CLI::line(wp_json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    });

    WP_CLI::add_command('kubikart product-fields restore-backup', function ($args, $assoc_args) {
        $product_id = absint($args[0] ?? ($assoc_args['product'] ?? 0));
        if (!$product_id) {
            WP_CLI::error('Provide one product ID. Example: wp kubikart product-fields restore-backup 82');
        }

        $backup = get_post_meta($product_id, KUBIKART_PRODUCT_FIELDS_BACKUP_META_KEY, true);
        if (!is_array($backup) || !array_key_exists('payload', $backup)) {
            WP_CLI::error('No recoverable Kubikart field backup exists for this product.');
        }

        WP_CLI::line(wp_json_encode([
            'product_id' => $product_id,
            'created_at' => $backup['created_at'] ?? null,
            'payload' => $backup['payload'],
            'will_write' => isset($assoc_args['write']),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if (!isset($assoc_args['write'])) {
            WP_CLI::success('Dry run only. Re-run with --write after owner approval.');
            return;
        }

        update_post_meta($product_id, KUBIKART_PRODUCT_FIELDS_META_KEY, $backup['payload']);
        kubikart_revalidate_product_fields($product_id);
        WP_CLI::success('The backed-up custom-field payload was restored for this product.');
    });
}
