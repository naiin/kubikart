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

        foreach (['_kubikart_bundle_ids', '_kubikart_related_product_ids'] as $key) {
            $this->assertSame('array', $meta[$key]['type']);
            $this->assertTrue($meta[$key]['single']);
            $this->assertSame(['type' => 'integer'], $meta[$key]['show_in_rest']['schema']['items']);
        }
        $this->assertArrayNotHasKey('_kubikart_featured_kit_id', $meta);
    }

    public function test_rest_meta_and_non_public_states_require_edit_capability(): void
    {
        kubikart_register_business_industry_post_type();
        kubikart_register_business_industry_meta();
        $postType = $GLOBALS['_wp_post_types']['business_industry'];
        $auth = $GLOBALS['_wp_post_meta_registrations']['business_industry']
            ['_kubikart_bundle_ids']['auth_callback'];

        $this->assertTrue($postType['map_meta_cap']);
        $this->assertSame('post', $postType['capability_type']);

        $GLOBALS['_wp_mock_user_can'] = false;
        $this->assertFalse($auth(false, '_kubikart_bundle_ids', 80));
        $GLOBALS['_wp_mock_user_can'] = true;
        $this->assertTrue($auth(false, '_kubikart_bundle_ids', 80));
    }

    public function test_polylang_filter_enables_the_post_type(): void
    {
        $postTypes = kubikart_industry_enable_polylang(['post' => 'post']);
        $this->assertSame('business_industry', $postTypes['business_industry']);
    }

    public function test_authenticated_rest_read_gets_only_approved_relationship_ids(): void
    {
        kubikart_register_business_industry_rest_fields();
        update_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, [41, 42]);
        update_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, [12, 13]);
        $fields = $GLOBALS['_wp_rest_fields']['business_industry'];

        $GLOBALS['_wp_mock_user_can'] = true;
        $this->assertSame([41, 42], $fields[KUBIKART_INDUSTRY_BUNDLES_META]['get_callback'](['id' => 80]));
        $this->assertSame([12, 13], $fields[KUBIKART_INDUSTRY_RELATED_PRODUCTS_META]['get_callback'](['id' => 80]));

        $GLOBALS['_wp_mock_user_can'] = false;
        $this->assertSame([], $fields[KUBIKART_INDUSTRY_BUNDLES_META]['get_callback'](['id' => 80]));
        $this->assertSame([], $fields[KUBIKART_INDUSTRY_RELATED_PRODUCTS_META]['get_callback'](['id' => 80]));
    }

    public function test_unauthorized_rest_write_is_rejected(): void
    {
        kubikart_register_business_industry_rest_fields();
        $callback = $GLOBALS['_wp_rest_fields']['business_industry']
            [KUBIKART_INDUSTRY_BUNDLES_META]['update_callback'];
        $GLOBALS['_wp_mock_user_can'] = false;

        $result = $callback([41], (object) ['ID' => 80]);

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

    public function test_validates_bundles_against_localized_category_and_keeps_bundles_out_of_products(): void
    {
        $this->seedProduct(41, 'Starter Sichtbarkeits-Paket');
        $this->seedProduct(12, 'Review stand');
        $GLOBALS['_wp_product_terms'][41]['product_cat'] = ['business-kits-de'];

        $valid = kubikart_industry_validate_relationships([41], [12], 'de');
        $wrongLanguage = kubikart_industry_validate_relationships([41], [], 'en');
        $notABundle = kubikart_industry_validate_relationships([12], [], 'de');
        $bundleAsProduct = kubikart_industry_validate_relationships([], [41], 'de');

        $this->assertTrue($valid['valid']);
        $this->assertFalse($wrongLanguage['valid']);
        $this->assertFalse($notABundle['valid']);
        $this->assertFalse($bundleAsProduct['valid']);
        $this->assertStringContainsString('Business Bundle', $bundleAsProduct['errors'][0]);
    }

    public function test_rejects_stale_related_products_without_replacing_them(): void
    {
        $this->seedProduct(12, 'Valid product');
        $result = kubikart_industry_validate_relationships([], [12, 999], 'de');

        $this->assertFalse($result['valid']);
        $this->assertSame([12, 999], $result['product_ids']);
        $this->assertStringContainsString('999', $result['errors'][0]);
    }

    public function test_woocommerce_unavailable_preserves_submitted_relationships(): void
    {
        $GLOBALS['_wp_mock_post_type_exists'] = false;
        $result = kubikart_industry_validate_relationships([44, 44], [9, 8, 9], 'de');

        $this->assertFalse($result['valid']);
        $this->assertFalse($result['woocommerce_available']);
        $this->assertSame([44], $result['bundle_ids']);
        $this->assertSame([9, 8], $result['product_ids']);
        $this->assertNotEmpty($result['warnings']);
    }

    public function test_metabox_has_separate_bundle_and_product_pickers_with_ordering_controls(): void
    {
        $this->seedProduct(41, 'Starter Paket');
        $this->seedProduct(43, 'Gastro Paket');
        $this->seedProduct(12, 'Review stand', 'draft');
        $GLOBALS['_wp_product_terms'][41]['product_cat'] = ['business-kits-de'];
        $GLOBALS['_wp_product_terms'][43]['product_cat'] = ['business-kits-de'];
        update_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, [43]);
        $GLOBALS['_wp_mock_get_posts'] = static fn () => [41, 43, 12];

        ob_start();
        kubikart_industry_render_relationship_metabox((object) ['ID' => 80]);
        $html = ob_get_clean();

        $this->assertStringContainsString('id="kubikart-bundles-picker"', $html);
        $this->assertStringContainsString('id="kubikart-products-picker"', $html);
        $this->assertStringContainsString('name="kubikart_bundle_ids[]"', $html);
        $this->assertStringContainsString('name="kubikart_related_product_ids[]"', $html);
        $this->assertStringContainsString('name="kubikart_bundle_ids_present"', $html);
        $this->assertStringContainsString('data-action="up"', $html);
        $this->assertStringContainsString('data-action="remove"', $html);
        $this->assertStringContainsString('kubikart-product-search', $html);
        $this->assertStringNotContainsString('kubikart_featured_kit_id', $html);
        $this->assertStringNotContainsString('type="number"', $html);

        [$bundlePicker, $productPicker] = explode('id="kubikart-products-picker"', $html, 2) + ['', ''];
        $this->assertStringContainsString('Starter Paket', $bundlePicker);
        $this->assertStringContainsString('Gastro Paket', $bundlePicker);
        $this->assertStringNotContainsString('Review stand', $bundlePicker);
        $this->assertStringContainsString('Review stand', $productPicker);
        $this->assertStringNotContainsString('Starter Paket', $productPicker);
    }

    public function test_save_requires_nonce_capability_and_rejects_autosaves(): void
    {
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'Restaurants');
        $_POST = [
            KUBIKART_INDUSTRY_NONCE_NAME => 'wrong',
            'kubikart_bundle_ids_present' => '1',
            'kubikart_bundle_ids' => ['41'],
        ];
        kubikart_save_business_industry_relationships(80);
        $this->assertSame('', get_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, true));

        $_POST[KUBIKART_INDUSTRY_NONCE_NAME] = 'test-nonce';
        $GLOBALS['_wp_mock_user_can'] = false;
        kubikart_save_business_industry_relationships(80);
        $this->assertSame('', get_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, true));

        $GLOBALS['_wp_mock_user_can'] = true;
        $GLOBALS['_wp_mock_autosave'] = true;
        kubikart_save_business_industry_relationships(80);
        $this->assertSame('', get_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, true));
    }

    private function seedIndustryProducts(): void
    {
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'Restaurants');
        foreach ([41 => 'Starter', 42 => 'Gastro', 43 => 'Fenster'] as $id => $title) {
            $this->seedProduct($id, $title . ' Paket');
            $GLOBALS['_wp_product_terms'][$id]['product_cat'] = ['business-kits-de'];
        }
        $this->seedProduct(12, 'Review stand');
        $this->seedProduct(13, 'Opening hours');
    }

    public function test_valid_save_persists_multiple_bundles_and_products_in_the_submitted_order(): void
    {
        $this->seedIndustryProducts();
        update_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, 41);
        $_POST = [
            KUBIKART_INDUSTRY_NONCE_NAME => 'test-nonce',
            'kubikart_bundle_ids_present' => '1',
            'kubikart_bundle_ids' => ['43', '41', '43', '42'],
            'kubikart_related_product_ids_present' => '1',
            'kubikart_related_product_ids' => ['13', '12', '13'],
        ];

        kubikart_save_business_industry_relationships(80);

        $this->assertSame([43, 41, 42], get_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, true));
        $this->assertSame([13, 12], get_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true));
        $this->assertSame('', get_post_meta(80, KUBIKART_INDUSTRY_FEATURED_KIT_META, true), 'the retired featured field is cleared');
    }

    public function test_removing_every_bundle_stores_a_deliberately_empty_list(): void
    {
        $this->seedIndustryProducts();
        update_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, [41, 42]);
        update_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, [12]);
        $_POST = [
            KUBIKART_INDUSTRY_NONCE_NAME => 'test-nonce',
            'kubikart_bundle_ids_present' => '1',
            'kubikart_related_product_ids_present' => '1',
            'kubikart_related_product_ids' => ['12'],
        ];

        kubikart_save_business_industry_relationships(80);

        $this->assertSame([], get_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, true));
        $this->assertTrue(metadata_exists('post', 80, KUBIKART_INDUSTRY_BUNDLES_META));
        $this->assertSame([12], get_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true));
    }

    public function test_a_form_without_the_sections_changes_nothing(): void
    {
        $this->seedIndustryProducts();
        update_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, [41]);
        $_POST = [KUBIKART_INDUSTRY_NONCE_NAME => 'test-nonce'];

        kubikart_save_business_industry_relationships(80);

        $this->assertSame([41], get_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, true));
    }

    public function test_invalid_save_preserves_existing_relationships(): void
    {
        $this->seedIndustryProducts();
        update_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, [41]);
        update_post_meta(80, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, [12]);
        $_POST = [
            KUBIKART_INDUSTRY_NONCE_NAME => 'test-nonce',
            'kubikart_bundle_ids_present' => '1',
            'kubikart_bundle_ids' => ['999'],
            'kubikart_related_product_ids_present' => '1',
            'kubikart_related_product_ids' => ['998'],
        ];

        kubikart_save_business_industry_relationships(80);

        $this->assertSame([41], get_post_meta(80, KUBIKART_INDUSTRY_BUNDLES_META, true));
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
        if (function_exists('kubikart_frontend_revalidate_flush')) {
            kubikart_frontend_revalidate_flush(); // the frontend-revalidation mu-plugin defers delivery to shutdown
        }

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
