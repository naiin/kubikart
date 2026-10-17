<?php

use PHPUnit\Framework\TestCase;

if (!function_exists('wp_get_environment_type')) {
    function wp_get_environment_type() {
        return $GLOBALS['_wp_mock_environment_type'] ?? 'local';
    }
}

if (!class_exists('WP_Post')) {
    class WP_Post
    {
        public function __construct(public int $ID = 0, public string $post_status = 'private') {}
    }
}

class KubikartCustomerFilesTest extends TestCase
{
    private const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    private const JPEG_B64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    private string $root;

    public static function setUpBeforeClass(): void
    {
        // Real uploads use move_uploaded_file(); the harness has none.
        add_filter('kubikart_customer_files_move_upload', fn ($moved, $tmp, $dest) => copy($tmp, $dest), 10, 3);
    }

    protected function setUp(): void
    {
        wp_reset_mocks();
        $this->root = __DIR__ . '/../.tmp-uploads';
        $this->removeTree($this->root);
        mkdir($this->root . '/incoming', 0775, true);
        $GLOBALS['_wp_mock_upload_basedir'] = $this->root;
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-customer-files.php';
    }

    protected function tearDown(): void
    {
        $this->removeTree($this->root);
        wp_reset_mocks();
    }

    // -- private storage configuration ----------------------------------------

    public function test_explicit_directory_can_come_from_the_environment_and_allows_storage(): void
    {
        putenv('KUBIKART_CUSTOMER_FILES_DIR=/srv/kubikart-private/files/');
        try {
            $this->assertSame('/srv/kubikart-private/files', kubikart_cf_configured_dir());
            $this->assertSame('/srv/kubikart-private/files', kubikart_cf_base_dir());
            $this->assertTrue(kubikart_cf_storage_allowed());
        } finally {
            putenv('KUBIKART_CUSTOMER_FILES_DIR');
        }
    }

    public function test_without_explicit_directory_the_legacy_public_location_is_not_used_in_production(): void
    {
        putenv('KUBIKART_CUSTOMER_FILES_DIR');
        $this->assertSame('', kubikart_cf_configured_dir());
        $GLOBALS['_wp_mock_environment_type'] = 'production';
        $this->assertFalse(kubikart_cf_storage_allowed());
        $GLOBALS['_wp_mock_environment_type'] = 'local';
        $this->assertTrue(kubikart_cf_storage_allowed());
    }

    public function test_upload_is_refused_in_production_without_a_private_directory(): void
    {
        putenv('KUBIKART_CUSTOMER_FILES_DIR');
        $GLOBALS['_wp_mock_environment_type'] = 'production';
        $request = new class {
            public function get_file_params() { return []; }
            public function get_param($name) { return ''; }
        };
        $result = kubikart_cf_rest_upload($request);
        $this->assertTrue(is_wp_error($result));
        $this->assertSame('kubikart_file_storage_failed', $result->get_error_code());
        $GLOBALS['_wp_mock_environment_type'] = 'local';
    }

    public function test_upload_limit_is_four_megabytes(): void
    {
        $this->assertSame(4 * 1024 * 1024, KUBIKART_CUSTOMER_FILE_MAX_BYTES);
    }

    // -- type detection -----------------------------------------------------

    public function test_allowed_types_are_detected_from_content(): void
    {
        $this->assertSame('image/png', kubikart_cf_detect_mime($this->fixture('a.bin', $this->png())));
        $this->assertSame('image/jpeg', kubikart_cf_detect_mime($this->fixture('b.png', base64_decode(self::JPEG_B64))));
        $this->assertSame('application/pdf', kubikart_cf_detect_mime($this->fixture('c.png', $this->pdf())));
        $this->assertSame('image/webp', kubikart_cf_detect_mime($this->fixture('d.jpg', $this->webp())));
    }

