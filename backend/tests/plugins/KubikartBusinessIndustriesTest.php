<?php

use PHPUnit\Framework\TestCase;

class KubikartBusinessIndustriesTest extends TestCase
{
    private string $pluginFile;

    protected function setUp(): void
    {
        wp_reset_mocks();
        $_POST = [];
        $this->pluginFile = __DIR__ . '/../../wordpress/wp-content/plugins/kubikart-business-industries/kubikart-business-industries.php';
        require_once $this->pluginFile;
    }

    protected function tearDown(): void
    {
        $_POST = [];
    }

    public function test_registers_the_expected_rest_enabled_post_type(): void
    {
        kubikart_register_business_industry_post_type();
        $args = $GLOBALS['_wp_post_types']['business_industry'];

        $this->assertTrue($args['public']);
        $this->assertTrue($args['show_ui']);
        $this->assertTrue($args['show_in_rest']);
        $this->assertSame('business-industries', $args['rest_base']);
        $this->assertFalse($args['has_archive']);
        $this->assertFalse($args['rewrite']);
        $this->assertFalse($args['hierarchical']);
        $this->assertFalse($args['publicly_queryable']);
        $this->assertSame(
            ['title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'page-attributes'],
            $args['supports']
        );
    }

    public function test_registration_does_not_create_content(): void
    {
        $GLOBALS['_wp_posts'] = [];
        kubikart_register_business_industry_post_type();
        $this->assertSame([], $GLOBALS['_wp_posts']);
    }

    public function test_registers_strict_rest_meta_schemas(): void
    {
        kubikart_register_business_industry_meta();
        $meta = $GLOBALS['_wp_post_meta_registrations']['business_industry'];

        $this->assertSame('integer', $meta['_kubikart_featured_kit_id']['type']);
        $this->assertTrue($meta['_kubikart_featured_kit_id']['single']);
        $this->assertSame('integer', $meta['_kubikart_featured_kit_id']['show_in_rest']['schema']['type']);
        $this->assertSame('array', $meta['_kubikart_related_product_ids']['type']);
        $this->assertSame(
            ['type' => 'integer'],
            $meta['_kubikart_related_product_ids']['show_in_rest']['schema']['items']
        );
    }

    public function test_rest_meta_and_non_public_states_require_edit_capability(): void
    {
        kubikart_register_business_industry_post_type();
        kubikart_register_business_industry_meta();
        $postType = $GLOBALS['_wp_post_types']['business_industry'];
        $auth = $GLOBALS['_wp_post_meta_registrations']['business_industry']
            ['_kubikart_featured_kit_id']['auth_callback'];

        $this->assertTrue($postType['map_meta_cap']);
        $this->assertSame('post', $postType['capability_type']);

        $GLOBALS['_wp_mock_user_can'] = false;
        $this->assertFalse($auth(false, '_kubikart_featured_kit_id', 80));
        $GLOBALS['_wp_mock_user_can'] = true;
        $this->assertTrue($auth(false, '_kubikart_featured_kit_id', 80));
    }

    public function test_polylang_filter_enables_the_post_type(): void
    {
        $postTypes = kubikart_industry_enable_polylang(['post' => 'post']);
        $this->assertSame('business_industry', $postTypes['business_industry']);
    }

    public function test_authenticated_rest_read_gets_only_approved_relationship_ids(): void
    {
        kubikart_register_business_industry_rest_fields();
        update_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, 41);
        update_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, [12, 13]);
        $fields = $GLOBALS['_wp_rest_fields']['business_industry'];

        $GLOBALS['_wp_mock_user_can'] = true;
        $this->assertSame(41, $fields[KUBIKART_INDUSTRY_FEATURED_KIT_META]['get_callback'](['id' => 80]));
        $this->assertSame([12, 13], $fields[KUBIKART_INDUSTRY_RELATED_PRODUCTS_META]['get_callback'](['id' => 80]));

