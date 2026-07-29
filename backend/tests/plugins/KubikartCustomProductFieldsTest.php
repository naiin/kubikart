<?php

use PHPUnit\Framework\TestCase;

class KubikartCustomProductFieldsTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-custom-product-fields.php';
    }

    public function test_legacy_list_remains_recoverable_without_type_inference(): void
    {
        $legacy = [
            ['id' => 'engraving_text', 'label' => 'Engraving text', 'type' => 'text'],
            ['id' => 'unknown', 'label' => 'Owner review'],
        ];

        $normalized = kubikart_normalize_custom_fields_payload($legacy);

        $this->assertSame(1, $normalized['schema_version']);
        $this->assertSame($legacy, $normalized['raw']);
        $this->assertSame($legacy, $normalized['fields']);
        $this->assertTrue($normalized['requires_review']);
        $this->assertArrayNotHasKey('type', $normalized['fields'][1]);
    }

    public function test_each_canonical_type_survives_save_and_reload(): void
    {
        $submitted = $this->completeSubmittedFields();
        $result = kubikart_sanitize_custom_fields_payload($submitted);
        $reloaded = kubikart_normalize_custom_fields_payload($result['payload']);

        $this->assertTrue($result['valid']);
        $this->assertSame(2, $result['payload']['schema_version']);
        $this->assertSame(
            ['text', 'textarea', 'select', 'checkbox'],
            array_column($reloaded['fields'], 'type')
        );
        $this->assertTrue($reloaded['fields'][0]['required']);
        $this->assertSame('e.g. M & T', $reloaded['fields'][0]['placeholder']);
        $this->assertSame(20, $reloaded['fields'][0]['maxLength']);
        $this->assertSame('', $reloaded['fields'][0]['helperText']);
        $this->assertSame('classic', $reloaded['fields'][2]['defaultValue']);
        $this->assertCount(3, $reloaded['fields'][2]['options']);
        $this->assertSame(2.5, $reloaded['fields'][3]['price']);
    }

    public function test_sanitization_removes_properties_irrelevant_to_selected_type(): void
    {
        $submitted = $this->completeSubmittedFields();
        foreach ($submitted as &$field) {
            $field['placeholder'] = $field['placeholder'] ?? 'stale placeholder';
            $field['maxLength'] = $field['maxLength'] ?? '99';
            $field['options'] = $field['options'] ?? "stale|Stale";
            $field['defaultValue'] = $field['defaultValue'] ?? 'stale';
            $field['price'] = $field['price'] ?? '9.99';
        }

        $fields = kubikart_sanitize_custom_fields_payload($submitted)['payload']['fields'];

        $this->assertArrayNotHasKey('options', $fields[0]);
        $this->assertArrayNotHasKey('price', $fields[0]);
        $this->assertArrayNotHasKey('placeholder', $fields[2]);
        $this->assertArrayNotHasKey('maxLength', $fields[2]);
        $this->assertArrayNotHasKey('price', $fields[2]);
        $this->assertArrayNotHasKey('placeholder', $fields[3]);
        $this->assertArrayNotHasKey('maxLength', $fields[3]);
        $this->assertArrayNotHasKey('options', $fields[3]);
    }

    public function test_unknown_type_rejects_the_entire_save_instead_of_becoming_text(): void
    {
        $result = kubikart_sanitize_custom_fields_payload([
            ['id' => 'legacy', 'label' => 'Legacy', 'type' => 'mystery'],
        ]);

        $this->assertFalse($result['valid']);
        $this->assertNotEmpty($result['errors']);
        $this->assertSame([], $result['payload']['fields']);
    }

    public function test_original_legacy_payload_is_backed_up_once_before_reviewed_save(): void
    {
        $legacy = [['id' => 'font', 'label' => 'Font', 'type' => 'text']];

        $this->assertTrue(kubikart_backup_legacy_custom_fields(82, $legacy));
        $this->assertFalse(kubikart_backup_legacy_custom_fields(82, [['changed' => true]]));
        $backup = get_post_meta(82, KUBIKART_PRODUCT_FIELDS_BACKUP_META_KEY, true);

        $this->assertSame($legacy, $backup['payload']);
        $this->assertSame('2026-07-28 12:00:00', $backup['created_at']);
    }

    public function test_rendered_reload_contains_editable_structured_controls(): void
    {
        $field = kubikart_sanitize_custom_fields_payload($this->completeSubmittedFields())['payload']['fields'][2];

        ob_start();
        kubikart_render_custom_field_row(2, $field);
        $html = ob_get_clean();

        $this->assertStringContainsString('name="kubikart_cf[2][id]"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][label]"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][type]"', $html);
        $this->assertStringContainsString('value="select"  selected="selected"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][required]"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][placeholder]"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][maxLength]"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][options]"', $html);
        $this->assertStringContainsString('classic|Classic', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][defaultValue]"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][price]"', $html);
        $this->assertStringContainsString('name="kubikart_cf[2][helperText]"', $html);
        $this->assertStringContainsString('data-remove-field', $html);
    }

    public function test_each_type_is_selected_again_after_rendered_reload(): void
    {
        foreach (['text', 'textarea', 'select', 'checkbox'] as $type) {
            ob_start();
            kubikart_render_custom_field_row(0, [
                'id' => 'field_' . $type,
                'label' => ucfirst($type),
                'type' => $type,
            ]);
            $html = ob_get_clean();

            $this->assertMatchesRegularExpression(
                '/<option value="' . $type . '"[^>]*selected="selected"/',
                $html,
                sprintf('Expected %s to remain selected after reload.', $type)
            );
        }
    }

    public function test_rest_value_matches_the_normalized_stored_schema(): void
    {
        $payload = kubikart_sanitize_custom_fields_payload($this->completeSubmittedFields())['payload'];
        update_post_meta(82, KUBIKART_PRODUCT_FIELDS_META_KEY, $payload);
        $response = new WP_REST_Response([
            'meta_data' => [
                ['id' => 10, 'key' => KUBIKART_PRODUCT_FIELDS_META_KEY, 'value' => 'duplicate'],
            ],
        ]);
        $product = new class {
            public function get_id(): int { return 82; }
        };

        $result = apply_filters('woocommerce_rest_prepare_product_object', $response, $product);
        $entries = array_values(array_filter(
            $result->get_data()['meta_data'],
            fn ($entry) => $entry['key'] === KUBIKART_PRODUCT_FIELDS_META_KEY
        ));

        $this->assertCount(1, $entries);
        $this->assertSame(2, $entries[0]['value']['schema_version']);
        $this->assertSame($payload['fields'], $entries[0]['value']['fields']);
        $this->assertFalse($entries[0]['value']['requires_review']);
    }

    private function completeSubmittedFields(): array
    {
        return [
            [
                'id' => 'engraving_text',
                'label' => 'Engraving text',
                'type' => 'text',
                'required' => '1',
                'placeholder' => 'e.g. M & T',
                'maxLength' => '20',
                'helperText' => '',
            ],
            [
                'id' => 'special_request',
                'label' => 'Special requests',
                'type' => 'textarea',
                'placeholder' => 'For example, text on the back',
                'helperText' => '',
            ],
            [
                'id' => 'font',
                'label' => 'Font',
                'type' => 'select',
                'required' => '1',
                'options' => "classic|Classic\nmodern|Modern\nhandwritten|Handwritten",
                'defaultValue' => 'classic',
                'helperText' => '',
            ],
            [
                'id' => 'gift_wrapping',
                'label' => 'Add gift wrapping',
                'type' => 'checkbox',
                'price' => '2.50',
                'helperText' => '',
            ],
        ];
    }
}
