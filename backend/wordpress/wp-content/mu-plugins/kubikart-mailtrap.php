<?php
/**
 * Plugin Name: Kubikart Mailtrap Transport
 * Description: Sends native WordPress and WooCommerce mail through the configured Mailtrap API.
 */
if (!defined('ABSPATH')) { exit; }

function kubikart_mailtrap_config(): array {
    return (array) get_option('kubikart_mailtrap_transport', []);
}

function kubikart_mailtrap_addresses($input): array {
    $addresses = [];
    foreach (is_array($input) ? $input : explode(',', (string) $input) as $address) {
        $address = trim((string) $address);
        $name = '';
        if (preg_match('/^(.*?)<([^>]+)>$/', $address, $match)) {
            $name = trim($match[1], " \t\"'");
            $address = trim($match[2]);
        }
        if (is_email($address)) {
            $addresses[] = array_filter(['email' => $address, 'name' => $name]);
        }
    }
    return $addresses;
}

add_filter('pre_wp_mail', function ($previous, array $mail) {
    if ($previous !== null) { return $previous; }
    $config = kubikart_mailtrap_config();
    if (empty($config['token'])) { return $previous; }
    $payload = [
        'from' => ['email' => $config['from'], 'name' => $config['name']],
        'to' => kubikart_mailtrap_addresses($mail['to']),
        'subject' => (string) $mail['subject'],
        'category' => 'wordpress-transactional',
    ];
    $html = false;
    $headers = is_array($mail['headers']) ? $mail['headers'] : preg_split('/\r?\n/', (string) $mail['headers']);
    foreach ($headers as $header) {
        if (stripos($header, 'Content-Type:') === 0 && stripos($header, 'text/html') !== false) { $html = true; }
        foreach (['Cc' => 'cc', 'Bcc' => 'bcc', 'Reply-To' => 'reply_to'] as $label => $key) {
            if (stripos($header, $label . ':') === 0) {
                $values = kubikart_mailtrap_addresses(substr($header, strlen($label) + 1));
                if ($values) { $payload[$key] = $key === 'reply_to' ? $values[0] : $values; }
            }
        }
    }
    $payload[$html ? 'html' : 'text'] = (string) $mail['message'];
    $files = is_array($mail['attachments']) ? $mail['attachments'] : preg_split('/\r?\n/', (string) $mail['attachments']);
    foreach (array_filter($files) as $file) {
        if (!is_readable($file)) { return false; }
        $type = wp_check_filetype($file);
        $payload['attachments'][] = ['filename' => basename($file), 'content' => base64_encode(file_get_contents($file)), 'type' => $type['type'] ?: 'application/octet-stream', 'disposition' => 'attachment'];
    }
    $response = wp_remote_post('https://send.api.mailtrap.io/api/send', [
        'timeout' => 15,
        'headers' => ['Authorization' => 'Bearer ' . $config['token'], 'Content-Type' => 'application/json'],
        'body' => wp_json_encode($payload),
    ]);
    $data = is_wp_error($response) ? [] : json_decode(wp_remote_retrieve_body($response), true);
    if (is_wp_error($response) || wp_remote_retrieve_response_code($response) >= 300 || empty($data['success'])) {
        do_action('wp_mail_failed', new WP_Error('kubikart_mailtrap_failed', 'Mailtrap did not accept the message.'));
        return false;
    }
    update_option('kubikart_mailtrap_last_accepted', ['at' => gmdate('c'), 'message_ids' => $data['message_ids'] ?? []], false);
    do_action('wp_mail_succeeded', $mail);
    return true;
}, 10, 2);

foreach (['new_order', 'cancelled_order', 'failed_order'] as $type) {
    add_filter('woocommerce_email_recipient_' . $type, function ($recipient) {
        $config = kubikart_mailtrap_config();
        return !empty($config['owner']) ? $config['owner'] : $recipient;
    });
}

// The storefront sends its own branded account-created template. Other customer
// creation paths retain the native WooCommerce email, including wp-admin.
function kubikart_mailtrap_storefront_owns_account_mail(bool $rest, bool $authorized, string $route, string $owner): bool {
    return $rest && $authorized && rtrim($route, '/') === '/wc/v3/customers' && $owner === 'mailtrap';
}
add_filter('woocommerce_email_enabled_customer_new_account', function ($enabled) {
    $storefront_owns_mail = kubikart_mailtrap_storefront_owns_account_mail(
        defined('REST_REQUEST') && REST_REQUEST,
        current_user_can('manage_woocommerce'),
        kubikart_current_rest_route(),
        (string) ($_GET['kubikart_email_owner'] ?? '')
    );
    return $storefront_owns_mail ? false : $enabled;
});

// No secret is exposed in REST responses. Only the authenticated integration/admin may configure transport.
add_action('rest_api_init', function () {
    register_rest_route('kubikart/v1', '/mail-transport', [
        'methods' => ['GET', 'POST'],
        'permission_callback' => fn() => current_user_can('manage_options') || current_user_can('kubikart_frontend_integration'),
        'callback' => function (WP_REST_Request $request) {
            if ($request->get_method() === 'POST') {
                $data = $request->get_json_params();
                if (empty($data['token']) || !is_string($data['token']) || !is_email($data['from'] ?? '') || !is_email($data['owner'] ?? '')) {
                    return new WP_Error('invalid_mail_config', 'Invalid mail configuration.', ['status' => 400]);
                }
                update_option('kubikart_mailtrap_transport', ['token' => trim($data['token']), 'from' => sanitize_email($data['from']), 'owner' => sanitize_email($data['owner']), 'name' => sanitize_text_field($data['name'] ?? 'Kubikart')], false);
            }
            $config = kubikart_mailtrap_config();
            return new WP_REST_Response(['configured' => !empty($config['token']), 'from' => $config['from'] ?? '', 'owner' => $config['owner'] ?? '', 'last_accepted' => get_option('kubikart_mailtrap_last_accepted', null)], 200);
        },
    ]);
});
