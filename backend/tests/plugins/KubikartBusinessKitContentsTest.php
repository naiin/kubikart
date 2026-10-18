<?php

use PHPUnit\Framework\TestCase;

class KubikartKitFakeProduct
{
    public function __construct(
        private int $id,
        private string $name,
        private string $slug,
        private string $status = 'publish',
        private string $visibility = 'visible',
        private int $image_id = 0,
        private int $parent_id = 0,
        private string $stock_status = 'instock'
    ) {}

    public function get_id(): int { return $this->id; }
    public function get_name(): string { return $this->name; }
    public function get_slug(): string { return $this->slug; }
    public function get_status(): string { return $this->status; }
    public function get_catalog_visibility(): string { return $this->visibility; }
    public function get_image_id(): int { return $this->image_id; }
    public function get_parent_id(): int { return $this->parent_id; }
    public function get_stock_status(): string { return $this->stock_status; }
    public function get_price(): string { return (string) ($GLOBALS['_wp_post_meta'][$this->id]['_price'] ?? ''); }
}

class KubikartBusinessKitContentsTest extends TestCase
{
    private const KIT = 100;

    protected function setUp(): void
    {
        wp_reset_mocks();
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-business-kit-contents.php';
        $_POST = [];
        $GLOBALS['_wp_fake_products'] = [];
        $GLOBALS['_wp_mock_wc_get_product'] = static fn ($id) => $GLOBALS['_wp_fake_products'][$id] ?? false;
        $this->seedKit(self::KIT);
    }

    protected function tearDown(): void
    {
        $_POST = [];
        wp_reset_mocks();
    }

    // -- validation ------------------------------------------------------

    public function test_valid_rows_keep_submitted_order_and_get_stable_ids(): void
    {
        $this->seedProduct(71, 'QR Stand');
        $this->seedProduct(72, 'Sticker');

        $result = kubikart_kit_sanitize_contents_payload([
            ['product_id' => '72', 'quantity' => '2', 'title' => '', 'description' => "Line 1\r\nLine 2"],
            ['id' => 'abcdef12-3456-7890', 'title' => 'Design work', 'quantity' => '1'],
            ['product_id' => '71', 'quantity' => '1'],
        ], 'purchase', self::KIT);

        $this->assertTrue($result['valid'], implode('; ', $result['errors']));
        $this->assertSame('purchase', $result['order_mode']);
        $this->assertSame(1, $result['payload']['schema_version']);
        $items = $result['payload']['items'];
        $this->assertSame([72, 0, 71], array_column($items, 'product_id'));
        $this->assertSame("Line 1\nLine 2", $items[0]['description']);
        $this->assertSame('abcdef12-3456-7890', $items[1]['id']);
        $this->assertCount(3, array_unique(array_column($items, 'id')));
        foreach ($items as $item) {
            $this->assertNotSame('', $item['id']);
        }
    }

    public function test_icon_is_limited_to_the_known_symbols_and_exposed(): void
    {
        $result = kubikart_kit_sanitize_contents_payload([
            ['title' => 'Aufsteller', 'quantity' => '1', 'icon' => 'stand'],
            ['title' => 'Unbekannt', 'quantity' => '1', 'icon' => 'rocket<script>'],
            ['title' => 'Ohne', 'quantity' => '1'],
        ], 'purchase', self::KIT);

        $this->assertTrue($result['valid'], implode('; ', $result['errors']));
        $this->assertSame(['stand', '', ''], array_column($result['payload']['items'], 'icon'));

        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_contents'] = $result['payload'];
        $items = $this->kitEntry()['value']['items'];
        $this->assertSame(['stand', '', ''], array_column($items, 'icon'));
    }

    /** @dataProvider invalidQuantities */
    public function test_quantity_must_be_an_integer_between_1_and_999(string $quantity): void
    {
        $this->seedProduct(71, 'QR Stand');
        $result = kubikart_kit_sanitize_contents_payload([['product_id' => '71', 'quantity' => $quantity]], '', self::KIT);
        $this->assertFalse($result['valid']);
    }

    public static function invalidQuantities(): array
    {
        return [['0'], ['-1'], ['1000'], ['1.5'], ['abc'], ['']];
    }

