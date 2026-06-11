<?php
/**
 * Plugin Name: KubiKart Payment Gateway (Headless)
 * Description: Handles refunds via Stripe/PayPal APIs using stored transaction IDs. Supports headless frontend payment flow.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

/**
 * Register our custom payment gateways so WooCommerce recognizes them
 * and routes refund requests to our handlers.
 */
add_filter('woocommerce_payment_gateways', function ($gateways) {
    $gateways[] = 'WC_Gateway_Kubikart_Stripe';
    $gateways[] = 'WC_Gateway_Kubikart_PayPal';
    return $gateways;
});

/**
 * Load gateway classes after WC is initialized.
 */
add_action('plugins_loaded', function () {
    if (!class_exists('WC_Payment_Gateway')) return;

    // ─── Stripe Gateway ─────────────────────────────────────────────────────────
    if (!class_exists('WC_Gateway_Kubikart_Stripe')) {
        class WC_Gateway_Kubikart_Stripe extends WC_Payment_Gateway {
        public function __construct() {
            $this->id = 'stripe';
            $this->method_title = 'Stripe (Headless)';
            $this->method_description = 'Processes refunds via Stripe API using stored transaction IDs.';
            $this->has_fields = false;
            $this->supports = ['refunds'];

            $this->init_form_fields();
            $this->init_settings();

            $this->title = 'Kreditkarte / Klarna';
            $this->enabled = 'yes';
        }

        public function init_form_fields(): void {
            $this->form_fields = [
                'secret_key' => [
                    'title' => 'Stripe Secret Key',
                    'type' => 'password',
                    'description' => 'sk_test_... or sk_live_...',
                    'default' => '',
                ],
            ];
        }

        /**
         * This gateway doesn't process payments in WP — the frontend handles that.
         */
        public function process_payment($order_id) {
            return ['result' => 'success'];
        }

        /**
         * Process a refund via Stripe API.
         */
        public function process_refund($order_id, $amount = null, $reason = '') {
            $order = wc_get_order($order_id);
            $transaction_id = $order->get_transaction_id();

            if (empty($transaction_id)) {
                return new WP_Error('no_transaction', 'Keine Transaktions-ID gefunden. Refund nicht möglich.');
            }

            $secret_key = $this->get_option('secret_key');
            if (empty($secret_key)) {
                // Fall back to env or wp_options
                $stripe_settings = get_option('woocommerce_stripe_settings', []);
                $secret_key = $stripe_settings['test_secret_key'] ?? $stripe_settings['secret_key'] ?? '';
            }

            if (empty($secret_key)) {
                return new WP_Error('no_key', 'Stripe Secret Key nicht konfiguriert.');
            }

            $refund_data = [
                'payment_intent' => $transaction_id,
                'amount' => intval(round($amount * 100)), // cents
            ];

            if (!empty($reason)) {
                $refund_data['reason'] = 'requested_by_customer';
                $refund_data['metadata'] = ['reason' => $reason];
            }

            $response = wp_remote_post('https://api.stripe.com/v1/refunds', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $secret_key,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'body' => $refund_data,
                'timeout' => 30,
            ]);

            if (is_wp_error($response)) {
                return new WP_Error('api_error', 'Stripe API Fehler: ' . $response->get_error_message());
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);
            $code = wp_remote_retrieve_response_code($response);

            if ($code >= 400 || isset($body['error'])) {
                $msg = $body['error']['message'] ?? 'Unbekannter Fehler';
                return new WP_Error('stripe_error', 'Stripe Refund fehlgeschlagen: ' . $msg);
            }

            $order->add_order_note(sprintf(
                'Stripe Refund erfolgreich: %s (€%s). Grund: %s',
                $body['id'] ?? 'N/A',
                number_format($amount, 2, ',', '.'),
                $reason ?: 'Kein Grund angegeben'
            ));

            return true;
        }
        }
    }

    // ─── PayPal Gateway ─────────────────────────────────────────────────────────
    if (!class_exists('WC_Gateway_Kubikart_PayPal')) {
        class WC_Gateway_Kubikart_PayPal extends WC_Payment_Gateway {
        public function __construct() {
            $this->id = 'ppcp-gateway';
            $this->method_title = 'PayPal (Headless)';
            $this->method_description = 'Processes refunds via PayPal API using stored transaction IDs.';
            $this->has_fields = false;
            $this->supports = ['refunds'];

            $this->init_form_fields();
            $this->init_settings();

            $this->title = 'PayPal';
            $this->enabled = 'yes';
        }

        public function init_form_fields(): void {
            $this->form_fields = [
                'client_id' => [
                    'title' => 'PayPal Client ID',
                    'type' => 'text',
                    'default' => '',
                ],
                'client_secret' => [
                    'title' => 'PayPal Secret',
                    'type' => 'password',
                    'default' => '',
                ],
                'sandbox' => [
                    'title' => 'Sandbox Mode',
                    'type' => 'checkbox',
                    'label' => 'Enable sandbox/test mode',
                    'default' => 'yes',
                ],
            ];
        }

        public function process_payment($order_id) {
            return ['result' => 'success'];
        }

        /**
         * Process a refund via PayPal API.
         */
        public function process_refund($order_id, $amount = null, $reason = '') {
            $order = wc_get_order($order_id);
            $transaction_id = $order->get_transaction_id();

            if (empty($transaction_id)) {
                return new WP_Error('no_transaction', 'Keine Transaktions-ID gefunden. Refund nicht möglich.');
            }

            $client_id = $this->get_option('client_id');
            $client_secret = $this->get_option('client_secret');
            $sandbox = $this->get_option('sandbox') === 'yes';

            if (empty($client_id) || empty($client_secret)) {
                // Fall back to stored common data
                $common = get_option('woocommerce-ppcp-data-common', []);
                $client_id = $client_id ?: ($common['client_id'] ?? '');
                $client_secret = $client_secret ?: ($common['client_secret'] ?? '');
                $sandbox = $common['use_sandbox'] ?? $sandbox;
            }

            if (empty($client_id) || empty($client_secret)) {
                return new WP_Error('no_credentials', 'PayPal Zugangsdaten nicht konfiguriert.');
            }

            $base_url = $sandbox
                ? 'https://api-m.sandbox.paypal.com'
                : 'https://api-m.paypal.com';

            // Get access token
            $auth_response = wp_remote_post($base_url . '/v1/oauth2/token', [
                'headers' => [
                    'Authorization' => 'Basic ' . base64_encode($client_id . ':' . $client_secret),
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'body' => 'grant_type=client_credentials',
                'timeout' => 30,
            ]);

            if (is_wp_error($auth_response)) {
                return new WP_Error('auth_error', 'PayPal Auth Fehler: ' . $auth_response->get_error_message());
            }

            $auth_body = json_decode(wp_remote_retrieve_body($auth_response), true);
            $access_token = $auth_body['access_token'] ?? '';

            if (empty($access_token)) {
                return new WP_Error('auth_failed', 'PayPal Authentifizierung fehlgeschlagen.');
            }

            // First, get capture ID from the order
            $order_response = wp_remote_get($base_url . '/v2/checkout/orders/' . $transaction_id, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $access_token,
                    'Content-Type' => 'application/json',
                ],
                'timeout' => 30,
            ]);

            if (is_wp_error($order_response)) {
                return new WP_Error('api_error', 'PayPal API Fehler: ' . $order_response->get_error_message());
            }

            $order_body = json_decode(wp_remote_retrieve_body($order_response), true);
            $capture_id = $order_body['purchase_units'][0]['payments']['captures'][0]['id'] ?? '';

            if (empty($capture_id)) {
                // Transaction ID might already be the capture ID
                $capture_id = $transaction_id;
            }

            // Issue refund
            $refund_body = [
                'amount' => [
                    'value' => number_format($amount, 2, '.', ''),
                    'currency_code' => $order->get_currency() ?: 'EUR',
                ],
            ];

            if (!empty($reason)) {
                $refund_body['note_to_payer'] = substr($reason, 0, 255);
            }

            $refund_response = wp_remote_post($base_url . '/v2/payments/captures/' . $capture_id . '/refund', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $access_token,
                    'Content-Type' => 'application/json',
                ],
                'body' => json_encode($refund_body),
                'timeout' => 30,
            ]);

            if (is_wp_error($refund_response)) {
                return new WP_Error('refund_error', 'PayPal Refund Fehler: ' . $refund_response->get_error_message());
            }

            $refund_result = json_decode(wp_remote_retrieve_body($refund_response), true);
            $refund_code = wp_remote_retrieve_response_code($refund_response);

            if ($refund_code >= 400) {
                $msg = $refund_result['message'] ?? $refund_result['details'][0]['description'] ?? 'Unbekannter Fehler';
                return new WP_Error('paypal_error', 'PayPal Refund fehlgeschlagen: ' . $msg);
            }

            $order->add_order_note(sprintf(
                'PayPal Refund erfolgreich: %s (€%s). Grund: %s',
                $refund_result['id'] ?? 'N/A',
                number_format($amount, 2, ',', '.'),
                $reason ?: 'Kein Grund angegeben'
            ));

            return true;
        }
        }
    }
});