    public function test_dangerous_or_unknown_content_is_rejected_whatever_the_extension(): void
    {
        $samples = [
            'svg' => '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            'html' => '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>',
            'php' => '<?php system($_GET["c"]); ?>',
            'text' => 'just some text',
        ];
        foreach ($samples as $label => $content) {
            $this->assertFalse(kubikart_cf_detect_mime($this->fixture($label . '.png', $content)), $label);
        }
    }

    // -- upload validation --------------------------------------------------

    public function test_upload_rejections_use_machine_codes_and_status(): void
    {
        $cases = [
            'empty' => [$this->upload('x.png', ''), 'kubikart_file_empty', 422],
            'svg' => [$this->upload('logo.png', '<svg xmlns="http://www.w3.org/2000/svg"/>'), 'kubikart_file_type_not_allowed', 422],
            'php' => [$this->upload('logo.png', '<?php echo 1;'), 'kubikart_file_type_not_allowed', 422],
            'ini_size' => [['name' => 'a.png', 'tmp_name' => '', 'error' => UPLOAD_ERR_INI_SIZE], 'kubikart_file_too_large', 413],
            'partial' => [['name' => 'a.png', 'tmp_name' => '', 'error' => UPLOAD_ERR_PARTIAL], 'kubikart_file_upload_error', 400],
            'no_file' => [['name' => '', 'tmp_name' => '', 'error' => UPLOAD_ERR_NO_FILE], 'kubikart_file_missing', 400],
            'not_array' => [null, 'kubikart_file_missing', 400],
        ];

        foreach ($cases as $label => [$file, $code, $status]) {
            $result = kubikart_cf_store_upload($file);
            $this->assertInstanceOf(WP_Error::class, $result, $label);
            $this->assertSame($code, $result->get_error_code(), $label);
            $this->assertSame($status, $result->get_error_data()['status'], $label);
        }
    }

    public function test_oversize_file_is_rejected_before_content_is_read(): void
    {
        $path = $this->root . '/incoming/big.png';
        $handle = fopen($path, 'w');
        ftruncate($handle, KUBIKART_CUSTOMER_FILE_MAX_BYTES + 1);
        fclose($handle);

        $result = kubikart_cf_store_upload(['name' => 'big.png', 'tmp_name' => $path, 'error' => UPLOAD_ERR_OK]);

        $this->assertSame('kubikart_file_too_large', $result->get_error_code());
        $this->assertSame(413, $result->get_error_data()['status']);
        $this->assertFileDoesNotExist($this->root . '/kubikart-customer-files');
    }

    public function test_file_at_exactly_the_limit_is_accepted(): void
    {
        $png = $this->png();
        $path = $this->root . '/incoming/limit.png';
        file_put_contents($path, $png . str_repeat("\0", KUBIKART_CUSTOMER_FILE_MAX_BYTES - strlen($png)));

        $result = kubikart_cf_store_upload(['name' => 'limit.png', 'tmp_name' => $path, 'error' => UPLOAD_ERR_OK]);

        $this->assertIsArray($result);
        $this->assertSame(KUBIKART_CUSTOMER_FILE_MAX_BYTES, $result['size']);
    }

    // -- storage ------------------------------------------------------------

    public function test_stored_file_uses_token_path_and_detected_extension(): void
    {
        $result = kubikart_cf_store_upload($this->upload('../../evil.php', $this->png()), 'Logo Upload!');

        $this->assertSame(['token', 'filename', 'mime', 'size'], array_keys($result));
        $this->assertMatchesRegularExpression('/\A[a-f0-9]{32}\z/', $result['token']);
        $this->assertSame('image/png', $result['mime']);
        $this->assertSame(strlen($this->png()), $result['size']);
        $this->assertSame('evil.php', $result['filename']);
        $this->assertStringNotContainsString('/', $result['filename']);

        $base = $this->root . '/kubikart-customer-files';
        $expected = $base . '/' . gmdate('Y') . '/' . gmdate('m') . '/' . $result['token'] . '.png';
        $this->assertFileExists($expected);
        $this->assertSame($this->png(), file_get_contents($expected));
        $this->assertFileDoesNotExist(dirname($expected) . '/' . $result['token'] . '.php');
    }

