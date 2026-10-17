<?php

use PHPUnit\Framework\TestCase;

if (!function_exists('wp_get_post_parent_id')) {
    function wp_get_post_parent_id($post_id) {
        return $GLOBALS['_wp_posts'][$post_id]->post_parent ?? 0;
    }
}
if (!function_exists('sanitize_key')) {
    function sanitize_key($key) {
        return strtolower(preg_replace('/[^a-z0-9_\-]/i', '', (string) $key));
    }
}
if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field($value) {
        return trim(strip_tags((string) $value));
    }
}

class KubikartPurchaseModeFakeProduct
{
    public function __construct(private int $id) {}

    public function get_id(): int { return $this->id; }
}

class KubikartPurchaseModeTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-purchase-mode.php';
        $GLOBALS['_wp_posts'] = [
            10 => (object) ['ID' => 10, 'post_type' => 'product', 'post_status' => 'publish', 'post_parent' => 0],
            11 => (object) ['ID' => 11, 'post_type' => 'product_variation', 'post_status' => 'publish', 'post_parent' => 10],
        ];
    }

    public function test_unset_mode_keeps_existing_products_directly_purchasable(): void
    {
        $this->assertSame('purchase', kubikart_get_purchase_mode(10));
        $this->assertFalse(kubikart_purchase_mode_is_explicit(10));
        $this->assertTrue(apply_filters('woocommerce_is_purchasable', true, new KubikartPurchaseModeFakeProduct(10)));
    }

    public function test_explicit_enquiry_makes_the_product_and_its_variations_unpurchasable(): void
    {
        kubikart_set_purchase_mode(10, 'enquiry');

        $this->assertSame('enquiry', kubikart_get_purchase_mode(10));
        $this->assertSame('enquiry', kubikart_get_purchase_mode(11));
        $this->assertFalse(apply_filters('woocommerce_is_purchasable', true, new KubikartPurchaseModeFakeProduct(10)));
        $this->assertFalse(apply_filters('woocommerce_is_purchasable', true, new KubikartPurchaseModeFakeProduct(11)));
    }

    public function test_the_mode_never_depends_on_the_product_name(): void
    {
        $GLOBALS['_wp_posts'][10]->post_title = 'Business-Paket Deluxe';

        $this->assertSame('purchase', kubikart_get_purchase_mode(10));
    }

    public function test_invalid_values_clear_the_setting(): void
    {
        kubikart_set_purchase_mode(10, 'enquiry');
        kubikart_set_purchase_mode(10, 'bogus');

        $this->assertSame('purchase', kubikart_get_purchase_mode(10));
        $this->assertFalse(kubikart_purchase_mode_is_explicit(10));
    }

    public function test_rest_response_exposes_mode_and_set_configuration(): void
    {
        kubikart_set_purchase_mode(10, 'purchase');
        update_post_meta(10, KUBIKART_SET_CONFIG_META_KEY, ['field_id' => 'diameter', 'unit_label' => 'Sticker', 'options' => ['25' => 54, '37' => 35, '50' => 20, 'bad' => 0]]);

        $response = apply_filters('woocommerce_rest_prepare_product_object', new WP_REST_Response(['meta_data' => []]), new KubikartPurchaseModeFakeProduct(10));
        $meta = array_column($response->data['meta_data'], 'value', 'key');

        $this->assertSame(['mode' => 'purchase', 'explicit' => true], $meta['_kubikart_purchase']);
        $this->assertSame(['25' => 54, '37' => 35, '50' => 20], $meta['_kubikart_set_config']['options']);
        $this->assertSame('diameter', $meta['_kubikart_set_config']['field_id']);
    }
}
