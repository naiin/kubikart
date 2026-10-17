<?php

use PHPUnit\Framework\TestCase;

// Polylang / term stubs, guarded so they never clash with bootstrap.php additions.
if (!function_exists('get_term')) {
    function get_term(int $term_id, string $taxonomy = ''): object|null {
        return $GLOBALS['_wp_terms'][$term_id] ?? null;
    }
}
if (!function_exists('pll_get_post_translations')) {
    function pll_get_post_translations(int $post_id): array {
        return $GLOBALS['_wp_pll_post_translations'][$post_id] ?? [];
    }
}

class KubikartRevalidationFakeProduct
{
    public function __construct(private int $id) {}

    public function get_id(): int { return $this->id; }
}

class KubikartFrontendRevalidationTest extends TestCase
{
    private const DE = 164;
    private const EN = 163;
    private const VARIATION = 900;

    private string $errorLog;
    private string|false $previousErrorLog;

    protected function setUp(): void
    {
        wp_reset_mocks();
        if (!defined('KUBIKART_FRONTEND_URL')) {
            define('KUBIKART_FRONTEND_URL', 'https://frontend.test');
        }
        if (!defined('KUBIKART_REVALIDATE_SECRET')) {
            define('KUBIKART_REVALIDATE_SECRET', 'test-secret');
        }
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-frontend-revalidation.php';

        $GLOBALS['kubikart_revalidate_queue'] = [];
        $GLOBALS['_wp_remote_posts'] = [];
        $GLOBALS['_wp_posts'] = [
            self::DE => $this->post(self::DE, 'product', 'publish', 'barber-salon-kit-de'),
            self::EN => $this->post(self::EN, 'product', 'publish', 'barber-salon-kit'),
            self::VARIATION => $this->post(self::VARIATION, 'product_variation', 'publish', 'variation', self::DE),
            50 => $this->post(50, 'page', 'publish', 'about'),
        ];
        $GLOBALS['_wp_pll_post_translations'][self::DE] = ['de' => self::DE, 'en' => self::EN];
        $GLOBALS['_wp_post_languages'] = [self::DE => 'de', self::EN => 'en'];

        $this->errorLog = __DIR__ . '/../.revalidation-errors.log';
        @unlink($this->errorLog);
        $this->previousErrorLog = ini_set('error_log', $this->errorLog);
    }

    protected function tearDown(): void
    {
        ini_set('error_log', (string) $this->previousErrorLog);
        @unlink($this->errorLog);
        $GLOBALS['kubikart_revalidate_queue'] = [];
        unset($GLOBALS['_wp_filters']['kubikart_frontend_revalidate_enabled']);
    }

    public function test_registers_hooks_for_products_variations_categories_and_trash(): void
    {
        foreach ([
            'woocommerce_new_product', 'woocommerce_update_product', 'save_post_product',
            'transition_post_status', 'woocommerce_product_set_stock', 'woocommerce_variation_set_stock',
            'woocommerce_product_set_stock_status', 'woocommerce_variation_set_stock_status',
            'woocommerce_new_product_variation', 'woocommerce_update_product_variation',
            'woocommerce_trash_product_variation', 'woocommerce_delete_product_variation',
            'updated_post_meta', 'wp_trash_post', 'before_delete_post', 'untrashed_post',
            'created_product_cat', 'edited_product_cat', 'delete_product_cat',
        ] as $hook) {
            $this->assertTrue(has_action($hook), $hook . ' is not hooked');
        }
    }

    public function test_repeated_product_events_are_sent_once_as_a_signed_request(): void
    {
        do_action('woocommerce_update_product', self::DE, null);
        do_action('save_post_product', self::DE);
        do_action('updated_post_meta', 1, self::DE, '_price', '153');
        do_action('woocommerce_update_product', self::DE, null);
        $this->assertSame([], $GLOBALS['_wp_remote_posts'], 'nothing is sent before shutdown');

        kubikart_frontend_revalidate_flush();

        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
        $request = $GLOBALS['_wp_remote_posts'][0];
        $this->assertSame(KUBIKART_FRONTEND_URL . '/api/revalidate', $request['url']);
        $this->assertSame('product.updated', $request['args']['headers']['X-WC-Webhook-Topic']);
        $this->assertSame(
            base64_encode(hash_hmac('sha256', $request['args']['headers']['X-Kubikart-Timestamp'] . '.' . $request['args']['body'], KUBIKART_REVALIDATE_SECRET, true)),
            $request['args']['headers']['X-WC-Webhook-Signature']
        );
        $this->assertEqualsWithDelta(time(), (int) $request['args']['headers']['X-Kubikart-Timestamp'], 5);
        $this->assertTrue($request['args']['blocking']);
        $this->assertLessThanOrEqual(3, $request['args']['timeout']);
        $payload = json_decode($request['args']['body'], true);
        $this->assertSame(self::DE, $payload['id']);
        $this->assertSame('barber-salon-kit-de', $payload['slug']);
        $this->assertSame('de', $payload['language']);
        $this->assertSame(['id' => self::EN, 'slug' => 'barber-salon-kit'], $payload['translations']['en']);
        $this->assertStringNotContainsString(KUBIKART_REVALIDATE_SECRET, $request['args']['body']);
    }

