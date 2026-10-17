<?php

use PHPUnit\Framework\TestCase;

class KubikartLocalisedAttributesTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-localised-attributes.php';

        if (!function_exists('taxonomy_exists')) {
            function taxonomy_exists(string $taxonomy): bool { return str_starts_with($taxonomy, 'pa_'); }
        }
        if (!function_exists('get_terms')) {
            function get_terms(array $args): array { return $GLOBALS['_kubikart_test_terms'] ?? []; }
        }
        if (!function_exists('pll_translate_string')) {
            function pll_translate_string(string $string, string $language): string {
                return ['en' => ['Form' => 'Shape', 'Größe' => 'Size']][$language][$string] ?? $string;
            }
        }
    }

    public function test_taxonomy_attribute_options_follow_the_custom_term_order(): void
    {
        $GLOBALS['_kubikart_test_terms'] = ['12 pcs', '24 pcs', '108 pcs', '1,080 pcs'];
        $attributes = [['id' => 5, 'name' => 'Quantity', 'slug' => 'pa_stueckzahl', 'options' => ['1,080 pcs', '108 pcs', '12 pcs', '24 pcs', 'unordered']]];

        $result = kubikart_localise_attribute_names($attributes, 'en');

        $this->assertSame(['12 pcs', '24 pcs', '108 pcs', '1,080 pcs', 'unordered'], $result[0]['options']);
    }

    private function attributes(): array
    {
        return [
            ['id' => 3, 'name' => 'Form', 'slug' => 'pa_form', 'options' => ['Round']],
            ['id' => 4, 'name' => 'Größe', 'slug' => 'pa_groesse', 'options' => ['Ø 25 mm']],
            ['id' => 0, 'name' => 'Größe', 'slug' => 'Größe', 'options' => ['Small']],
        ];
    }

    public function test_english_product_gets_translated_taxonomy_attribute_labels(): void
    {
        $result = kubikart_localise_attribute_names($this->attributes(), 'en');

        $this->assertSame('Shape', $result[0]['name']);
        $this->assertSame('Size', $result[1]['name']);
    }

    public function test_default_language_keeps_the_label_and_custom_attributes_are_untouched(): void
    {
        $de = kubikart_localise_attribute_names($this->attributes(), 'de');
        $en = kubikart_localise_attribute_names($this->attributes(), 'en');

        $this->assertSame('Form', $de[0]['name']);
        $this->assertSame('Größe', $en[2]['name']);
    }

    public function test_unknown_language_leaves_everything_unchanged(): void
    {
        $this->assertSame($this->attributes(), kubikart_localise_attribute_names($this->attributes(), ''));
    }
}