    public function test_storage_directories_are_guarded(): void
    {
        kubikart_cf_store_upload($this->upload('logo.png', $this->png()));
        $base = $this->root . '/kubikart-customer-files';

        foreach ([$base, $base . '/' . gmdate('Y'), $base . '/' . gmdate('Y') . '/' . gmdate('m')] as $dir) {
            $this->assertFileExists($dir . '/index.php');
            $this->assertStringContainsString('Require all denied', file_get_contents($dir . '/.htaccess'));
            $this->assertStringContainsString('Deny from all', file_get_contents($dir . '/.htaccess'));
        }
    }

    public function test_tokens_are_random_and_never_collide(): void
    {
        $tokens = [];
        for ($i = 0; $i < 20; $i++) {
            $tokens[] = kubikart_cf_generate_token();
        }

        $this->assertCount(20, array_unique($tokens));
        foreach ($tokens as $token) {
            $this->assertTrue(kubikart_cf_is_valid_token($token));
        }
    }

    public function test_metadata_round_trips_through_the_sidecar(): void
    {
        $stored = kubikart_cf_store_upload($this->upload('My Logo.PNG', $this->png()), 'logo_upload');
        $record = kubikart_cf_get($stored['token']);

        $this->assertSame($stored['token'], $record['meta']['token']);
        $this->assertSame('My-Logo.PNG', $record['meta']['original_name']);
        $this->assertSame('image/png', $record['meta']['mime']);
        $this->assertSame(strlen($this->png()), $record['meta']['size']);
        $this->assertSame('pending', $record['meta']['status']);
        $this->assertSame(0, $record['meta']['order_id']);
        $this->assertSame('logo_upload', $record['meta']['field_id']);
        $this->assertMatchesRegularExpression('/\A\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\z/', $record['meta']['created_at']);
        $this->assertFileExists($record['path']);
    }

    public function test_long_original_names_are_capped_and_keep_their_extension(): void
    {
        $name = kubikart_cf_clean_filename(str_repeat('a', 300) . '.png');

        $this->assertSame(120, strlen($name));
        $this->assertStringEndsWith('.png', $name);
    }

    public function test_invalid_or_traversal_tokens_never_resolve(): void
    {
        kubikart_cf_store_upload($this->upload('logo.png', $this->png()));

        foreach (['../../../etc/passwd', '..', str_repeat('.', 32), str_repeat('A', 32), str_repeat('a', 31), str_repeat('a', 33), "abc\n", '', '../' . str_repeat('a', 29)] as $bad) {
            $this->assertFalse(kubikart_cf_is_valid_token($bad), $bad);
            $this->assertNull(kubikart_cf_get($bad), $bad);
        }
        $this->assertNull(kubikart_cf_get(str_repeat('a', 32)));
    }

    public function test_tampered_sidecar_cannot_point_outside_the_storage_dir(): void
    {
        $stored = kubikart_cf_store_upload($this->upload('logo.png', $this->png()));
        $record = kubikart_cf_get($stored['token']);
        $meta = $record['meta'];
        $meta['mime'] = '../../../../etc/passwd';
        file_put_contents($record['meta_path'], json_encode($meta));

        $this->assertNull(kubikart_cf_get($stored['token']));
    }

    // -- marker parsing -----------------------------------------------------

