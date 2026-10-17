<?php
/**
 * Shared runner for the single-attribute "overall width" catalogue products (opening-hours decal, business-logo decal):
 * dry run, apply (create or convert a placeholder pair) and rollback. See the two thin scripts that call it.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/catalogue-engine.php';

/** Taxonomy of the size attribute (the decals use "Gesamtbreite"; other products may define their own). */
function kc_size_attribute(array $data): string {
    return $data['size_attribute'] ?? 'pa_gesamtbreite';
}

/** Width keys that carry no price: a request-only size ("Request custom size"). */
function kc_request_size_keys(array $data): array {
    return array_keys(array_filter($data['widths'] ?? [], fn($w) => !isset($w['price'])));
}

function kc_request_size_missing(int $de_id, array $data, string $key): bool {
    $term = get_term_by('name', $data['widths'][$key]['de'], kc_size_attribute($data));
    if (!$term) {
        return true;
    }
    foreach (wc_get_product($de_id)->get_children() as $child) {
        $variation = wc_get_product($child);
        if ($variation && ($variation->get_attributes()[kc_size_attribute($data)] ?? '') === $term->slug) {
            return false;
        }
    }
    return true;
}

/** Adds the request-only size (no price) to an existing product and its translation; returns how many were added. */
function kc_ensure_request_sizes(array $data, array $matrix, int $de_id, int $en_id): int {
    $added = 0;
    $attr = kc_size_attribute($data);
    $created_terms = [];
    $slugs = kc_ensure_terms($attr, $matrix['terms'][$attr], $created_terms);
    $product = wc_get_product($de_id);
    $attributes = $product->get_attributes();
    $repaired = false;
    if (isset($attributes[$attr])) {
        $options = array_map(fn($key) => (int) get_term_by('slug', $slugs[$key]['de'], $attr)->term_id, array_keys($matrix['terms'][$attr]));
        $current = array_map('intval', $attributes[$attr]->get_options());
        sort($current);
        $wanted = $options;
        sort($wanted);
        $repaired = $current !== $wanted;
        // A clone, so WooCommerce sees a changed attribute (mutating the same object is not detected as a change).
        $updated = clone $attributes[$attr];
        $updated->set_options($options);
        $attributes[$attr] = $updated;
        $product->set_attributes($attributes);
        $product->save();
        wp_set_object_terms($de_id, $options, $attr);
    }
    foreach (kc_request_size_keys($data) as $key) {
        if (!kc_request_size_missing($de_id, $data, $key)) {
            continue;
        }
        $variation = new WC_Product_Variation();
        $variation->set_parent_id($de_id);
        $variation->set_status('publish');
        $variation->set_manage_stock(false);
        $variation->set_stock_status('instock');
        $variation->set_attributes([$attr => $slugs[$key]['de']]);
        $variation->save();
        $added++;
    }
    if ($added || $repaired) {
        WC_Product_Variable::sync($de_id);
        wc_delete_product_transients($de_id);
        if ($en_id) {
            PLLWC()->products->copy_product_props(wc_get_product($de_id), wc_get_product($en_id), 'en');
            PLLWC()->products->copy_variations($de_id, $en_id, 'en');
            WC_Product_Variable::sync($en_id);
            wc_delete_product_transients($en_id);
        }
    }
    return $added + ($repaired ? 1 : 0);
}

