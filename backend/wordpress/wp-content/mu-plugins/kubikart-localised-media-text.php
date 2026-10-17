<?php
/**
 * Must-Use Plugin: Kubikart Localised Media Text
 *
 * Polylang synchronises featured image and gallery between a product and its
 * translation, so both share the same media attachments. The attachment's own
 * title, alt text and caption are the default-language (German) text; text for
 * other languages is stored in `_kubikart_text_<lang>_{title,alt,caption}` meta
 * (written by backend/scripts/configure-business-kits.php).
 *
 * This plugin serves the matching text in the WooCommerce REST product
 * response (`images[].name`, `images[].alt`) and adds `images[].caption`.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * @param array<int, array<string, mixed>> $images WooCommerce REST image entries.
 * @return array<int, array<string, mixed>>
 */
function kubikart_localise_product_images(array $images, int $product_id): array {
    $language = function_exists('pll_get_post_language') ? (string) pll_get_post_language($product_id) : '';

    foreach ($images as $index => $image) {
        $attachment_id = (int) ($image['id'] ?? 0);
        if (!$attachment_id) {
            continue;
        }

        $post = get_post($attachment_id);
        $title = $post ? (string) $post->post_title : (string) ($image['name'] ?? '');
        $alt = (string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true);
        $caption = $post ? (string) $post->post_excerpt : '';

        if ($language !== '') {
            $title = (string) get_post_meta($attachment_id, "_kubikart_text_{$language}_title", true) ?: $title;
            $alt = (string) get_post_meta($attachment_id, "_kubikart_text_{$language}_alt", true) ?: $alt;
            $caption = (string) get_post_meta($attachment_id, "_kubikart_text_{$language}_caption", true) ?: $caption;
        }

        $images[$index]['name'] = html_entity_decode(wp_strip_all_tags($title), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        if ($alt !== '') {
            $images[$index]['alt'] = $alt;
        }
        $images[$index]['caption'] = html_entity_decode(wp_strip_all_tags($caption), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    return $images;
}

add_filter('woocommerce_rest_prepare_product_object', function ($response, $product) {
    if ($response instanceof WP_REST_Response && is_array($response->data['images'] ?? null) && is_object($product) && method_exists($product, 'get_id')) {
        $response->data['images'] = kubikart_localise_product_images($response->data['images'], (int) $product->get_id());
    }
    return $response;
}, 20, 2);