    public function test_marker_parsing_and_stripping(): void
    {
        $a = str_repeat('0123abcd', 4);
        $b = str_repeat('f', 32);

        $this->assertSame([$a], kubikart_cf_parse_marker("logo.png [kubikart-file:$a]"));
        $this->assertSame([$a, $b], kubikart_cf_parse_marker("x [kubikart-file:$a] y kubikart-file:$b"));
        $this->assertSame([], kubikart_cf_parse_marker('kubikart-file:' . substr($a, 0, 31)));
        $this->assertSame([], kubikart_cf_parse_marker('kubikart-file:' . strtoupper($a)));
        $this->assertSame([], kubikart_cf_parse_marker('plain'));
        $this->assertSame([], kubikart_cf_parse_marker(['kubikart-file:' . $a]));
        $this->assertSame('logo.png', kubikart_cf_strip_marker("logo.png [kubikart-file:$a]"));
        $this->assertSame('Meine Datei', kubikart_cf_strip_marker("Meine Datei kubikart-file:$a"));
    }

    // -- order attachment ---------------------------------------------------

    public function test_attachment_is_idempotent_and_records_order_meta(): void
    {
        $token = $this->storeToken();
        $order = $this->order(501, ["logo.png [kubikart-file:$token]", 'unrelated']);

        $this->assertSame([$token], kubikart_cf_attach_order($order));
        $this->assertSame([$token], kubikart_cf_attach_order($order));

        $meta = kubikart_cf_get($token)['meta'];
        $this->assertSame('attached', $meta['status']);
        $this->assertSame(501, $meta['order_id']);
        $this->assertSame([$token], $order->get_meta(KUBIKART_CUSTOMER_FILES_ORDER_META_KEY));
        $this->assertSame(1, $order->metaSaves);
    }

    public function test_file_attached_to_another_order_is_not_stolen(): void
    {
        $token = $this->storeToken();
        kubikart_cf_attach_order($this->order(10, ["a [kubikart-file:$token]"]));

        $intruder = $this->order(11, ["a [kubikart-file:$token]"]);

        $this->assertSame([], kubikart_cf_attach_order($intruder));
        $this->assertSame(10, kubikart_cf_get($token)['meta']['order_id']);
        $this->assertSame('', $intruder->get_meta(KUBIKART_CUSTOMER_FILES_ORDER_META_KEY));
    }

    public function test_unknown_tokens_and_unsaved_orders_are_ignored(): void
    {
        $unknown = str_repeat('b', 32);

        $this->assertSame([], kubikart_cf_attach_order($this->order(12, ["x [kubikart-file:$unknown]"])));
        $this->assertSame([], kubikart_cf_attach_order($this->order(0, ['x'])));
    }

    public function test_order_hooks_trigger_attachment(): void
    {
        foreach (['woocommerce_new_order', 'woocommerce_update_order'] as $hook) {
            $token = $this->storeToken();
            do_action($hook, 77, $this->order(77, ["a [kubikart-file:$token]"]));
            $this->assertSame(77, kubikart_cf_get($token)['meta']['order_id'], $hook);
        }

        $token = $this->storeToken();
        do_action('woocommerce_rest_insert_shop_order_object', $this->order(78, ["a [kubikart-file:$token]"]), null, true);
        $this->assertSame(78, kubikart_cf_get($token)['meta']['order_id']);
    }

    // -- enquiry attachment -----------------------------------------------------

    public function test_enquiry_files_are_kept_with_the_enquiry_and_attachment_is_idempotent(): void
    {
        $token = $this->storeToken();
        update_post_meta(300, KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY, json_encode([$token, 'not-a-token']));

        $this->assertSame([$token], kubikart_cf_attach_enquiry(300));
        $this->assertSame([$token], kubikart_cf_attach_enquiry(300));

        $meta = kubikart_cf_get($token)['meta'];
        $this->assertSame('attached', $meta['status']);
        $this->assertSame(300, $meta['enquiry_id']);
    }

    public function test_enquiry_cannot_take_a_file_that_belongs_to_an_order_or_another_enquiry(): void
    {
        $orderFile = $this->storeToken();
        kubikart_cf_attach_order($this->order(10, ["a [kubikart-file:$orderFile]"]));
        $enquiryFile = $this->storeToken();
        update_post_meta(301, KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY, json_encode([$enquiryFile]));
        kubikart_cf_attach_enquiry(301);

        update_post_meta(302, KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY, json_encode([$orderFile, $enquiryFile, str_repeat('c', 32)]));

        $this->assertSame([], kubikart_cf_attach_enquiry(302));
        $this->assertSame(10, kubikart_cf_get($orderFile)['meta']['order_id']);
        $this->assertSame(301, kubikart_cf_get($enquiryFile)['meta']['enquiry_id']);
    }

