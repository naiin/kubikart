<?php
/**
 * Shared helpers for the catalogue product scripts (create-custom-stickers.php, create-opening-hours-decals.php):
 * global attributes with translated terms, tags, categories, personalisation field payloads and media import.
 * Everything is resolved by slug / asset key, never by numeric ID.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/business-kit-images.php';

function kc_fields(array $data, string $lang): array {
    $fields = [];
    foreach ($data['fields'] as $f) {
        $row = ['id' => $f['id'], 'label' => $f['label'][$lang], 'type' => $f['type'], 'required' => $f['required'], 'helperText' => $f['help'][$lang] ?? ''];
        if (in_array($f['type'], ['text', 'textarea', 'url', 'email'], true)) {
            $row['placeholder'] = $f['placeholder'][$lang] ?? '';
            $row['maxLength'] = $f['max'] ?? null;
        }
        if ($f['type'] === 'select') {
            $row['options'] = array_map(fn($o) => ['label' => $o[1][$lang], 'value' => $o[0]], $f['options']);
            if (!empty($f['default'])) {
                $row['defaultValue'] = $f['default'];
            }
        }
        if (!empty($f['showWhen'])) {
            $row['showWhen'] = ['field' => $f['showWhen'][0], 'equals' => $f['showWhen'][1]];
        }
        $row['price'] = (float) ($f['price'] ?? 0);
        $fields[] = $row;
    }
    return ['schema_version' => 3, 'fields' => $fields];
}

function kc_find_product(string $slug): int {
    $found = get_posts(['post_type' => 'product', 'name' => $slug, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'suppress_filters' => true]);
    return $found ? (int) $found[0] : 0;
}

function kc_term_ids(array $slugs): array {
    $ids = [];
    foreach ($slugs as $slug) {
        $term = get_term_by('slug', $slug, 'product_cat');
        if ($term) {
            $ids[] = (int) $term->term_id;
        } else {
            WP_CLI::warning("Category '{$slug}' not found; skipped (create it first).");
        }
    }
    return $ids;
}

function kc_tag_ids(array $names, string $lang, array &$created): array {
    $ids = [];
    foreach ($names as $name) {
        $existing = get_terms(['taxonomy' => 'product_tag', 'name' => $name, 'hide_empty' => false, 'lang' => $lang]);
        if (!is_wp_error($existing) && $existing) {
            $ids[] = (int) $existing[0]->term_id;
            continue;
        }
        $slug = sanitize_title($name);
        $result = wp_insert_term($name, 'product_tag', ['slug' => $slug]);
        if (is_wp_error($result)) {
            $result = wp_insert_term($name, 'product_tag', ['slug' => $slug . '-' . $lang]);
        }
        if (is_wp_error($result)) {
            WP_CLI::warning("Tag '{$name}' could not be created: " . $result->get_error_message());
            continue;
        }
        $term_id = (int) $result['term_id'];
        if (function_exists('pll_set_term_language')) {
            pll_set_term_language($term_id, $lang);
        }
        $created[] = $term_id;
        $ids[] = $term_id;
    }
    return $ids;
}

/** Media: one shared attachment per image (Polylang syncs the gallery between translations). */
function kc_asset_entries(array $data, string $images_dir, string $prefix): array {
    $entries = [];
    $kit = ['name' => $data['name'], 'de_slug' => $data['de_slug']];
    foreach ($data['images'] as $image) {
        $key = $prefix . '/' . $image['role'];
        $existing = kk_find_asset($key);
        $texts = ['title' => $image['title'], 'alt' => $image['alt'], 'caption' => $image['caption']];
        $source = $images_dir !== '' ? $images_dir . '/' . $image['file'] : '';
        $entries[] = [
            'asset_key' => $key, 'existing_id' => $existing, 'kit' => $kit, 'asset' => ['role' => $image['role'], 'file' => $image['file'], 'sha256' => $image['sha256']],
            'texts' => $texts, 'source_file' => $source,
        ];
    }
    return $entries;
}

/** Creates (or finds) the global attributes. Labels are German; English labels are Polylang string translations. */
function kc_ensure_attributes(array $data): void {
    foreach ($data['attributes'] as $taxonomy => $def) {
        $slug = substr($taxonomy, 3);
        if (!wc_attribute_taxonomy_id_by_name($slug)) {
            $result = wc_create_attribute(['name' => $def['de'], 'slug' => $slug, 'type' => 'select', 'order_by' => 'menu_order', 'has_archives' => false]);
            if (is_wp_error($result)) {
                WP_CLI::error("Attribute {$slug}: " . $result->get_error_message());
            }
        }
    }
    delete_transient('wc_attribute_taxonomies');
    WC_Cache_Helper::invalidate_cache_group('woocommerce-attributes');
    foreach ($data['attributes'] as $taxonomy => $def) {
        if (!taxonomy_exists($taxonomy)) {
            register_taxonomy($taxonomy, ['product'], ['hierarchical' => false, 'public' => false, 'show_ui' => false, 'query_var' => true, 'rewrite' => false]);
        }
    }
    if (function_exists('PLL') && class_exists('PLL_MO')) {
        foreach (['en'] as $lang_slug) {
            $language = PLL()->model->get_language($lang_slug);
            if (!$language) {
                continue;
            }
            $mo = new PLL_MO();
            $mo->import_from_db($language);
            foreach ($data['attributes'] as $def) {
                $mo->add_entry($mo->make_entry($def['de'], $def[$lang_slug]));
            }
            $mo->export_to_db($language);
        }
    }
}

/** Creates the German and English terms of one attribute and links them; returns [key => [lang => term slug]]. */
function kc_ensure_terms(string $taxonomy, array $defs, array &$created_terms): array {
    $slugs = [];
    $position = 0;
    foreach ($defs as $key => $names) {
        $ids = [];
        foreach (['de', 'en'] as $lang) {
            $slug = sanitize_title($names[$lang]);
            $term = get_term_by('slug', $slug, $taxonomy);
            if (!$term || (function_exists('pll_get_term_language') && pll_get_term_language($term->term_id) !== $lang)) {
                $term = get_term_by('slug', $slug . '-' . $lang, $taxonomy);
                $slug = $term ? $term->slug : $slug;
            }
            if (!$term || (function_exists('pll_get_term_language') && pll_get_term_language($term->term_id) !== $lang)) {
                $slug = sanitize_title($names[$lang]);
                $result = wp_insert_term($names[$lang], $taxonomy, ['slug' => $slug]);
                if (is_wp_error($result)) {
                    $slug .= '-' . $lang;
                    $result = wp_insert_term($names[$lang], $taxonomy, ['slug' => $slug]);
                }
                if (is_wp_error($result)) {
                    WP_CLI::error("Term '{$names[$lang]}' ({$taxonomy}/{$lang}): " . $result->get_error_message());
                }
                $term = get_term((int) $result['term_id'], $taxonomy);
                if (function_exists('pll_set_term_language')) {
                    pll_set_term_language($term->term_id, $lang);
                }
                update_term_meta($term->term_id, 'order_' . $taxonomy, $position);
                $created_terms[] = $term->term_id;
            }
            $ids[$lang] = $term->term_id;
            $slugs[$key][$lang] = $term->slug;
        }
        if (function_exists('pll_save_term_translations')) {
            pll_save_term_translations($ids);
        }
        $position++;
    }
    return $slugs;
}