    public function test_quantity_bounds_are_accepted(): void
    {
        $this->seedProduct(71, 'QR Stand');
        foreach (['1', '999'] as $quantity) {
            $result = kubikart_kit_sanitize_contents_payload([['product_id' => '71', 'quantity' => $quantity]], '', self::KIT);
            $this->assertTrue($result['valid']);
        }
    }

    public function test_row_needs_a_product_or_a_title(): void
    {
        $result = kubikart_kit_sanitize_contents_payload([['description' => 'only text', 'quantity' => '1']], '', self::KIT);
        $this->assertFalse($result['valid']);
    }

    public function test_untouched_rows_are_skipped_silently(): void
    {
        $result = kubikart_kit_sanitize_contents_payload([
            ['product_id' => '', 'quantity' => '1', 'title' => '', 'description' => '', 'image_id' => ''],
            ['title' => 'Real', 'quantity' => '1'],
        ], '', self::KIT);

        $this->assertTrue($result['valid']);
        $this->assertCount(1, $result['payload']['items']);
    }

    public function test_linked_product_must_be_an_existing_product_post(): void
    {
        $GLOBALS['_wp_posts'][55] = (object) ['ID' => 55, 'post_type' => 'page', 'post_status' => 'publish'];
        foreach (['999', '55'] as $id) {
            $result = kubikart_kit_sanitize_contents_payload([['product_id' => $id, 'quantity' => '1']], '', self::KIT);
            $this->assertFalse($result['valid'], $id);
        }
    }

    public function test_variation_must_belong_to_the_selected_product(): void
    {
        $this->seedProduct(71, 'Stand');
        $this->seedProduct(72, 'Other');
        $this->seedVariation(711, 71);

        $ok = kubikart_kit_sanitize_contents_payload([['product_id' => '71', 'variation_id' => '711', 'quantity' => '1']], '', self::KIT);
        $this->assertTrue($ok['valid']);
        $this->assertSame(711, $ok['payload']['items'][0]['variation_id']);

        $bad = kubikart_kit_sanitize_contents_payload([['product_id' => '72', 'variation_id' => '711', 'quantity' => '1']], '', self::KIT);
        $this->assertFalse($bad['valid']);

        $not_a_variation = kubikart_kit_sanitize_contents_payload([['product_id' => '71', 'variation_id' => '72', 'quantity' => '1']], '', self::KIT);
        $this->assertFalse($not_a_variation['valid']);
    }

    public function test_variation_id_from_product_search_is_split_into_parent_and_variation(): void
    {
        $this->seedProduct(71, 'Stand');
        $this->seedVariation(711, 71);

        $result = kubikart_kit_sanitize_contents_payload([['product_id' => '711', 'quantity' => '1']], '', self::KIT);

        $this->assertTrue($result['valid']);
        $this->assertSame(71, $result['payload']['items'][0]['product_id']);
        $this->assertSame(711, $result['payload']['items'][0]['variation_id']);
    }

    public function test_image_must_be_an_image_attachment(): void
    {
        $GLOBALS['_wp_attachments'][12] = ['is_image' => true, 'url' => 'https://test.local/a.jpg'];
        $GLOBALS['_wp_attachments'][13] = ['is_image' => false, 'url' => 'https://test.local/a.pdf'];

        $this->assertTrue(kubikart_kit_sanitize_contents_payload([['title' => 'A', 'quantity' => '1', 'image_id' => '12']], '', self::KIT)['valid']);
        $this->assertFalse(kubikart_kit_sanitize_contents_payload([['title' => 'A', 'quantity' => '1', 'image_id' => '13']], '', self::KIT)['valid']);
        $this->assertFalse(kubikart_kit_sanitize_contents_payload([['title' => 'A', 'quantity' => '1', 'image_id' => '99']], '', self::KIT)['valid']);
    }

