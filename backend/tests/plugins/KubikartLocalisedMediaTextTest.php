<?php

use PHPUnit\Framework\TestCase;

if (!function_exists('wp_strip_all_tags')) {
    function wp_strip_all_tags(string $text, bool $remove_breaks = false): string {
        return trim(strip_tags($text));
    }
}

class KubikartLocalisedMediaTextTest extends TestCase
{
    private const DE = 164;
    private const EN = 163;
    private const ATTACHMENT = 500;

    protected function setUp(): void
    {
        wp_reset_mocks();
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-localised-media-text.php';

        $GLOBALS['_wp_posts'][self::ATTACHMENT] = (object) [
            'ID' => self::ATTACHMENT, 'post_type' => 'attachment', 'post_status' => 'inherit',
            'post_title' => 'Friseur- &amp; Barber-Paket – Übersicht', 'post_excerpt' => 'Illustrative Darstellung: Aufsteller.',
        ];
        $GLOBALS['_wp_post_meta'][self::ATTACHMENT] = [
            '_wp_attachment_image_alt' => 'Gestaltungsbeispiel deutsch',
            '_kubikart_text_en_title' => 'Barber & Salon Kit – Overview',
            '_kubikart_text_en_alt' => 'Design example english',
            '_kubikart_text_en_caption' => 'Illustrative image: stand.',
        ];
        $GLOBALS['_wp_post_languages'] = [self::DE => 'de', self::EN => 'en'];
    }

    private function images(): array
    {
        return [['id' => self::ATTACHMENT, 'src' => 'https://x/y.webp', 'name' => 'y', 'alt' => '']];
    }

    public function test_german_product_gets_attachment_text_and_caption(): void
    {
        $image = kubikart_localise_product_images($this->images(), self::DE)[0];

        $this->assertSame('Friseur- & Barber-Paket – Übersicht', $image['name']);
        $this->assertSame('Gestaltungsbeispiel deutsch', $image['alt']);
        $this->assertSame('Illustrative Darstellung: Aufsteller.', $image['caption']);
    }

    public function test_english_product_gets_english_meta_for_the_same_attachment(): void
    {
        $image = kubikart_localise_product_images($this->images(), self::EN)[0];

        $this->assertSame(self::ATTACHMENT, $image['id']);
        $this->assertSame('Barber & Salon Kit – Overview', $image['name']);
        $this->assertSame('Design example english', $image['alt']);
        $this->assertSame('Illustrative image: stand.', $image['caption']);
    }

    public function test_missing_translation_falls_back_to_default_text(): void
    {
        unset($GLOBALS['_wp_post_meta'][self::ATTACHMENT]['_kubikart_text_en_alt']);

        $image = kubikart_localise_product_images($this->images(), self::EN)[0];

        $this->assertSame('Gestaltungsbeispiel deutsch', $image['alt']);
    }

    public function test_rest_filter_updates_the_product_response(): void
    {
        $product = new class { public function get_id(): int { return 163; } };
        $response = apply_filters('woocommerce_rest_prepare_product_object', new WP_REST_Response(['images' => $this->images()]), $product);

        $this->assertSame('Illustrative image: stand.', $response->data['images'][0]['caption']);
    }
}