    public function test_a_file_kept_by_an_enquiry_cannot_be_claimed_by_an_order(): void
    {
        $token = $this->storeToken();
        update_post_meta(303, KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY, json_encode([$token]));
        kubikart_cf_attach_enquiry(303);

        $this->assertSame([], kubikart_cf_attach_order($this->order(20, ["a [kubikart-file:$token]"])));
    }

    public function test_only_a_newly_created_private_post_triggers_enquiry_attachment(): void
    {
        $created = $this->storeToken();
        $updated = $this->storeToken();
        $published = $this->storeToken();
        foreach ([310 => $created, 311 => $updated, 312 => $published] as $id => $token) {
            update_post_meta($id, KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY, json_encode([$token]));
        }

        do_action('rest_after_insert_post', new WP_Post(310, 'private'), null, true);
        do_action('rest_after_insert_post', new WP_Post(311, 'private'), null, false);
        do_action('rest_after_insert_post', new WP_Post(312, 'publish'), null, true);

        $this->assertSame('attached', kubikart_cf_get($created)['meta']['status']);
        $this->assertSame('pending', kubikart_cf_get($updated)['meta']['status']);
        $this->assertSame('pending', kubikart_cf_get($published)['meta']['status']);
    }

    public function test_enquiry_metabox_appears_only_with_files_and_lists_download_links(): void
    {
        $stored = kubikart_cf_store_upload($this->upload('Logo <b>.png', $this->png()));
        update_post_meta(320, KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY, json_encode([$stored['token']]));
        kubikart_cf_attach_enquiry(320);

        do_action('add_meta_boxes_post', new WP_Post(321));
        $this->assertArrayNotHasKey('kubikart_enquiry_files', $GLOBALS['_wp_meta_boxes']['post'] ?? []);
        do_action('add_meta_boxes_post', new WP_Post(320));
        $this->assertArrayHasKey('kubikart_enquiry_files', $GLOBALS['_wp_meta_boxes']['post']);

        ob_start();
        kubikart_cf_render_enquiry_metabox(new WP_Post(320));
        $html = ob_get_clean();
        $this->assertStringContainsString('token=' . $stored['token'], $html);
        $this->assertStringContainsString('Datei herunterladen', $html);
        $this->assertStringNotContainsString('<b>', $html);

        ob_start();
        kubikart_cf_render_enquiry_metabox(new WP_Post(321));
        $this->assertStringContainsString('Keine Kundendateien', ob_get_clean());
    }

    // -- display filter -----------------------------------------------------

    public function test_admin_sees_download_link_for_existing_file(): void
    {
        $token = $this->storeToken();
        $GLOBALS['_wp_mock_is_admin'] = true;

        $html = apply_filters('woocommerce_order_item_display_meta_value', "logo.png [kubikart-file:$token]", null, null);

        $this->assertStringStartsWith('logo.png <a ', $html);
        $this->assertStringContainsString('>Datei herunterladen</a>', $html);
        $this->assertStringContainsString('action=kubikart_download_customer_file', $html);
        $this->assertStringContainsString('token=' . $token, $html);
        $this->assertStringContainsString('_wpnonce=', $html);
    }

