<?php
/**
 * Plugin Name: Kubikart DHL Shipping
 * Description: Adds DHL label creation to WooCommerce orders. Creates labels via the frontend API.
 * Version: 1.0.0
 * Author: Kubikart
 */

defined('ABSPATH') || exit;

/**
 * Add DHL meta box to WooCommerce order page
 */
add_action('add_meta_boxes', function () {
    $screen = class_exists('\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController')
        && wc_get_container()->get(\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController::class)->custom_orders_table_usage_is_enabled()
        ? wc_get_page_screen_id('shop-order')
        : 'shop_order';

    add_meta_box(
        'kubikart_dhl_shipping',
        '📦 DHL Versand',
        'kubikart_dhl_meta_box_content',
        $screen,
        'side',
        'high'
    );
});

function kubikart_dhl_meta_box_content($post_or_order) {
    $order = ($post_or_order instanceof WC_Order) ? $post_or_order : wc_get_order($post_or_order->ID);
    if (!$order) return;

    $tracking = $order->get_meta('_dhl_tracking_number');
    $label_url = $order->get_meta('_dhl_label_url');
    $dhl_product = $order->get_meta('_dhl_product');
    $return_tracking = $order->get_meta('_dhl_return_tracking');
    $return_label_url = $order->get_meta('_dhl_return_label_url');

    echo '<div id="kubikart-dhl-box">';

    if ($tracking) {
        echo '<p><strong>Sendungsnummer:</strong><br>';
        echo '<a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=' . esc_attr($tracking) . '" target="_blank" rel="noopener">' . esc_html($tracking) . '</a></p>';

        if ($label_url) {
            echo '<p><a href="' . esc_url($label_url) . '" target="_blank" class="button" rel="noopener">📄 Label herunterladen</a></p>';
        }

        if ($dhl_product) {
            echo '<p><small>Produkt: ' . esc_html($dhl_product) . '</small></p>';
        }

        echo '<hr>';
    }

    if ($return_tracking) {
        echo '<p><strong>Retoure:</strong> ' . esc_html($return_tracking) . '</p>';
        if ($return_label_url) {
            echo '<p><a href="' . esc_url($return_label_url) . '" target="_blank" class="button button-secondary" rel="noopener">📄 Retourenlabel</a></p>';
        }
        echo '<hr>';
    }

    // Create label button
    if (!$tracking) {
        echo '<button type="button" class="button button-primary" id="kubikart-create-dhl-label" data-order-id="' . esc_attr($order->get_id()) . '">📦 DHL Label erstellen</button>';
    }

    // Create return label button
    if ($tracking && !$return_tracking) {
        echo '<button type="button" class="button button-secondary" id="kubikart-create-dhl-return" data-order-id="' . esc_attr($order->get_id()) . '" style="margin-top:8px;">↩️ Retourenlabel erstellen</button>';
    }

    echo '<div id="kubikart-dhl-status" style="margin-top:10px;"></div>';
    echo '</div>';

    // The browser calls authenticated WordPress AJAX. WordPress then supplies
    // the DHL label secret in the server-to-server frontend request.
    $nonce = wp_create_nonce('kubikart_dhl_label');
    ?>
    <script>
    (function() {
        var ajaxUrl = <?php echo wp_json_encode(admin_url('admin-ajax.php')); ?>;
        var nonce = <?php echo wp_json_encode($nonce); ?>;

        function createLabel(orderId, type) {
            var statusEl = document.getElementById('kubikart-dhl-status');
            statusEl.innerHTML = '<em>Label wird erstellt...</em>';

            var requestBody = new URLSearchParams({
                action: 'kubikart_create_dhl_label',
                nonce: nonce,
                orderId: String(parseInt(orderId, 10)),
                type: type
            });
            fetch(ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                credentials: 'same-origin',
                body: requestBody.toString()
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.success === false && data.data) data = data.data;
                if (data.error) {
                    statusEl.textContent = 'Fehler: ' + data.error;
                } else {
                    statusEl.textContent = '✓ Label erstellt! Sendungsnr: ' + data.shipmentNo;
                    setTimeout(function() { location.reload(); }, 1500);
                }
            })
            .catch(function(err) {
                statusEl.textContent = 'Fehler: ' + err.message;
            });
        }

        var createBtn = document.getElementById('kubikart-create-dhl-label');
        if (createBtn) {
            createBtn.addEventListener('click', function() {
                createLabel(this.dataset.orderId, 'shipment');
            });
        }

        var returnBtn = document.getElementById('kubikart-create-dhl-return');
        if (returnBtn) {
            returnBtn.addEventListener('click', function() {
                createLabel(this.dataset.orderId, 'return');
            });
        }
    })();
    </script>
    <?php
}