    public function test_flush_registers_on_shutdown_and_empties_the_queue(): void
    {
        do_action('woocommerce_update_product', self::EN, null);

        $this->assertTrue(has_action('shutdown'));
        kubikart_frontend_revalidate_flush();
        kubikart_frontend_revalidate_flush();
        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
    }

    public function test_new_product_uses_the_created_topic(): void
    {
        do_action('woocommerce_new_product', self::EN, null);
        kubikart_frontend_revalidate_flush();

        $this->assertSame('product.created', $GLOBALS['_wp_remote_posts'][0]['args']['headers']['X-WC-Webhook-Topic']);
    }

    public function test_variation_events_revalidate_the_parent_product(): void
    {
        do_action('woocommerce_update_product_variation', self::VARIATION, null);
        do_action('woocommerce_delete_product_variation', self::VARIATION);
        kubikart_frontend_revalidate_flush();

        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
        $request = $GLOBALS['_wp_remote_posts'][0];
        $this->assertSame('product.updated', $request['args']['headers']['X-WC-Webhook-Topic']);
        $this->assertSame(self::DE, json_decode($request['args']['body'], true)['id']);
    }

    public function test_stock_changes_revalidate_the_product(): void
    {
        do_action('woocommerce_product_set_stock', new KubikartRevalidationFakeProduct(self::EN));
        do_action('woocommerce_variation_set_stock', new KubikartRevalidationFakeProduct(self::VARIATION));
        do_action('woocommerce_product_set_stock_status', self::EN, 'outofstock', null);
        kubikart_frontend_revalidate_flush();

        $ids = array_map(
            static fn (array $request): int => json_decode($request['args']['body'], true)['id'],
            $GLOBALS['_wp_remote_posts']
        );
        sort($ids);
        $this->assertSame([self::EN, self::DE], $ids);
    }

    public function test_only_price_and_stock_meta_trigger_a_revalidation(): void
    {
        do_action('updated_post_meta', 1, self::DE, '_some_other_key', 'x');
        do_action('added_post_meta', 2, self::DE, '_visit_counter', '1');
        kubikart_frontend_revalidate_flush();
        $this->assertSame([], $GLOBALS['_wp_remote_posts']);

        do_action('added_post_meta', 3, self::DE, '_stock_status', 'outofstock');
        kubikart_frontend_revalidate_flush();
        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
    }

    public function test_trash_captures_the_slug_before_wordpress_renames_it(): void
    {
        do_action('wp_trash_post', self::DE);
        $GLOBALS['_wp_posts'][self::DE]->post_name = 'barber-salon-kit-de__trashed';
        $GLOBALS['_wp_posts'][self::DE]->post_status = 'trash';
        do_action('transition_post_status', 'trash', 'publish', $GLOBALS['_wp_posts'][self::DE]);
        kubikart_frontend_revalidate_flush();

        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
        $request = $GLOBALS['_wp_remote_posts'][0];
        $this->assertSame('product.deleted', $request['args']['headers']['X-WC-Webhook-Topic']);
        $this->assertSame('barber-salon-kit-de', json_decode($request['args']['body'], true)['slug']);
    }

    public function test_permanent_delete_and_restore_use_matching_topics(): void
    {
        do_action('before_delete_post', self::EN);
        do_action('untrashed_post', self::DE);
        kubikart_frontend_revalidate_flush();

        $topics = array_map(
            static fn (array $request): string => $request['args']['headers']['X-WC-Webhook-Topic'],
            $GLOBALS['_wp_remote_posts']
        );
        sort($topics);
        $this->assertSame(['product.deleted', 'product.restored'], $topics);
    }

    public function test_status_change_to_draft_revalidates_the_product(): void
    {
        $GLOBALS['_wp_posts'][self::DE]->post_status = 'draft';
        do_action('transition_post_status', 'draft', 'publish', $GLOBALS['_wp_posts'][self::DE]);
        do_action('transition_post_status', 'publish', 'publish', $GLOBALS['_wp_posts'][self::EN]);
        kubikart_frontend_revalidate_flush();

        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
        $this->assertSame('draft', json_decode($GLOBALS['_wp_remote_posts'][0]['args']['body'], true)['status']);
    }

    public function test_other_post_types_and_auto_drafts_are_ignored(): void
    {
        $GLOBALS['_wp_posts'][self::EN]->post_status = 'auto-draft';
        do_action('wp_trash_post', 50);
        do_action('before_delete_post', 50);
        do_action('transition_post_status', 'draft', 'publish', $GLOBALS['_wp_posts'][50]);
        do_action('woocommerce_new_product', self::EN, null);
        do_action('woocommerce_update_product', 99999, null);
        kubikart_frontend_revalidate_flush();

        $this->assertSame([], $GLOBALS['_wp_remote_posts']);
    }