    public function test_non_admin_contexts_get_only_the_filename(): void
    {
        $token = $this->storeToken();
        $value = "logo.png [kubikart-file:$token]";

        // Frontend / REST / customer pages.
        $this->assertSame('logo.png', apply_filters('woocommerce_order_item_display_meta_value', $value, null, null));

        // Admin without the capability.
        $GLOBALS['_wp_mock_is_admin'] = true;
        $GLOBALS['_wp_mock_user_can'] = false;
        $this->assertSame('logo.png', apply_filters('woocommerce_order_item_display_meta_value', $value, null, null));

        // Email (re)sent from the admin screen.
        $GLOBALS['_wp_mock_user_can'] = true;
        do_action('woocommerce_email_header');
        $this->assertSame('logo.png', apply_filters('woocommerce_order_item_display_meta_value', $value, null, null));
        do_action('woocommerce_email_footer');
        $this->assertStringContainsString('Datei herunterladen', apply_filters('woocommerce_order_item_display_meta_value', $value, null, null));
    }

    public function test_missing_files_and_plain_values_are_handled(): void
    {
        $GLOBALS['_wp_mock_is_admin'] = true;
        $unknown = str_repeat('c', 32);

        $this->assertSame('logo.png', apply_filters('woocommerce_order_item_display_meta_value', "logo.png [kubikart-file:$unknown]", null, null));
        $this->assertSame('Gravur Text', apply_filters('woocommerce_order_item_display_meta_value', 'Gravur Text', null, null));
    }

    // -- download -----------------------------------------------------------

    public function test_download_requires_capability_nonce_and_known_token(): void
    {
        $token = $this->storeToken();

        $GLOBALS['_wp_mock_user_can'] = false;
        $this->assertSame(403, kubikart_cf_prepare_download($token, 'test-nonce')->get_error_data()['status']);
        $GLOBALS['_wp_mock_user_can'] = true;

        $this->assertSame('kubikart_files_bad_nonce', kubikart_cf_prepare_download($token, 'wrong')->get_error_code());
        $this->assertSame(404, kubikart_cf_prepare_download('../../etc/passwd', 'test-nonce')->get_error_data()['status']);
        $this->assertSame(404, kubikart_cf_prepare_download(str_repeat('d', 32), 'test-nonce')->get_error_data()['status']);
    }

    public function test_download_headers_use_detected_mime_and_force_attachment(): void
    {
        $stored = kubikart_cf_store_upload($this->upload("evil\r\nInjected: 1\".html", $this->pdf()));

        $prepared = kubikart_cf_prepare_download($stored['token'], 'test-nonce');

        $this->assertIsArray($prepared);
        $headers = $prepared['headers'];
        $this->assertSame('application/pdf', $headers['Content-Type']);
        $this->assertSame('nosniff', $headers['X-Content-Type-Options']);
        $this->assertSame('private, no-store', $headers['Cache-Control']);
        $this->assertSame((string) strlen($this->pdf()), $headers['Content-Length']);
        $this->assertStringStartsWith('attachment; filename="', $headers['Content-Disposition']);
        $this->assertStringEndsWith('.pdf"; filename*=UTF-8\'\'' . rawurlencode(kubikart_cf_download_filename(kubikart_cf_get($stored['token'])['meta'])), $headers['Content-Disposition']);
        foreach ($headers as $value) {
            $this->assertDoesNotMatchRegularExpression('/[\r\n]/', $value);
        }
        $this->assertSame(kubikart_cf_get($stored['token'])['path'], $prepared['path']);
    }

    public function test_download_of_a_deleted_file_is_not_found(): void
    {
        $token = $this->storeToken();
        unlink(kubikart_cf_get($token)['path']);

        $this->assertSame('kubikart_file_not_found', kubikart_cf_prepare_download($token, 'test-nonce')->get_error_code());
    }

    // -- REST ---------------------------------------------------------------

    public function test_routes_are_registered_in_the_woocommerce_namespace(): void
    {
        do_action('rest_api_init');

        $this->assertArrayHasKey('wc/v3/kubikart/customer-files', $GLOBALS['_wp_rest_routes']);
        $this->assertArrayHasKey('wc/v3/kubikart/customer-files/(?P<token>[a-f0-9]{32})', $GLOBALS['_wp_rest_routes']);
        $this->assertSame('POST', $GLOBALS['_wp_rest_routes']['wc/v3/kubikart/customer-files']['methods']);
        $this->assertSame('GET', $GLOBALS['_wp_rest_routes']['wc/v3/kubikart/customer-files/(?P<token>[a-f0-9]{32})']['methods']);
    }