/** @param array<int, string> $args WP-CLI positional arguments */
function kc_run_width_product(array $data, array $args, string $script): void {
    $mode = $args[0] ?? 'dry-run';
    $langs = ['de', 'en'];
    $attr = kc_size_attribute($data);
    $purchase_mode = $data['purchase_mode'] ?? 'purchase';

    // ---------------------------------------------------------------------------
    // Rollback
    // ---------------------------------------------------------------------------
    if ($mode === 'rollback') {
        $file = $args[1] ?? '';
        if (!$file || !is_readable($file)) {
            WP_CLI::error('Usage: rollback <snapshot-file>');
        }
        $snapshot = json_decode((string) file_get_contents($file), true);
        foreach (array_reverse($snapshot['created'] ?? []) as $product_id) {
            $product = wc_get_product((int) $product_id);
            if ($product) {
                foreach ($product->get_children() as $child) {
                    wp_delete_post((int) $child, true);
                }
                wp_delete_post((int) $product_id, true);
                WP_CLI::line("deleted product #{$product_id} and its variations");
            }
        }
        foreach ($snapshot['converted'] ?? [] as $old) {
            $product = wc_get_product((int) $old['id']);
            if (!$product) {
                continue;
            }
            foreach ($product->get_children() as $child) {
                wp_delete_post((int) $child, true);
            }
            wp_set_object_terms((int) $old['id'], 'simple', 'product_type');
            $restored = new WC_Product_Simple((int) $old['id']);
            $restored->set_name($old['title']);
            $restored->set_slug($old['slug']);
            $restored->set_status($old['status']);
            $restored->set_short_description($old['short']);
            $restored->set_description($old['content']);
            $restored->set_image_id((int) $old['image_id']);
            $restored->set_gallery_image_ids(array_map('intval', $old['gallery']));
            $restored->set_attributes([]);
            $restored->save();
            wp_set_object_terms((int) $old['id'], $old['categories'], 'product_cat');
            wp_set_object_terms((int) $old['id'], [], 'product_tag');
            update_post_meta((int) $old['id'], '_kubikart_purchase_mode', $old['mode']);
            delete_post_meta((int) $old['id'], '_kubikart_custom_fields');
            WP_CLI::line("restored placeholder #{$old['id']}");
        }
        foreach ($snapshot['terms'] ?? [] as $term_id) {
            wp_delete_term((int) $term_id, 'product_tag');
        }
        WP_CLI::success('Rolled back. Imported media, attributes and attribute terms are kept (unused, harmless).');
        return;
    }
    if (!in_array($mode, ['dry-run', 'apply'], true)) {
        WP_CLI::error("Unknown mode '{$mode}'. Use dry-run, apply or rollback.");
    }
    $apply = $mode === 'apply';
    $images_dir = isset($args[1]) && $args[1] !== '' ? rtrim((string) $args[1], '/') : (getenv('KUBIKART_VINYL_IMAGES_DIR') ?: '');

    // ---------------------------------------------------------------------------
    // Plan
    // ---------------------------------------------------------------------------
    // Either one size attribute (`widths`) or a full matrix (`terms` per attribute and `rows` with a price, or without one
    // for request-only rows; `request_kind` is "size" for a custom-size enquiry and "quote" for any other enquiry).
    if (isset($data['rows'])) {
        $matrix = ['terms' => $data['terms'], 'rows' => $data['rows']];
    } else {
        $matrix = ['terms' => [$attr => []], 'rows' => []];
        foreach ($data['widths'] as $key => $width) {
            $matrix['terms'][$attr][$key] = ['de' => $width['de'], 'en' => $width['en']];
            $matrix['rows'][] = [$attr => $key, 'price' => $width['price'] ?? null];
        }
    }

    /** @return array{id:int,state:string} state: missing | placeholder | done */
    $classify = static function (int $id): array {
        if (!$id) {
            return ['id' => 0, 'state' => 'missing'];
        }
        $product = wc_get_product($id);
        $stored = get_post_meta($id, '_kubikart_custom_fields', true);
        $has_fields = is_array($stored) && !empty($stored['fields']);
        if ($product && $product->is_type('variable') && $product->get_children()) {
            return ['id' => $id, 'state' => 'done'];
        }
        return ['id' => $id, 'state' => $has_fields ? 'done' : 'placeholder'];
    };

    $de_id = kc_find_product($data['de_slug']);
    foreach ($data['legacy_de_slugs'] ?? [] as $legacy) {
        $de_id = $de_id ?: kc_find_product($legacy);
    }
    $translations = $de_id && function_exists('pll_get_post_translations') ? pll_get_post_translations($de_id) : [];
    $en_id = (int) ($translations['en'] ?? 0);
    if (!$en_id) {
        foreach (array_merge([$data['en_slug']], $data['legacy_en_slugs'] ?? []) as $slug) {
            $en_id = $en_id ?: kc_find_product($slug);
        }
    }
    $state = ['de' => $classify($de_id), 'en' => $classify($en_id)];
    $assets = kc_asset_entries($data, $images_dir, $data['asset_prefix']);

    if (isset($data['rows'])) {
        $priced = count(array_filter($matrix['rows'], fn($r) => isset($r['price'])));
        WP_CLI::line(sprintf('variations per language: %d (%d with a price, %d request-only) over %s', count($matrix['rows']), $priced, count($matrix['rows']) - $priced, implode(' x ', array_keys($matrix['terms']))));
    } else {
        WP_CLI::line(sprintf('variations per language: %d (%s: %s)', count($matrix['rows']), $data['attributes'][$attr]['en'] ?? $attr, implode(' / ', array_map(fn($w) => $w['de'] . ' = ' . (isset($w['price']) ? $w['price'] . ' EUR' : 'on request (no price)'), $data['widths']))));
    }
    foreach ($data['attributes'] as $taxonomy => $def) {
        WP_CLI::line(sprintf('attribute %s ("%s" / "%s"): %s', $taxonomy, $def['de'], $def['en'], wc_attribute_taxonomy_id_by_name(substr($taxonomy, 3)) ? 'exists' : 'will be created'));
    }
    foreach ($langs as $lang) {
        $s = $state[$lang];
        $label = ['missing' => 'will be created as draft', 'placeholder' => "placeholder draft #{$s['id']} will be converted into this product", 'done' => "exists as #{$s['id']} - left as edited in WordPress (create-only)"][$s['state']];
        WP_CLI::line(sprintf('product [%s] %s: %s', $lang, $lang === 'de' ? $data['de_slug'] : $data['en_slug'], $label));
    }
    foreach (kc_request_size_keys($data) as $request_key) {
        $missing = $state['de']['state'] === 'done' && kc_request_size_missing($state['de']['id'], $data, $request_key);
        WP_CLI::line(sprintf('request-only size "%s": %s', $data['widths'][$request_key]['de'], $state['de']['state'] !== 'done' ? 'built with the product' : ($missing ? 'will be added to the existing product (no price, enquiry only)' : 'exists')));
    }
    foreach ($assets as $entry) {
        WP_CLI::line(sprintf('media [%s]: %s', $entry['asset_key'], $entry['existing_id'] ? "exists as #{$entry['existing_id']}" : 'will be imported (WebP copy of ' . $entry['asset']['file'] . ')'));
    }
    $problems = [];
    foreach ($assets as $entry) {
        if ($entry['existing_id']) {
            continue;
        }
        if ($entry['source_file'] === '' || !is_readable($entry['source_file'])) {
            $problems[] = "{$entry['asset_key']}: source file not readable (" . ($entry['source_file'] ?: 'no images directory given') . ')';
        } elseif (hash_file('sha256', $entry['source_file']) !== $entry['asset']['sha256']) {
            $problems[] = "{$entry['asset_key']}: {$entry['asset']['file']} does not match the reviewed checksum";
        }
    }
    foreach ($problems as $problem) {
        WP_CLI::warning($problem);
    }
    WP_CLI::line("Written on creation/conversion only: title, slug, descriptions, categories, tags, attribute and terms, variations and prices, personalisation fields, purchase mode ({$purchase_mode}), images, status draft. Not set: SKU, weight, dimensions.");
    if (!$apply) {
        WP_CLI::success('Dry run: nothing written.' . ($problems ? ' Fix the warnings above before apply.' : ''));
        return;
    }
    if ($problems) {
        WP_CLI::error('Aborting: media sources are missing or changed.');
    }

    // ---------------------------------------------------------------------------
    // Apply
    // ---------------------------------------------------------------------------
    $snapshot = ['created_at' => gmdate('c'), 'created' => [], 'converted' => [], 'terms' => [], 'attachments' => []];
    $backup_dir = dirname(untrailingslashit(ABSPATH)) . '/backups';
    if (!is_dir($backup_dir)) {
        wp_mkdir_p($backup_dir);
    }

    $attachment_ids = [];
    foreach ($assets as $entry) {
        if ($entry['existing_id']) {
            $attachment_ids[] = $entry['existing_id'];
            continue;
        }
        $entry['source_file'] = $images_dir . '/' . $entry['asset']['file'];
        $attachment_id = kk_import_asset($entry);
        $snapshot['attachments'][] = $attachment_id;
        $attachment_ids[] = $attachment_id;
        WP_CLI::line("imported media {$entry['asset_key']} as #{$attachment_id}");
    }

    $fill = static function (WC_Product_Variable $product, string $lang) use ($data, $attachment_ids): void {
        $product->set_name($data['name'][$lang]);
        $product->set_slug($lang === 'de' ? $data['de_slug'] : $data['en_slug']);
        $product->set_status('draft');
        $product->set_short_description($data['short'][$lang]);
        $product->set_description($data['description'][$lang]);
        $product->set_catalog_visibility('visible');
        $product->set_manage_stock(false);
        $product->set_stock_status('instock');
        $product->set_tax_status('taxable');
        if ($attachment_ids) {
            $product->set_image_id($attachment_ids[0]);
            $product->set_gallery_image_ids(array_slice($attachment_ids, 1));
        }
    };
    $decorate = static function (int $id, string $lang) use ($data, &$snapshot, $purchase_mode): void {
        if (function_exists('pll_set_post_language')) {
            pll_set_post_language($id, $lang);
        }
        wp_set_object_terms($id, kc_term_ids($data['categories'][$lang]), 'product_cat');
        wp_set_object_terms($id, kc_tag_ids($data['tags'][$lang], $lang, $snapshot['terms']), 'product_tag');
        update_post_meta($id, '_kubikart_purchase_mode', $purchase_mode);
        update_post_meta($id, '_kubikart_custom_fields', kc_fields($data, $lang));
    };
    /** Creates a new variable product, or turns an existing placeholder into one (remembering its old state). */
    $prepare = static function (string $lang) use (&$state, &$snapshot, $data): WC_Product_Variable {
        $s = $state[$lang];
        if ($s['state'] === 'missing') {
            $product = new WC_Product_Variable();
            $product->set_name($data['placeholder_name']);
            $product->set_status('draft');
            return $product;
        }
        $old = wc_get_product($s['id']);
        $snapshot['converted'][] = [
            'id' => $s['id'], 'title' => $old->get_name(), 'slug' => $old->get_slug(), 'status' => $old->get_status(),
            'short' => $old->get_short_description(), 'content' => $old->get_description(),
            'image_id' => $old->get_image_id(), 'gallery' => $old->get_gallery_image_ids(),
            'categories' => wp_get_post_terms($s['id'], 'product_cat', ['fields' => 'slugs']),
            'mode' => (string) get_post_meta($s['id'], '_kubikart_purchase_mode', true) ?: 'enquiry',
        ];
        wp_set_object_terms($s['id'], 'variable', 'product_type');
        return new WC_Product_Variable($s['id']);
    };

    $ids = ['de' => $state['de']['id'], 'en' => $state['en']['id']];
    $needs_build = in_array($state['de']['state'], ['missing', 'placeholder'], true);
    $new_link = $state['de']['state'] === 'missing' || $state['en']['state'] === 'missing';

    if ($needs_build) {
        kc_ensure_attributes($data);
        $created_terms = [];
        $slugs = [];
        foreach ($matrix['terms'] as $taxonomy => $defs) {
            $slugs[$taxonomy] = kc_ensure_terms($taxonomy, $defs, $created_terms);
        }
        WP_CLI::line(sprintf('attribute terms ready (%d new)', count($created_terms)));

        $product = $prepare('de');
        $fill($product, 'de');
        $attributes = [];
        $position = 0;
        foreach ($matrix['terms'] as $taxonomy => $defs) {
            $attribute = new WC_Product_Attribute();
            $attribute->set_id(wc_attribute_taxonomy_id_by_name(substr($taxonomy, 3)));
            $attribute->set_name($taxonomy);
            $attribute->set_options(array_map(fn($key) => (int) get_term_by('slug', $slugs[$taxonomy][$key]['de'], $taxonomy)->term_id, array_keys($defs)));
            $attribute->set_position($position++);
            $attribute->set_visible(true);
            $attribute->set_variation(true);
            $attributes[$taxonomy] = $attribute;
        }
        $product->set_attributes($attributes);
        $product->set_regular_price('');
        $ids['de'] = (int) $product->save();
        if ($state['de']['state'] === 'missing') {
            $snapshot['created'][] = $ids['de'];
        }
        $decorate($ids['de'], 'de');

        foreach ($matrix['rows'] as $row) {
            $variation = new WC_Product_Variation();
            $variation->set_parent_id($ids['de']);
            $variation->set_status('publish');
            if (($row['price'] ?? null) !== null) {
                $variation->set_regular_price($row['price']);
            }
            $variation->set_manage_stock(false);
            $variation->set_stock_status('instock');
            $variation_attributes = [];
            foreach (array_keys($matrix['terms']) as $taxonomy) {
                $variation_attributes[$taxonomy] = $slugs[$taxonomy][$row[$taxonomy]]['de'];
            }
            $variation->set_attributes($variation_attributes);
            $variation_id = $variation->save();
            if (!empty($row['request_kind'])) {
                update_post_meta($variation_id, '_kubikart_request_kind', $row['request_kind']);
            }
        }
        WC_Product_Variable::sync($ids['de']);
        wc_delete_product_transients($ids['de']);
        WP_CLI::line(sprintf('built de product #%d with %d variations', $ids['de'], count($matrix['rows'])));
    }

    if ($state['en']['state'] !== 'done') {
        $english = $prepare('en');
        $fill($english, 'en');
        $ids['en'] = (int) $english->save();
        if ($state['en']['state'] === 'missing') {
            $snapshot['created'][] = $ids['en'];
        }
        $decorate($ids['en'], 'en');
        if ($new_link && function_exists('pll_save_post_translations')) {
            pll_save_post_translations($ids);
        }
        // Polylang for WooCommerce translates the attribute and creates the linked English variations.
        $german = wc_get_product($ids['de']);
        $english = wc_get_product($ids['en']);
        PLLWC()->products->copy_product_props($german, $english, 'en');
        PLLWC()->products->copy_variations($ids['de'], $ids['en'], 'en');
        WC_Product_Variable::sync($ids['en']);
        wc_delete_product_transients($ids['en']);
        // The request kind is variation meta: carry it over to the translated variations.
        foreach (wc_get_product($ids['de'])->get_children() as $variation_id) {
            $kind = (string) get_post_meta($variation_id, '_kubikart_request_kind', true);
            $translated = $kind !== '' && function_exists('pll_get_post') ? (int) pll_get_post($variation_id, 'en') : 0;
            if ($translated) {
                update_post_meta($translated, '_kubikart_request_kind', $kind);
            }
        }
        WP_CLI::line(sprintf('built en product #%d with %d variations', $ids['en'], count(wc_get_product($ids['en'])->get_children())));
    }

    // Products built before the request-only size existed get it added (idempotent).
    if ($state['de']['state'] === 'done' && !isset($data['rows'])) {
        $added = kc_ensure_request_sizes($data, $matrix, $ids['de'], $ids['en']);
        if ($added) {
            WP_CLI::line("added {$added} request-only size variation(s) to the existing product");
        }
    }

    $snapshot_file = $backup_dir . '/' . $data['key'] . '-snapshot-' . gmdate('Ymd-His') . '.json';
    file_put_contents($snapshot_file, wp_json_encode($snapshot, JSON_PRETTY_PRINT));
    WP_CLI::success("Done. Products: DE #{$ids['de']}, EN #{$ids['en']} (draft). Rollback: wp eval-file scripts/{$script} rollback {$snapshot_file}");

}