    public function test_product_category_changes_send_category_topics(): void
    {
        $GLOBALS['_wp_terms'][187] = (object) [
            'term_id' => 187, 'slug' => 'business-kits-de', 'name' => 'Business Kits', 'taxonomy' => 'product_cat',
        ];
        do_action('created_product_cat', 187, 5);
        do_action('edited_product_cat', 187, 5);
        do_action('delete_product_cat', 188, 6, (object) [
            'term_id' => 188, 'slug' => 'old-category', 'name' => 'Old', 'taxonomy' => 'product_cat',
        ], []);
        kubikart_frontend_revalidate_flush();

        $sent = [];
        foreach ($GLOBALS['_wp_remote_posts'] as $request) {
            $sent[$request['args']['headers']['X-WC-Webhook-Topic']] = json_decode($request['args']['body'], true);
        }
        ksort($sent);
        $this->assertSame(['category.created', 'category.deleted', 'category.updated'], array_keys($sent));
        $this->assertSame('business-kits-de', $sent['category.updated']['slug']);
        $this->assertSame('Business Kits', $sent['category.updated']['name']);
        $this->assertSame('old-category', $sent['category.deleted']['slug']);
    }

    public function test_industry_notifications_are_deduplicated_and_signed_centrally(): void
    {
        require_once __DIR__ . '/../../wordpress/wp-content/plugins/kubikart-business-industries/kubikart-business-industries.php';
        $GLOBALS['_wp_posts'][80] = $this->post(80, 'business_industry', 'publish', 'restaurants');

        kubikart_revalidate_business_industry(80, 'updated');
        kubikart_revalidate_business_industry(80, 'updated');
        $this->assertSame([], $GLOBALS['_wp_remote_posts']);
        kubikart_frontend_revalidate_flush();

        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
        $request = $GLOBALS['_wp_remote_posts'][0];
        $this->assertSame('industry.updated', $request['args']['headers']['X-WC-Webhook-Topic']);
        $this->assertSame(
            base64_encode(hash_hmac('sha256', $request['args']['headers']['X-Kubikart-Timestamp'] . '.' . $request['args']['body'], KUBIKART_REVALIDATE_SECRET, true)),
            $request['args']['headers']['X-WC-Webhook-Signature']
        );
    }

    public function test_legacy_product_fields_helper_still_triggers_a_revalidation(): void
    {
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-custom-product-fields.php';

        kubikart_revalidate_product_fields(self::DE);
        kubikart_frontend_revalidate_flush();

        $this->assertCount(1, $GLOBALS['_wp_remote_posts']);
        $this->assertSame('product.updated', $GLOBALS['_wp_remote_posts'][0]['args']['headers']['X-WC-Webhook-Topic']);
    }

    public function test_an_unreachable_frontend_is_logged_without_the_secret_and_stops_after_one_attempt(): void
    {
        $GLOBALS['_wp_remote_post_response'] = new WP_Error('http_request_failed', 'Connection refused');
        do_action('woocommerce_update_product', self::DE, null);
        do_action('woocommerce_update_product', self::EN, null);

        kubikart_frontend_revalidate_flush();

        $this->assertCount(1, $GLOBALS['_wp_remote_posts'], 'a failing frontend costs one attempt per request');
        $log = (string) file_get_contents($this->errorLog);
        $this->assertStringContainsString('[kubikart-revalidate]', $log);
        $this->assertStringContainsString('Connection refused', $log);
        $this->assertStringNotContainsString(KUBIKART_REVALIDATE_SECRET, $log);
    }

    public function test_a_rejected_signature_is_reported_without_throwing(): void
    {
        $GLOBALS['_wp_remote_post_response'] = ['response' => ['code' => 401]];
        do_action('woocommerce_update_product', self::DE, null);

        kubikart_frontend_revalidate_flush();

        $log = (string) file_get_contents($this->errorLog);
        $this->assertStringContainsString('HTTP 401', $log);
        $this->assertStringNotContainsString(KUBIKART_REVALIDATE_SECRET, $log);
    }

    public function test_revalidation_can_be_disabled_with_a_filter(): void
    {
        add_filter('kubikart_frontend_revalidate_enabled', '__return_false');
        do_action('woocommerce_update_product', self::DE, null);
        kubikart_frontend_revalidate_flush();

        $this->assertSame([], $GLOBALS['_wp_remote_posts']);
    }

    public function test_invalid_topics_are_never_sent(): void
    {
        $this->assertFalse(kubikart_frontend_revalidate_send('Product Updated', ['id' => 1]));
        $this->assertSame([], $GLOBALS['_wp_remote_posts']);
    }

    private function post(int $id, string $type, string $status, string $slug, int $parent = 0): object
    {
        return (object) [
            'ID' => $id,
            'post_type' => $type,
            'post_status' => $status,
            'post_title' => $slug,
            'post_name' => $slug,
            'post_parent' => $parent,
        ];
    }
}