    public function test_rest_permissions(): void
    {
        do_action('rest_api_init');
        foreach ($GLOBALS['_wp_rest_routes'] as $route) {
            $permission = $route['permission_callback'];

            $GLOBALS['_wp_mock_logged_in'] = false;
            $anonymous = $permission();
            $this->assertInstanceOf(WP_Error::class, $anonymous);
            $this->assertSame(401, $anonymous->get_error_data()['status']);

            $GLOBALS['_wp_mock_logged_in'] = true;
            $GLOBALS['_wp_mock_user_can'] = false;
            $customer = $permission();
            $this->assertInstanceOf(WP_Error::class, $customer);
            $this->assertSame(403, $customer->get_error_data()['status']);

            $GLOBALS['_wp_mock_user_can'] = true;
            $this->assertTrue($permission());
        }
    }

    public function test_rest_upload_returns_201_and_get_returns_status(): void
    {
        $path = $this->fixture('logo.png', $this->png());
        $request = $this->request(['field_id' => 'logo'], ['file' => ['name' => 'logo.png', 'tmp_name' => $path, 'error' => 0]]);

        $response = kubikart_cf_rest_upload($request);

        $this->assertInstanceOf(WP_REST_Response::class, $response);
        $this->assertSame(201, $response->get_status());
        $token = $response->get_data()['token'];
        $this->assertSame(['token' => $token, 'filename' => 'logo.png', 'mime' => 'image/png', 'size' => strlen($this->png())], $response->get_data());

        $get = kubikart_cf_rest_get($this->request(['token' => $token]));
        $this->assertSame(200, $get->get_status());
        $this->assertSame(
            ['token' => $token, 'filename' => 'logo.png', 'mime' => 'image/png', 'size' => strlen($this->png()), 'status' => 'pending', 'order_id' => 0],
            $get->get_data()
        );

        $missing = kubikart_cf_rest_get($this->request(['token' => str_repeat('e', 32)]));
        $this->assertSame('kubikart_file_not_found', $missing->get_error_code());
        $this->assertSame(404, $missing->get_error_data()['status']);
    }

    public function test_rest_upload_without_file_is_a_400(): void
    {
        $result = kubikart_cf_rest_upload($this->request([], []));

        $this->assertSame('kubikart_file_missing', $result->get_error_code());
        $this->assertSame(400, $result->get_error_data()['status']);
    }

    // -- metabox ------------------------------------------------------------

    public function test_metabox_is_registered_and_lists_files(): void
    {
        do_action('add_meta_boxes');
        $this->assertArrayHasKey('kubikart_customer_files', $GLOBALS['_wp_meta_boxes']['shop_order']);

        $stored = kubikart_cf_store_upload($this->upload('Logo <b>.png', $this->png()));
        $order = $this->order(90, ["logo [kubikart-file:{$stored['token']}]"]);

        ob_start();
        kubikart_cf_render_order_metabox($order);
        $html = ob_get_clean();

        $this->assertStringContainsString('Logo', $html);
        $this->assertStringNotContainsString('<b>', $html);
        $this->assertStringContainsString('token=' . $stored['token'], $html);
        $this->assertStringContainsString('Datei herunterladen', $html);

        ob_start();
        kubikart_cf_render_order_metabox($this->order(91, ['nothing']));
        $this->assertStringContainsString('Keine Kundendateien', ob_get_clean());
    }

    // -- cleanup ------------------------------------------------------------