        $GLOBALS['_wp_mock_user_can'] = false;
        $this->assertSame(0, $fields[KUBIKART_INDUSTRY_FEATURED_KIT_META]['get_callback'](['id' => 80]));
        $this->assertSame([], $fields[KUBIKART_INDUSTRY_RELATED_PRODUCTS_META]['get_callback'](['id' => 80]));
    }

    public function test_unauthorized_rest_write_is_rejected(): void
    {
        kubikart_register_business_industry_rest_fields();
        $callback = $GLOBALS['_wp_rest_fields']['business_industry']
            [KUBIKART_INDUSTRY_FEATURED_KIT_META]['update_callback'];
        $GLOBALS['_wp_mock_user_can'] = false;

        $result = $callback(41, (object) ['ID' => 80]);

        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertSame('kubikart_industry_rest_forbidden', $result->get_error_code());
    }

    public function test_related_ids_are_unique_positive_and_keep_owner_order(): void
    {
        $this->assertSame(
            [12, 7, 9],
            kubikart_industry_sanitize_id_list(['12', 7, 12, -9, 0, 'bad'])
        );
    }

    public function test_validates_featured_kit_against_localized_category(): void
    {
        $this->seedProduct(41, 'Starter Sichtbarkeits-Kit');
        $GLOBALS['_wp_product_terms'][41]['product_cat'] = ['business-kits-de'];

        $valid = kubikart_industry_validate_relationships(41, [], 'de');
        $invalid = kubikart_industry_validate_relationships(41, [], 'en');

        $this->assertTrue($valid['valid']);
        $this->assertFalse($invalid['valid']);
        $this->assertNotEmpty($invalid['errors']);
    }

    public function test_rejects_stale_related_products_without_replacing_them(): void
    {
        $this->seedProduct(12, 'Valid product');
        $result = kubikart_industry_validate_relationships(0, [12, 999], 'de');

        $this->assertFalse($result['valid']);
        $this->assertSame([12, 999], $result['related_product_ids']);
        $this->assertStringContainsString('999', $result['errors'][0]);
    }

    public function test_woocommerce_unavailable_preserves_submitted_relationships(): void
    {
        $GLOBALS['_wp_mock_post_type_exists'] = false;
        $result = kubikart_industry_validate_relationships(44, [9, 8, 9], 'de');

        $this->assertFalse($result['valid']);
        $this->assertFalse($result['woocommerce_available']);
        $this->assertSame(44, $result['featured_kit_id']);
        $this->assertSame([9, 8], $result['related_product_ids']);
        $this->assertNotEmpty($result['warnings']);
    }

    public function test_metabox_contains_managed_product_controls_not_numeric_id_fields(): void
    {
        $this->seedProduct(41, 'Starter Visibility Kit');
        $this->seedProduct(12, 'Review stand', 'draft');
        $GLOBALS['_wp_product_terms'][41]['product_cat'] = ['business-kits-de'];
        $GLOBALS['_wp_mock_get_posts'] = static fn () => [41, 12];

        ob_start();
        kubikart_industry_render_relationship_metabox((object) ['ID' => 80]);
        $html = ob_get_clean();

        $this->assertStringContainsString('type="radio" name="kubikart_featured_kit_id"', $html);
        $this->assertStringContainsString('type="checkbox" name="kubikart_related_product_ids[]"', $html);
        $this->assertStringContainsString('Starter Visibility Kit', $html);
        $this->assertStringContainsString('Review stand', $html);
        $this->assertStringContainsString('kubikart-product-search', $html);
        $this->assertStringNotContainsString('type="number"', $html);
    }

    public function test_save_requires_nonce_capability_and_rejects_autosaves(): void
    {
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'Restaurants');
        $_POST = [
            KUBIKART_INDUSTRY_NONCE_NAME => 'wrong',
            'kubikart_featured_kit_id' => '41',
        ];
        kubikart_save_business_industry_relationships(80);
        $this->assertSame('', get_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, true));

        $_POST[KUBIKART_INDUSTRY_NONCE_NAME] = 'test-nonce';
        $GLOBALS['_wp_mock_user_can'] = false;
        kubikart_save_business_industry_relationships(80);
        $this->assertSame('', get_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, true));

        $GLOBALS['_wp_mock_user_can'] = true;
        $GLOBALS['_wp_mock_autosave'] = true;
        kubikart_save_business_industry_relationships(80);
        $this->assertSame('', get_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, true));
    }

    public function test_valid_save_persists_featured_kit_and_related_order(): void
    {
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'Restaurants');
        $this->seedProduct(41, 'Starter Kit');
        $this->seedProduct(12, 'Review stand');
        $this->seedProduct(13, 'Opening hours');
        $GLOBALS['_wp_product_terms'][41]['product_cat'] = ['business-kits-de'];
        $_POST = [
            KUBIKART_INDUSTRY_NONCE_NAME => 'test-nonce',
            'kubikart_featured_kit_id' => '41',
            'kubikart_related_product_ids' => ['13', '12', '13'],
        ];

        kubikart_save_business_industry_relationships(80);

        $this->assertSame(41, get_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, true));
        $this->assertSame([13, 12], get_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true));
    }

    public function test_invalid_save_preserves_existing_relationships(): void
    {
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'Restaurants');
        update_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, 41);
        update_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, [12]);
        $_POST = [
            KUBIKART_INDUSTRY_NONCE_NAME => 'test-nonce',
            'kubikart_featured_kit_id' => '999',
            'kubikart_related_product_ids' => ['998'],
        ];

        kubikart_save_business_industry_relationships(80);

        $this->assertSame(41, get_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, true));
        $this->assertSame([12], get_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true));
    }

    public function test_revalidation_uses_existing_signed_endpoint_contract(): void
    {
        if (!defined('KUBIKART_FRONTEND_URL')) {
            define('KUBIKART_FRONTEND_URL', 'https://frontend.test');
        }
        if (!defined('KUBIKART_REVALIDATE_SECRET')) {
            define('KUBIKART_REVALIDATE_SECRET', 'test-secret');
        }
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'Restaurants', 'restaurants');

        kubikart_revalidate_business_industry(80, 'updated');

        $request = $GLOBALS['_wp_remote_posts'][0];
        $this->assertSame('https://frontend.test/api/revalidate', $request['url']);
        $this->assertSame('industry.updated', $request['args']['headers']['X-WC-Webhook-Topic']);
        $this->assertNotEmpty($request['args']['headers']['X-WC-Webhook-Signature']);
        $payload = json_decode($request['args']['body'], true);
        $this->assertSame(80, $payload['id']);
        $this->assertArrayHasKey('translations', $payload);
    }

    public function test_all_required_revalidation_lifecycle_hooks_are_registered(): void
    {
        $this->assertTrue(has_action('save_post_business_industry'));
        $this->assertTrue(has_action('trashed_post'));
        $this->assertTrue(has_action('untrashed_post'));
        $this->assertTrue(has_action('before_delete_post'));
    }

    public function test_activation_and_deactivation_flush_once_without_deleting_content(): void
    {
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'Restaurants');
        update_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, [12]);

        kubikart_activate_business_industries();
        kubikart_deactivate_business_industries();

        $this->assertSame(2, $GLOBALS['_wp_flush_rewrite_rules']);
        $this->assertNotNull(get_post(80));
        $this->assertSame([12], get_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true));
    }

    private function seedProduct(int $id, string $title, string $status = 'publish'): void
    {
        $GLOBALS['_wp_posts'][$id] = $this->post($id, 'product', $status, $title);
    }

    private function post(
        int $id,
        string $postType,
        string $status,
        string $title,
        string $slug = ''
    ): object {
        return (object) [
            'ID' => $id,
            'post_type' => $postType,
            'post_status' => $status,
            'post_title' => $title,
            'post_name' => $slug,
        ];
    }
}