    public function test_text_length_limits_and_markup_stripping(): void
    {
        $long_title = str_repeat('a', 121);
        $long_description = str_repeat('b', 501);
        $this->assertFalse(kubikart_kit_sanitize_contents_payload([['title' => $long_title, 'quantity' => '1']], '', self::KIT)['valid']);
        $this->assertFalse(kubikart_kit_sanitize_contents_payload([['title' => 'ok', 'description' => $long_description, 'quantity' => '1']], '', self::KIT)['valid']);

        $result = kubikart_kit_sanitize_contents_payload([['title' => '<b>Bold</b> title', 'description' => '<script>x</script>Text', 'quantity' => '1']], '', self::KIT);
        $this->assertTrue($result['valid']);
        $this->assertStringNotContainsString('<', $result['payload']['items'][0]['title']);
        $this->assertStringNotContainsString('<', $result['payload']['items'][0]['description']);
    }

    public function test_maximum_of_30_items(): void
    {
        $rows = array_fill(0, 30, ['title' => 'Item', 'quantity' => '1']);
        $this->assertTrue(kubikart_kit_sanitize_contents_payload($rows, '', self::KIT)['valid']);

        $rows[] = ['title' => 'One too many', 'quantity' => '1'];
        $this->assertFalse(kubikart_kit_sanitize_contents_payload($rows, '', self::KIT)['valid']);
    }

    public function test_order_mode_must_be_allowed(): void
    {
        foreach (['', 'purchase', 'enquiry'] as $mode) {
            $this->assertTrue(kubikart_kit_sanitize_contents_payload([], $mode, self::KIT)['valid'], $mode);
        }
        $this->assertFalse(kubikart_kit_sanitize_contents_payload([], 'buy-now', self::KIT)['valid']);
        $this->assertFalse(kubikart_kit_sanitize_contents_payload([], ['purchase'], self::KIT)['valid']);
    }

    public function test_kit_cannot_contain_itself(): void
    {
        $this->seedProduct(self::KIT, 'Kit');
        $result = kubikart_kit_sanitize_contents_payload([['product_id' => (string) self::KIT, 'quantity' => '1']], '', self::KIT);
        $this->assertFalse($result['valid']);
    }

    // -- save handler ----------------------------------------------------