    public function test_cleanup_deletes_only_stale_pending_files(): void
    {
        $stale = $this->storeToken();
        $fresh = $this->storeToken();
        $attached = $this->storeToken();
        kubikart_cf_attach_order($this->order(5, ["a [kubikart-file:$attached]"]));
        $this->backdate($stale, 8 * 86400);
        $this->backdate($attached, 30 * 86400);
        $this->backdate($fresh, 6 * 86400);
        $stalePath = kubikart_cf_get($stale)['path'];

        $dry = kubikart_cf_cleanup(true);
        $this->assertSame([$stale], $dry['deleted']);
        $this->assertFileExists($stalePath);

        $result = kubikart_cf_cleanup(false);
        $this->assertSame([$stale], $result['deleted']);
        $this->assertSame(3, $result['scanned']);
        $this->assertFileDoesNotExist($stalePath);
        $this->assertNull(kubikart_cf_get($stale));
        $this->assertNotNull(kubikart_cf_get($fresh));
        $this->assertNotNull(kubikart_cf_get($attached));
    }

    public function test_cleanup_without_storage_is_a_no_op_and_cron_is_scheduled(): void
    {
        $this->assertSame(['scanned' => 0, 'deleted' => []], kubikart_cf_cleanup());

        do_action('init');
        $this->assertNotFalse(wp_next_scheduled('kubikart_customer_files_cleanup'));
        $this->assertTrue(has_action('kubikart_customer_files_cleanup'));
    }

    // -- helpers ------------------------------------------------------------

    private function png(): string
    {
        return base64_decode(self::PNG_B64);
    }

    private function pdf(): string
    {
        return "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
    }

    private function webp(): string
    {
        $chunk = 'VP8 ' . pack('V', 10) . str_repeat("\0", 10);
        return 'RIFF' . pack('V', 4 + strlen($chunk)) . 'WEBP' . $chunk;
    }

    private function fixture(string $name, string $content): string
    {
        $path = $this->root . '/incoming/' . $name;
        file_put_contents($path, $content);
        return $path;
    }

    private function upload(string $name, string $content): array
    {
        return ['name' => $name, 'tmp_name' => $this->fixture('upload-' . uniqid('', true) . '.tmp', $content), 'error' => UPLOAD_ERR_OK];
    }

    private function storeToken(): string
    {
        return kubikart_cf_store_upload($this->upload('logo.png', $this->png()))['token'];
    }

    private function backdate(string $token, int $seconds): void
    {
        kubikart_cf_update_meta($token, function ($meta) use ($seconds) {
            $meta['created_ts'] = time() - $seconds;
            return $meta;
        });
    }

    private function request(array $params, array $files = []): WP_REST_Request
    {
        return new class ($params, $files) extends WP_REST_Request {
            public function __construct(private array $p, private array $f)
            {
                parent::__construct($p);
            }

            public function get_file_params(): array
            {
                return $this->f;
            }
        };
    }

    private function order(int $id, array $itemValues): object
    {
        return new class ($id, $itemValues) {
            public int $metaSaves = 0;
            private array $meta = [];

            public function __construct(private int $id, private array $values) {}

            public function get_id(): int { return $this->id; }

            public function get_items(): array
            {
                $metas = array_map(fn ($v) => new class ($v) {
                    public function __construct(private string $v) {}
                    public function get_data(): array { return ['key' => 'Logo', 'value' => $this->v]; }
                }, $this->values);

                return [new class ($metas) {
                    public function __construct(private array $metas) {}
                    public function get_meta_data(): array { return $this->metas; }
                }];
            }

            public function get_meta(string $key): mixed { return $this->meta[$key] ?? ''; }
            public function update_meta_data(string $key, mixed $value): void { $this->meta[$key] = $value; }
            public function save_meta_data(): void { $this->metaSaves++; }
        };
    }

    private function removeTree(string $path): void
    {
        if (!file_exists($path)) {
            return;
        }
        if (is_file($path) || is_link($path)) {
            unlink($path);
            return;
        }
        foreach (scandir($path) as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                $this->removeTree($path . '/' . $entry);
            }
        }
        rmdir($path);
    }
}
