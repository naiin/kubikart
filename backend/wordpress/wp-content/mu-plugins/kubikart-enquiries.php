<?php
/**
 * Must-Use Plugin: Kubikart Enquiries
 *
 * Website enquiries are stored as private posts by the storefront
 * (/api/contact). This plugin:
 *
 *  - registers the enquiry data, the uploaded-file tokens (kept by kubikart-customer-files.php) and the
 *    owner-notification status as REST meta
 *    so the storefront can record them,
 *  - adds the collection filter `kubikart_notification=unsent` (status
 *    pending or failed) used by the retry sweep,
 *  - shows the notification status in the Posts list and adds the row action
 *    "Benachrichtigung erneut senden", which asks the storefront to retry the
 *    notification (signed request). A retry only re-sends the email and updates
 *    the status; it never creates or changes the enquiry.
 *
 * "accepted" means the mail provider accepted the message; it does not prove
 * inbox delivery.
 */

if (!defined('ABSPATH')) {
    exit;
}

const KUBIKART_ENQUIRY_META_RECORD = '_kubikart_enquiry';
const KUBIKART_ENQUIRY_META_STATUS = '_kubikart_notification_status';

function kubikart_enquiry_meta_keys(): array {
    return [
        '_kubikart_enquiry' => 'string',
        '_kubikart_enquiry_reference' => 'string',
        '_kubikart_enquiry_files' => 'string',
        '_kubikart_notification_status' => 'string',
        '_kubikart_notification_attempts' => 'integer',
        '_kubikart_notification_last_attempt' => 'string',
        '_kubikart_notification_error' => 'string',
        '_kubikart_notification_message_id' => 'string',
    ];
}

add_action('init', function () {
    foreach (kubikart_enquiry_meta_keys() as $key => $type) {
        register_post_meta('post', $key, [
            'type' => $type,
            'single' => true,
            'show_in_rest' => true,
            'auth_callback' => static fn ($allowed, $meta_key, $post_id) => current_user_can('edit_post', $post_id),
        ]);
    }
}, 20);

/** `?kubikart_notification=unsent` limits the posts collection to enquiries without an accepted notification. */
add_filter('rest_post_query', function ($args, $request) {
    if ($request->get_param('kubikart_notification') !== 'unsent') {
        return $args;
    }

    $args['meta_query'] = array_merge($args['meta_query'] ?? [], [[
        'key' => KUBIKART_ENQUIRY_META_STATUS,
        'value' => ['pending', 'failed'],
        'compare' => 'IN',
    ]]);

    return $args;
}, 10, 2);

function kubikart_enquiry_status_label(string $status, int $attempts = 0): string {
    $labels = [
        'accepted' => 'Vom Mail-Anbieter angenommen',
        'failed' => 'Fehlgeschlagen',
        'pending' => 'Ausstehend',
    ];
    $label = $labels[$status] ?? 'Unbekannt';
    return $attempts > 0 ? sprintf('%s (%d Versuch%s)', $label, $attempts, $attempts === 1 ? '' : 'e') : $label;
}

/**
 * Signed retry request for the storefront: base64 HMAC-SHA256 over "<unix seconds>.<raw body>" with its own secret
 * (KUBIKART_ENQUIRY_RETRY_SECRET, which must equal the frontend ENQUIRY_RETRY_SECRET). There is deliberately no
 * fallback to the revalidation secret, so one leaked secret does not unlock both endpoints.
 */
function kubikart_enquiry_retry_request(int $post_id): ?array {
    if (!defined('KUBIKART_FRONTEND_URL') || !defined('KUBIKART_ENQUIRY_RETRY_SECRET') || !KUBIKART_ENQUIRY_RETRY_SECRET) {
        return null;
    }

    $secret = (string) KUBIKART_ENQUIRY_RETRY_SECRET;
    $body = wp_json_encode(['post_id' => $post_id]);
    $timestamp = time();

    return [
        'url' => trailingslashit(KUBIKART_FRONTEND_URL) . 'api/enquiries/retry',
        'args' => [
            'timeout' => 20,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Kubikart-Signature' => base64_encode(hash_hmac('sha256', $timestamp . '.' . $body, $secret, true)),
                'X-Kubikart-Timestamp' => (string) $timestamp,
            ],
            'body' => $body,
        ],
    ];
}