/**
 * Authenticated WordPress admin proxy for frontend DHL label creation.
 * KUBIKART_DHL_LABEL_SECRET must equal frontend DHL_LABEL_SECRET.
 */
add_action('wp_ajax_kubikart_create_dhl_label', function () {
    if (!current_user_can('manage_woocommerce')) {
        wp_send_json_error(['error' => 'Nicht autorisiert.'], 403);
    }
    check_ajax_referer('kubikart_dhl_label', 'nonce');

    if (!defined('KUBIKART_FRONTEND_URL') || !defined('KUBIKART_DHL_LABEL_SECRET') || !KUBIKART_DHL_LABEL_SECRET) {
        wp_send_json_error(['error' => 'DHL-Integration ist nicht konfiguriert.'], 503);
    }

    $order_id = isset($_POST['orderId']) ? absint(wp_unslash($_POST['orderId'])) : 0;
    $type = isset($_POST['type']) ? sanitize_key(wp_unslash($_POST['type'])) : 'shipment';
    if (!$order_id || !in_array($type, ['shipment', 'return'], true)) {
        wp_send_json_error(['error' => 'Ungültige Anfrage.'], 400);
    }

    $response = wp_remote_post(trailingslashit(KUBIKART_FRONTEND_URL) . 'api/shipping/label', [
        'timeout' => 45,
        'headers' => [
            'Authorization' => 'Bearer ' . KUBIKART_DHL_LABEL_SECRET,
            'Content-Type' => 'application/json',
        ],
        'body' => wp_json_encode(['orderId' => $order_id, 'type' => $type]),
    ]);

    if (is_wp_error($response)) {
        error_log('Kubikart DHL label request failed: ' . $response->get_error_code());
        wp_send_json_error(['error' => 'DHL-Anfrage fehlgeschlagen.'], 502);
    }

    $status = wp_remote_retrieve_response_code($response);
    $data = json_decode(wp_remote_retrieve_body($response), true);
    if ($status < 200 || $status >= 300 || !is_array($data)) {
        error_log('Kubikart DHL label endpoint returned HTTP ' . absint($status));
        wp_send_json_error(['error' => 'DHL-Label konnte nicht erstellt werden.'], 502);
    }

    wp_send_json($data);
});

/**
 * Add tracking number column to orders list
 */
add_filter('manage_edit-shop_order_columns', function ($columns) {
    $columns['dhl_tracking'] = 'DHL Tracking';
    return $columns;
});

add_action('manage_shop_order_posts_custom_column', function ($column, $post_id) {
    if ($column === 'dhl_tracking') {
        $order = wc_get_order($post_id);
        $tracking = $order ? $order->get_meta('_dhl_tracking_number') : '';
        if ($tracking) {
            echo '<a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=' . esc_attr($tracking) . '" target="_blank" rel="noopener">' . esc_html($tracking) . '</a>';
        } else {
            echo '—';
        }
    }
}, 10, 2);

// HPOS (High-Performance Order Storage) column support
add_filter('manage_woocommerce_page_wc-orders_columns', function ($columns) {
    $columns['dhl_tracking'] = 'DHL Tracking';
    return $columns;
});

add_action('manage_woocommerce_page_wc-orders_custom_column', function ($column, $order) {
    if ($column === 'dhl_tracking') {
        $tracking = $order->get_meta('_dhl_tracking_number');
        if ($tracking) {
            echo '<a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=' . esc_attr($tracking) . '" target="_blank" rel="noopener">' . esc_html($tracking) . '</a>';
        } else {
            echo '—';
        }
    }
}, 10, 2);