    public function test_rejected_save_keeps_existing_meta_and_stores_errors(): void
    {
        $existing = ['schema_version' => 1, 'items' => [['id' => 'keep-me-12345', 'product_id' => 0, 'variation_id' => 0, 'quantity' => 1, 'title' => 'Old', 'description' => '', 'image_id' => 0]]];
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_contents'] = $existing;
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_order_mode'] = 'purchase';
        $this->postSave(['order_mode' => 'enquiry', 'items' => [['title' => 'New', 'quantity' => '0']]]);

        kubikart_kit_handle_save(self::KIT);

        $this->assertSame($existing, $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_contents']);
        $this->assertSame('purchase', $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_order_mode']);
        $this->assertNotEmpty(get_transient('kubikart_kit_contents_error_' . self::KIT));
    }

    public function test_valid_save_persists_contents_and_mode_in_submitted_order(): void
    {
        $this->postSave(['order_mode' => 'purchase', 'items' => [
            ['title' => 'Second?', 'quantity' => '3'],
            ['title' => 'First?', 'quantity' => '1'],
        ]]);

        kubikart_kit_handle_save(self::KIT);

        $meta = $GLOBALS['_wp_post_meta'][self::KIT];
        $this->assertSame('purchase', $meta['_kubikart_kit_order_mode']);
        $this->assertSame(['Second?', 'First?'], array_column($meta['_kubikart_kit_contents']['items'], 'title'));
        $this->assertSame(3, $meta['_kubikart_kit_contents']['items'][0]['quantity']);
    }

    public function test_unset_mode_deletes_the_meta(): void
    {
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_order_mode'] = 'purchase';
        $this->postSave(['order_mode' => '', 'items' => []]);

        kubikart_kit_handle_save(self::KIT);

        $this->assertArrayNotHasKey('_kubikart_kit_order_mode', $GLOBALS['_wp_post_meta'][self::KIT]);
    }

    public function test_save_requires_nonce_capability_and_ignores_autosave_and_non_kits(): void
    {
        $this->postSave(['order_mode' => 'purchase', 'items' => []]);

        $_POST['kubikart_kit_contents_nonce'] = 'bad';
        kubikart_kit_handle_save(self::KIT);
        $this->assertArrayNotHasKey(self::KIT, $GLOBALS['_wp_post_meta']);

        $_POST['kubikart_kit_contents_nonce'] = 'test-nonce';
        $GLOBALS['_wp_mock_user_can'] = false;
        kubikart_kit_handle_save(self::KIT);
        $this->assertArrayNotHasKey(self::KIT, $GLOBALS['_wp_post_meta']);
        $GLOBALS['_wp_mock_user_can'] = true;

        $this->seedKit(200, null);
        kubikart_kit_handle_save(200);
        $this->assertArrayNotHasKey(200, $GLOBALS['_wp_post_meta']);
        $this->assertFalse(get_transient('kubikart_kit_contents_error_200'));
    }

    public function test_polylang_translation_replaces_foreign_language_product_with_notice(): void
    {
        $this->seedProduct(71, 'Stand EN');
        $this->seedProduct(81, 'Stand DE');
        $GLOBALS['_wp_post_languages'] = [self::KIT => 'de', 71 => 'en', 81 => 'de'];
        $GLOBALS['_wp_post_translations'][71]['de'] = 81;
        $this->postSave(['order_mode' => '', 'items' => [['product_id' => '71', 'quantity' => '1']]]);

        kubikart_kit_handle_save(self::KIT);

        $this->assertSame(81, $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_contents']['items'][0]['product_id']);
        $this->assertNotEmpty(get_transient('kubikart_kit_contents_warning_' . self::KIT));
    }

    public function test_polylang_untranslated_foreign_product_warns_but_saves(): void
    {
        $this->seedProduct(71, 'Stand EN');
        $GLOBALS['_wp_post_languages'] = [self::KIT => 'de', 71 => 'en'];
        $this->postSave(['order_mode' => '', 'items' => [['product_id' => '71', 'quantity' => '1']]]);

        kubikart_kit_handle_save(self::KIT);

        $this->assertSame(71, $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_contents']['items'][0]['product_id']);
        $this->assertNotEmpty(get_transient('kubikart_kit_contents_warning_' . self::KIT));
    }

    // -- REST ------------------------------------------------------------

    public function test_non_kit_products_get_no_rest_entry(): void
    {
        $this->seedProduct(300, 'Plain product');
        $GLOBALS['_wp_post_meta'][300]['_kubikart_kit_contents'] = ['schema_version' => 1, 'items' => [['id' => 'x', 'title' => 'T', 'quantity' => 1]]];

        $response = $this->rest(300, ['meta_data' => []]);

        $this->assertSame([], $response->get_data()['meta_data']);
    }

    public function test_unset_mode_without_items_is_enquiry_and_needs_contents(): void
    {
        $entry = $this->kitEntry();

        $this->assertSame(1, $entry['value']['schema_version']);
        $this->assertTrue($entry['value']['is_business_kit']);
        $this->assertSame('enquiry', $entry['value']['order_mode']);
        $this->assertFalse($entry['value']['order_mode_explicit']);
        $this->assertTrue($entry['value']['needs_contents']);
        $this->assertSame([], $entry['value']['items']);
        $this->assertSame(0, $entry['value']['skipped_items']);
        $this->assertSame(0, $entry['id']);
    }

    public function test_optional_upgrade_operations_are_validated_and_exposed(): void
    {
        $this->seedProduct(71, 'QR Stand');
        $this->seedProduct(72, 'Acrylic Stand');
        $this->seedProduct(73, 'Frosted film');

        $result = kubikart_kit_sanitize_contents_payload([
            ['product_id' => '71', 'quantity' => '1', 'kind' => 'included', 'operation' => 'replace', 'replaces_product_id' => '99'],
            ['product_id' => '72', 'quantity' => '1', 'kind' => 'optional', 'operation' => 'replace', 'replaces_product_id' => '71'],
            ['product_id' => '73', 'quantity' => '1', 'kind' => 'optional', 'operation' => 'quote_dependent'],
        ], 'enquiry', self::KIT);

        $this->assertTrue($result['valid'], implode('; ', $result['errors']));
        $items = $result['payload']['items'];
        $this->assertSame(['included', 'optional', 'optional'], array_column($items, 'kind'));
        // A base item never carries an upgrade operation.
        $this->assertSame(['', 'replace', 'quote_dependent'], array_column($items, 'operation'));
        $this->assertSame([0, 71, 0], array_column($items, 'replaces_product_id'));

        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_contents'] = $result['payload'];
        $exposed = $this->kitEntry()['value']['items'];
        $this->assertSame('optional', $exposed[1]['kind']);
        $this->assertSame('replace', $exposed[1]['operation']);
        $this->assertSame(71, $exposed[1]['replaces']['id']);
        $this->assertNull($exposed[0]['replaces']);
    }

    public function test_replace_operation_needs_a_replaced_product_from_the_base_package(): void
    {
        $this->seedProduct(71, 'QR Stand');
        $this->seedProduct(72, 'Acrylic Stand');
        $this->seedProduct(74, 'Other');

        $missing = kubikart_kit_sanitize_contents_payload([
            ['product_id' => '71', 'quantity' => '1', 'kind' => 'included'],
            ['product_id' => '72', 'quantity' => '1', 'kind' => 'optional', 'operation' => 'replace'],
        ], 'enquiry', self::KIT);
        $this->assertFalse($missing['valid']);

        $outside = kubikart_kit_sanitize_contents_payload([
            ['product_id' => '71', 'quantity' => '1', 'kind' => 'included'],
            ['product_id' => '72', 'quantity' => '1', 'kind' => 'optional', 'operation' => 'replace', 'replaces_product_id' => '74'],
        ], 'enquiry', self::KIT);
        $this->assertFalse($outside['valid']);
    }

    public function test_seo_title_and_description_are_exposed_as_plain_text(): void
    {
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_seo_title'] = 'Barber-Paket | KubiKart';
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_seo_description'] = 'Öffnungszeiten, Aufsteller und Menüs.';

        $this->assertSame(
            ['title' => 'Barber-Paket | KubiKart', 'description' => 'Öffnungszeiten, Aufsteller und Menüs.'],
            $this->kitEntry()['value']['seo']
        );
    }

    public function test_seo_defaults_to_empty(): void
    {
        $this->assertSame(['title' => '', 'description' => ''], $this->kitEntry()['value']['seo']);
    }

    public function test_scope_summary_is_exposed_as_plain_text(): void
    {
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_scope_summary'] = 'Mit vorhandenem Logo · ohne Montage';

        $this->assertSame('Mit vorhandenem Logo · ohne Montage', $this->kitEntry()['value']['scope_summary']);
    }

    public function test_scope_summary_defaults_to_empty(): void
    {
        $this->assertSame('', $this->kitEntry()['value']['scope_summary']);
    }

    public function test_explicit_purchase_mode_is_exposed_and_existing_entry_replaced(): void
    {
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_order_mode'] = 'purchase';

        $entry = $this->kitEntry([['id' => 5, 'key' => '_kubikart_kit', 'value' => 'stale'], ['id' => 6, 'key' => 'other', 'value' => 'x']]);
        $meta = $this->rest(self::KIT, ['meta_data' => [['id' => 5, 'key' => '_kubikart_kit', 'value' => 'stale']]])->get_data()['meta_data'];

        $this->assertSame('purchase', $entry['value']['order_mode']);
        $this->assertTrue($entry['value']['order_mode_explicit']);
        $this->assertCount(1, $meta);
    }

    public function test_linked_unlinked_and_item_images_resolve_in_order(): void
    {
        $this->seedProduct(71, 'QR &amp; Stand', 'qr-stand', image_id: 20);
        $GLOBALS['_wp_attachments'][20] = ['is_image' => true, 'url' => 'https://test.local/stand.jpg'];
        $GLOBALS['_wp_attachments'][12] = ['is_image' => true, 'url' => 'https://test.local/own.jpg'];
        $GLOBALS['_wp_post_meta'][12]['_wp_attachment_image_alt'] = 'Own alt';
        $this->seedItems([
            $this->item('a', product_id: 71, quantity: 2),
            $this->item('b', title: 'Design <b>work</b>', description: "Line1\nLine2", image_id: 12),
        ]);

        $items = $this->kitEntry()['value']['items'];

        $this->assertSame(['a', 'b'], array_column($items, 'id'));
        $this->assertSame('linked', $items[0]['link_state']);
        $this->assertSame(2, $items[0]['quantity']);
        $this->assertSame(
            ['id' => 71, 'variation_id' => 0, 'name' => 'QR & Stand', 'slug' => 'qr-stand', 'image' => ['src' => 'https://test.local/stand.jpg', 'alt' => 'QR & Stand']],
            $items[0]['product']
        );
        $this->assertNull($items[0]['image']);
        $this->assertSame('unlinked', $items[1]['link_state']);
        $this->assertNull($items[1]['product']);
        $this->assertSame('Design work', $items[1]['title']);
        $this->assertSame("Line1\nLine2", $items[1]['description']);
        $this->assertSame(['id' => 12, 'src' => 'https://test.local/own.jpg', 'alt' => 'Own alt'], $items[1]['image']);
        $this->assertFalse($this->kitEntry()['value']['needs_contents']);
    }

    public function test_unavailable_products_are_marked_and_need_a_title_to_be_displayed(): void
    {
        $this->seedProduct(72, 'Draft', 'draft', status: 'draft');
        $this->seedProduct(73, 'Hidden', 'hidden', visibility: 'hidden');
        $this->seedProduct(74, 'Trashed', 'trashed', status: 'trash');
        $GLOBALS['_wp_posts'][75] = (object) ['ID' => 75, 'post_type' => 'page', 'post_status' => 'publish'];
        $this->seedItems([
            $this->item('draft', product_id: 72, title: 'Draft title'),
            $this->item('hidden', product_id: 73, title: 'Hidden title'),
            $this->item('trash', product_id: 74, title: 'Trash title'),
            $this->item('deleted', product_id: 999, title: 'Deleted title'),
            $this->item('page', product_id: 75, title: 'Page title'),
            $this->item('nameless', product_id: 999),
            $this->item('draft-nameless', product_id: 72),
        ]);

        $value = $this->kitEntry()['value'];

        $this->assertSame(array_fill(0, 5, 'unavailable'), array_column($value['items'], 'link_state'));
        $this->assertSame(array_fill(0, 5, null), array_column($value['items'], 'product'));
        $this->assertSame(2, $value['skipped_items']);
        $this->assertFalse($value['needs_contents']);
    }

    public function test_all_items_skipped_means_contents_are_still_needed(): void
    {
        $this->seedItems([$this->item('gone', product_id: 999)]);

        $value = $this->kitEntry()['value'];

        $this->assertTrue($value['needs_contents']);
        $this->assertSame(1, $value['skipped_items']);
    }

    public function test_out_of_stock_linked_product_stays_linked(): void
    {
        $this->seedProduct(71, 'Sold out', 'sold-out', stock_status: 'outofstock');
        $this->seedItems([$this->item('a', product_id: 71)]);

        $items = $this->kitEntry()['value']['items'];

        $this->assertSame('linked', $items[0]['link_state']);
    }

    public function test_variation_links_with_parent_slug_and_falls_back_to_parent_image(): void
    {
        $this->seedProduct(71, 'Stand', 'stand', image_id: 20);
        $this->seedVariation(711, 71, 'Stand - Red');
        $GLOBALS['_wp_attachments'][20] = ['is_image' => true, 'url' => 'https://test.local/stand.jpg'];
        $this->seedItems([$this->item('a', product_id: 71, variation_id: 711)]);

        $product = $this->kitEntry()['value']['items'][0]['product'];

        $this->assertSame(711, $product['variation_id']);
        $this->assertSame('stand', $product['slug']);
        $this->assertSame('Stand - Red', $product['name']);
        $this->assertSame('https://test.local/stand.jpg', $product['image']['src']);
    }

    public function test_disabled_variation_is_unavailable(): void
    {
        $this->seedProduct(71, 'Stand', 'stand');
        $this->seedVariation(711, 71, 'Stand - Red', 'private');
        $this->seedItems([$this->item('a', product_id: 71, variation_id: 711, title: 'Stand')]);

        $this->assertSame('unavailable', $this->kitEntry()['value']['items'][0]['link_state']);
    }

    public function test_foreign_language_product_resolves_to_translation_or_language_mismatch(): void
    {
        $this->seedProduct(71, 'Stand EN', 'stand-en');
        $this->seedProduct(81, 'Stand DE', 'stand-de');
        $this->seedProduct(72, 'Sticker EN', 'sticker-en');
        $GLOBALS['_wp_post_languages'] = [self::KIT => 'de', 71 => 'en', 81 => 'de', 72 => 'en'];
        $GLOBALS['_wp_post_translations'][71]['de'] = 81;
        $this->seedItems([
            $this->item('a', product_id: 71),
            $this->item('b', product_id: 72, title: 'Sticker'),
        ]);

        $items = $this->kitEntry()['value']['items'];

        $this->assertSame('linked', $items[0]['link_state']);
        $this->assertSame(81, $items[0]['product']['id']);
        $this->assertSame('stand-de', $items[0]['product']['slug']);
        $this->assertSame('language_mismatch', $items[1]['link_state']);
        $this->assertNull($items[1]['product']);
    }

    public function test_language_check_is_skipped_without_polylang_language_for_kit(): void
    {
        $this->seedProduct(71, 'Stand EN', 'stand-en');
        $GLOBALS['_wp_post_languages'] = [71 => 'en'];
        $this->seedItems([$this->item('a', product_id: 71)]);

        $this->assertSame('linked', $this->kitEntry()['value']['items'][0]['link_state']);
    }

    public function test_variation_of_translated_parent_maps_or_drops_variation(): void
    {
        $this->seedProduct(71, 'Stand EN', 'stand-en');
        $this->seedVariation(711, 71, 'Stand EN - Red');
        $this->seedProduct(81, 'Stand DE', 'stand-de');
        $this->seedVariation(811, 81, 'Stand DE - Rot');
        $this->seedVariation(712, 71, 'Stand EN - Blue');
        $GLOBALS['_wp_post_languages'] = [self::KIT => 'de', 71 => 'en', 81 => 'de'];
        $GLOBALS['_wp_post_translations'][71]['de'] = 81;
        $GLOBALS['_wp_post_translations'][711]['de'] = 811;
        $this->seedItems([
            $this->item('mapped', product_id: 71, variation_id: 711),
            $this->item('unmapped', product_id: 71, variation_id: 712),
        ]);

        $items = $this->kitEntry()['value']['items'];

        $this->assertSame([81, 811], [$items[0]['product']['id'], $items[0]['product']['variation_id']]);
        $this->assertSame([81, 0], [$items[1]['product']['id'], $items[1]['product']['variation_id']]);
    }

    public function test_reorder_is_preserved_through_save_and_rest(): void
    {
        $this->seedProduct(71, 'A', 'a');
        $this->seedProduct(72, 'B', 'b');
        $this->seedProduct(73, 'C', 'c');
        $this->postSave(['order_mode' => '', 'items' => [
            ['product_id' => '73', 'quantity' => '1'],
            ['product_id' => '71', 'quantity' => '1'],
            ['product_id' => '72', 'quantity' => '1'],
        ]]);

        kubikart_kit_handle_save(self::KIT);

        $slugs = array_map(fn ($item) => $item['product']['slug'], $this->kitEntry()['value']['items']);
        $this->assertSame(['c', 'a', 'b'], $slugs);
    }

    public function test_rest_output_contains_no_markup(): void
    {
        $this->seedItems([$this->item('a', title: '&lt;script&gt;alert(1)&lt;/script&gt;', description: '<img src=x onerror=1>Text')]);

        $item = $this->kitEntry()['value']['items'][0];

        $this->assertStringNotContainsString('<', $item['title']);
        $this->assertStringNotContainsString('<', $item['description']);
    }

    // -- admin -----------------------------------------------------------

    public function test_metabox_shows_hint_for_non_kits_and_controls_for_kits(): void
    {
        $this->seedKit(200, null);
        ob_start();
        kubikart_kit_render_metabox((object) ['ID' => 200]);
        $hint = ob_get_clean();
        $this->assertStringContainsString('Weise zuerst die Kategorie Business-Pakete zu', $hint);
        $this->assertStringNotContainsString('kubikart_kit_order_mode', $hint);

        ob_start();
        kubikart_kit_render_metabox((object) ['ID' => self::KIT]);
        $html = ob_get_clean();
        $this->assertStringContainsString('Paketinhalt fehlt', $html);
        $this->assertStringContainsString('name="kubikart_kit_order_mode"', $html);
        $this->assertStringContainsString('wc-product-search', $html);
        $this->assertStringContainsString('woocommerce_json_search_products_and_variations', $html);
        $this->assertStringContainsString('kubikart_kit_contents_nonce', $html);
        $this->assertStringContainsString('aria-label="Eintrag nach oben verschieben"', $html);
        $this->assertStringContainsString('+ Eintrag hinzufügen', $html);
    }

    public function test_metabox_warns_for_purchase_without_price_or_fields(): void
    {
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_order_mode'] = 'purchase';

        ob_start();
        kubikart_kit_render_metabox((object) ['ID' => self::KIT]);
        $html = ob_get_clean();

        $this->assertStringContainsString('keinen Preis', $html);
        $this->assertStringContainsString('keine Personalisierungsfelder', $html);
    }

    public function test_list_column_values(): void
    {
        $this->seedKit(200, null);
        $render = function (int $id): string {
            ob_start();
            do_action('manage_product_posts_custom_column', 'kubikart_kit_contents', $id);
            return ob_get_clean();
        };

        $this->assertSame('–', $render(200));
        $this->assertStringContainsString('Fehlt', $render(self::KIT));

        $this->seedItems([$this->item('a', title: 'One'), $this->item('b', title: 'Two')]);
        $this->assertStringContainsString('2 Einträge', $render(self::KIT));
    }

    // -- helpers ---------------------------------------------------------

    private function seedKit(int $id, ?string $category = 'business-kits-de'): void
    {
        $GLOBALS['_wp_posts'][$id] = (object) ['ID' => $id, 'post_type' => 'product', 'post_status' => 'publish', 'post_title' => 'Kit ' . $id, 'post_parent' => 0];
        $GLOBALS['_wp_product_terms'][$id]['product_cat'] = $category ? [$category] : [];
    }

    private function seedProduct(
        int $id,
        string $name,
        string $slug = '',
        string $status = 'publish',
        string $visibility = 'visible',
        int $image_id = 0,
        string $stock_status = 'instock'
    ): void {
        $GLOBALS['_wp_posts'][$id] = (object) ['ID' => $id, 'post_type' => 'product', 'post_status' => $status, 'post_title' => $name, 'post_parent' => 0];
        $GLOBALS['_wp_fake_products'][$id] = new KubikartKitFakeProduct($id, $name, $slug ?: 'product-' . $id, $status, $visibility, $image_id, 0, $stock_status);
    }

    private function seedVariation(int $id, int $parent, string $name = 'Variation', string $status = 'publish'): void
    {
        $GLOBALS['_wp_posts'][$id] = (object) ['ID' => $id, 'post_type' => 'product_variation', 'post_status' => $status, 'post_title' => $name, 'post_parent' => $parent];
        $GLOBALS['_wp_fake_products'][$id] = new KubikartKitFakeProduct($id, $name, 'variation-' . $id, $status, 'visible', 0, $parent);
    }

    private function item(
        string $id,
        int $product_id = 0,
        int $variation_id = 0,
        int $quantity = 1,
        string $title = '',
        string $description = '',
        int $image_id = 0
    ): array {
        return compact('id', 'product_id', 'variation_id', 'quantity', 'title', 'description', 'image_id');
    }

    private function seedItems(array $items): void
    {
        $GLOBALS['_wp_post_meta'][self::KIT]['_kubikart_kit_contents'] = ['schema_version' => 1, 'items' => $items];
    }

    private function postSave(array $data): void
    {
        $_POST = [
            'kubikart_kit_contents_nonce' => 'test-nonce',
            'kubikart_kit_order_mode' => $data['order_mode'],
            'kubikart_kit_items' => $data['items'],
        ];
    }

    private function rest(int $product_id, array $data): WP_REST_Response
    {
        $product = new KubikartKitFakeProduct($product_id, 'x', 'x');
        return apply_filters('woocommerce_rest_prepare_product_object', new WP_REST_Response($data), $product);
    }

    private function kitEntry(array $existing = []): array
    {
        $entries = $this->rest(self::KIT, ['meta_data' => $existing])->get_data()['meta_data'];
        $kit = array_values(array_filter($entries, fn ($entry) => $entry['key'] === '_kubikart_kit'));
        $this->assertCount(1, $kit);
        return $kit[0];
    }
}
