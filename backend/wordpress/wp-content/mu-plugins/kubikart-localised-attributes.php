<?php
/**
 * Must-Use Plugin: Kubikart Localised Attribute Names
 *
 * Global product attributes (for example shape, size, quantity) have ONE label in WooCommerce. Polylang for
 * WooCommerce stores the other languages as string translations but does not apply them to the REST API that the
 * storefront reads. This plugin serves the label in the language of the product (or of the variation's parent) in
 * `attributes[].name` of product and variation responses. Terms are already translated by Polylang; custom
 * (non-taxonomy) attributes are not touched.
 *
 * It also lists the options of taxonomy attributes in the order of the terms' `order_<taxonomy>` meta (the
 * "custom ordering" of WooCommerce attributes), which the REST API ignores and sorts by name instead. That order
 * matters for sizes and quantities, which would otherwise read "1.080, 100, 108, 12 ..."; terms without an order
 * keep their relative position after the ordered ones.
 */

if (!defined('ABSPATH')) {
    exit;
}

/** @return string[] Term names of the taxonomy in custom order for that language (empty when nothing is ordered). */
function kubikart_attribute_term_order(string $taxonomy, string $language): array {
    static $cache = [];
    $key = $taxonomy . '|' . $language;
    if (!isset($cache[$key])) {
        $names = function_exists('get_terms')
            ? get_terms(['taxonomy' => $taxonomy, 'hide_empty' => false, 'fields' => 'names', 'orderby' => 'meta_value_num', 'meta_key' => 'order_' . $taxonomy, 'lang' => $language])
            : [];
        $cache[$key] = is_array($names) ? array_values(array_map(static fn($name) => html_entity_decode((string) $name, ENT_QUOTES | ENT_HTML5, 'UTF-8'), $names)) : [];
    }
    return $cache[$key];
}

/**
 * @param array<int, array<string, mixed>> $attributes WooCommerce REST attribute entries.
 * @return array<int, array<string, mixed>>
 */
function kubikart_localise_attribute_names(array $attributes, string $language): array {
    if ($language === '' || !function_exists('pll_translate_string')) {
        return $attributes;
    }

    foreach ($attributes as $index => $attribute) {
        // Only taxonomy attributes (id > 0) have a shared label that Polylang can translate.
        if ((int) ($attribute['id'] ?? 0) > 0 && !empty($attribute['name'])) {
            $attributes[$index]['name'] = (string) pll_translate_string((string) $attribute['name'], $language);
        }
        if (is_array($attribute['options'] ?? null) && ($attribute['id'] ?? 0) && !empty($attribute['slug']) && function_exists('taxonomy_exists') && taxonomy_exists((string) $attribute['slug'])) {
            $order = array_flip(kubikart_attribute_term_order((string) $attribute['slug'], $language));
            if ($order) {
                $options = array_values($attribute['options']);
                $positions = array_map(static fn($option) => $order[html_entity_decode((string) $option, ENT_QUOTES | ENT_HTML5, 'UTF-8')] ?? PHP_INT_MAX, $options);
                array_multisort($positions, SORT_ASC, SORT_NUMERIC, $options);
                $attributes[$index]['options'] = $options;
            }
        }
    }

    return $attributes;
}

function kubikart_localise_attributes_in_response($response, $product) {
    if (!($response instanceof WP_REST_Response) || !is_array($response->data['attributes'] ?? null) || !is_object($product) || !method_exists($product, 'get_id')) {
        return $response;
    }

    $product_id = method_exists($product, 'get_parent_id') && $product->get_parent_id() ? (int) $product->get_parent_id() : (int) $product->get_id();
    $language = function_exists('pll_get_post_language') ? (string) pll_get_post_language($product_id) : '';
    $response->data['attributes'] = kubikart_localise_attribute_names($response->data['attributes'], $language);

    return $response;
}

add_filter('woocommerce_rest_prepare_product_object', 'kubikart_localise_attributes_in_response', 20, 2);
add_filter('woocommerce_rest_prepare_product_variation_object', 'kubikart_localise_attributes_in_response', 20, 2);