function kubikart_enquiry_is_enquiry($post_id): bool {
    return get_post_meta($post_id, KUBIKART_ENQUIRY_META_RECORD, true) !== '';
}

add_filter('manage_posts_columns', function ($columns) {
    $columns['kubikart_notification'] = 'Benachrichtigung';
    return $columns;
});

add_action('manage_posts_custom_column', function ($column, $post_id) {
    if ($column !== 'kubikart_notification' || !kubikart_enquiry_is_enquiry($post_id)) {
        return;
    }
    $status = (string) get_post_meta($post_id, KUBIKART_ENQUIRY_META_STATUS, true);
    $error = (string) get_post_meta($post_id, '_kubikart_notification_error', true);
    echo esc_html(kubikart_enquiry_status_label($status, (int) get_post_meta($post_id, '_kubikart_notification_attempts', true)));
    if ($status === 'failed' && $error !== '') {
        echo '<br><small>' . esc_html($error) . '</small>';
    }
}, 10, 2);

add_filter('post_row_actions', function ($actions, $post) {
    if ($post->post_type !== 'post' || !kubikart_enquiry_is_enquiry($post->ID) || !current_user_can('edit_post', $post->ID)) {
        return $actions;
    }
    $status = (string) get_post_meta($post->ID, KUBIKART_ENQUIRY_META_STATUS, true);
    if ($status === 'accepted') {
        return $actions;
    }
    $url = wp_nonce_url(admin_url('admin-post.php?action=kubikart_enquiry_retry&post=' . (int) $post->ID), 'kubikart_enquiry_retry_' . (int) $post->ID);
    $actions['kubikart_retry'] = '<a href="' . esc_url($url) . '">Benachrichtigung erneut senden</a>';
    return $actions;
}, 10, 2);

add_action('admin_post_kubikart_enquiry_retry', function () {
    $post_id = isset($_GET['post']) ? absint($_GET['post']) : 0;
    check_admin_referer('kubikart_enquiry_retry_' . $post_id);
    if (!$post_id || !current_user_can('edit_post', $post_id) || !kubikart_enquiry_is_enquiry($post_id)) {
        wp_die('Nicht erlaubt.', '', ['response' => 403]);
    }

    $request = kubikart_enquiry_retry_request($post_id);
    $result = 'not_configured';
    if ($request) {
        $response = wp_remote_post($request['url'], $request['args']);
        $result = is_wp_error($response) || wp_remote_retrieve_response_code($response) >= 400 ? 'error' : 'sent';
    }

    wp_safe_redirect(add_query_arg('kubikart_retry', $result, admin_url('edit.php')));
    exit;
});

add_action('admin_notices', function () {
    if (!isset($_GET['kubikart_retry'])) {
        return;
    }
    $messages = [
        'sent' => ['notice-success', 'Die Benachrichtigung wurde erneut angestoßen. Der Status in der Spalte „Benachrichtigung“ zeigt das Ergebnis.'],
        'error' => ['notice-error', 'Die Frontend-Anwendung war nicht erreichbar oder hat die Anfrage abgelehnt. Die Anfrage selbst ist unverändert gespeichert.'],
        'not_configured' => ['notice-warning', 'KUBIKART_FRONTEND_URL und das Geheimnis sind nicht konfiguriert. Die Anfrage ist unverändert gespeichert.'],
    ];
    $key = sanitize_key(wp_unslash($_GET['kubikart_retry']));
    if (isset($messages[$key])) {
        echo '<div class="notice ' . esc_attr($messages[$key][0]) . ' is-dismissible"><p>' . esc_html($messages[$key][1]) . '</p></div>';
    }
});
