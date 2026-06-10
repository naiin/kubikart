<?php

use PHPUnit\Framework\TestCase;

/**
 * Tests for kubikart-payment-gateway.php (mu-plugin)
 *
 * The gateway classes are defined inside plugins_loaded callback.
 * We trigger that action in setUp() to get them instantiated.
 *
 * Covers:
 * - Stripe refund: missing transaction ID → WP_Error
 * - Stripe refund: missing secret key → WP_Error
 * - PayPal refund: missing credentials → WP_Error
 * - PayPal refund: missing transaction ID → WP_Error
 */
class KubikartPaymentGatewayTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();

        // Stub WC_Payment_Gateway base class before loading plugin
        if (!class_exists('WC_Payment_Gateway')) {
            eval('
                class WC_Payment_Gateway {
                    public string $id = "";
                    public string $method_title = "";
                    public string $method_description = "";
                    public bool   $has_fields = false;
                    public array  $supports = [];
                    public string $title = "";
                    public string $enabled = "yes";
                    private array $options = [];

                    public function init_form_fields(): void {}
                    public function init_settings(): void {}
                    public function get_option(string $key, mixed $default = ""): mixed {
                        return $this->options[$key] ?? $default;
                    }
                    public function set_option(string $key, mixed $value): void {
                        $this->options[$key] = $value;
                    }
                }
            ');
        }

        // Stub wc_get_order
        if (!function_exists('wc_get_order')) {
            // Defined via GLOBALS mock pattern
        }

        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-payment-gateway.php';

        // Trigger plugins_loaded to define the gateway classes
        do_action('plugins_loaded');
    }

    // ── Stripe gateway ────────────────────────────────────────────────────────

    public function test_stripe_refund_fails_when_no_transaction_id(): void
    {
        $gateway = new WC_Gateway_Kubikart_Stripe();
        $GLOBALS['_wp_mock_wc_order'] = $this->createMockOrder('', 'stripe');

        $result = $this->callStripeRefund($gateway, 999, 10.00);
        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertSame('no_transaction', $result->get_error_code());
    }

    public function test_stripe_refund_fails_when_no_secret_key(): void
    {
        $gateway = new WC_Gateway_Kubikart_Stripe();
        // No key in gateway options or wp_options
        $GLOBALS['_wp_mock_wc_order'] = $this->createMockOrder('pi_test123', 'stripe');

        $result = $this->callStripeRefund($gateway, 1, 5.00);
        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertSame('no_key', $result->get_error_code());
    }

    // ── PayPal gateway ────────────────────────────────────────────────────────

    public function test_paypal_refund_fails_when_no_transaction_id(): void
    {
        $gateway = new WC_Gateway_Kubikart_PayPal();
        $GLOBALS['_wp_mock_wc_order'] = $this->createMockOrder('', 'paypal');

        $result = $this->callPayPalRefund($gateway, 999, 15.00);
        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertSame('no_transaction', $result->get_error_code());
    }

    public function test_paypal_refund_fails_when_no_credentials(): void
    {
        $gateway = new WC_Gateway_Kubikart_PayPal();
        $GLOBALS['_wp_mock_wc_order'] = $this->createMockOrder('PAYPALCAPTURE123', 'paypal');
        // No credentials in options

        $result = $this->callPayPalRefund($gateway, 1, 20.00);
        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertSame('no_credentials', $result->get_error_code());
    }

    // ── Gateway registration ──────────────────────────────────────────────────

    public function test_stripe_gateway_is_registered(): void
    {
        $gateways = apply_filters('woocommerce_payment_gateways', []);
        $this->assertContains('WC_Gateway_Kubikart_Stripe', $gateways);
    }

    public function test_paypal_gateway_is_registered(): void
    {
        $gateways = apply_filters('woocommerce_payment_gateways', []);
        $this->assertContains('WC_Gateway_Kubikart_PayPal', $gateways);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function createMockOrder(string $transactionId, string $method): object
    {
        return new class($transactionId, $method) {
            public function __construct(
                private string $txId,
                private string $method
            ) {}
            public function get_transaction_id(): string { return $this->txId; }
            public function get_payment_method(): string { return $this->method; }
        };
    }

    private function callStripeRefund(object $gateway, int $orderId, float $amount): mixed
    {
        if (!function_exists('wc_get_order')) {
            // Inline stub using global
            $GLOBALS['wc_get_order_stub'] = $GLOBALS['_wp_mock_wc_order'];
        }
        // Monkey-patch wc_get_order via namespace or direct call
        return $gateway->process_refund($orderId, $amount);
    }

    private function callPayPalRefund(object $gateway, int $orderId, float $amount): mixed
    {
        return $gateway->process_refund($orderId, $amount);
    }
}

// Stub wc_get_order globally so gateway methods can call it
if (!function_exists('wc_get_order')) {
    function wc_get_order(int $id): mixed {
        return $GLOBALS['_wp_mock_wc_order'] ?? null;
    }
}

// Stub wp_remote_post (used by Stripe/PayPal APIs)
if (!function_exists('wp_remote_post')) {
    function wp_remote_post(string $url, array $args = []): array|WP_Error {
        $mock = $GLOBALS['_wp_mock_wp_remote_post'] ?? null;
        if (is_callable($mock)) return $mock($url, $args);
        return ['response' => ['code' => 200, 'message' => 'OK'], 'body' => '{}'];
    }
}

if (!function_exists('wp_remote_retrieve_body')) {
    function wp_remote_retrieve_body(array $response): string {
        return $response['body'] ?? '{}';
    }
}

if (!function_exists('wp_remote_retrieve_response_code')) {
    function wp_remote_retrieve_response_code(array $response): int {
        return $response['response']['code'] ?? 200;
    }
}
