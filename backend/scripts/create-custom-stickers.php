<?php
/**
 * Creates the "custom stickers with logo or text" variable product (German + English) with its categories, tags,
 * personalisation fields, shape/size/quantity variations and images.
 *
 * Shape, size and quantity are GLOBAL WooCommerce attributes (pa_form, pa_groesse, pa_stueckzahl) with German and
 * English terms linked as Polylang translations. Polylang for WooCommerce then creates the English variations as
 * linked translations of the German ones (the only supported way to keep both languages in step).
 *
 * Usage (from the backend folder; `lando wp` or, in the container, `wp --allow-root`):
 *   wp eval-file scripts/create-custom-stickers.php                        # dry run (default), writes nothing
 *   wp eval-file scripts/create-custom-stickers.php apply <images-dir>      # create what is missing
 *   wp eval-file scripts/create-custom-stickers.php rollback <snapshot>     # delete what an apply created
 *
 * <images-dir> is the folder with the six reviewed PNG originals (never modified; a WebP copy is imported through
 * the same helpers as the Business Bundle images). KUBIKART_STICKER_IMAGES_DIR works as well.
 *
 * Create-only and repeatable: the German product is found by its slug and the English one through the Polylang
 * translation. An existing product, its variations and everything edited in WordPress are left alone; only
 * missing pieces (attributes, terms, the English product, missing tags, media) are created. The product is created as a DRAFT because
 * the prices and piece counts are provisional; publish it in WordPress once they are verified. Categories must
 * already exist (the script never creates them). Media is found by `_kubikart_asset_key` + checksum, never by ID.
 * Take a database backup before `apply` on any environment other than local development.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/lib/catalogue-engine.php';

$data = require __DIR__ . '/data/custom-stickers.php';
$mode = $args[0] ?? 'dry-run';
$langs = ['de', 'en'];

if ($mode === 'rollback') {
    $file = $args[1] ?? '';
    if (!$file || !is_readable($file)) {
        WP_CLI::error('Usage: rollback <snapshot-file>');
    }
    $snapshot = json_decode((string) file_get_contents($file), true);
    foreach (array_reverse($snapshot['products'] ?? []) as $product_id) {
        $product = wc_get_product((int) $product_id);
        if ($product) {
            foreach ($product->get_children() as $child) {
                wp_delete_post((int) $child, true);
            }
            wp_delete_post((int) $product_id, true);
            WP_CLI::line("deleted product #{$product_id} and its variations");
        }
    }
    foreach ($snapshot['terms'] ?? [] as $term_id) {
        wp_delete_term((int) $term_id, 'product_tag');
    }
    WP_CLI::success('Rolled back. Imported media is kept (unused media is harmless).');
    return;
}
if (!in_array($mode, ['dry-run', 'apply'], true)) {
    WP_CLI::error("Unknown mode '{$mode}'. Use dry-run, apply or rollback.");
}
$apply = $mode === 'apply';

$images_dir = isset($args[1]) && $args[1] !== '' ? rtrim((string) $args[1], '/') : (getenv('KUBIKART_STICKER_IMAGES_DIR') ?: '');

/** Term definitions per attribute taxonomy plus one row per variation (keys refer to the term definitions). */
function kc_matrix(array $data): array {
    $terms = ['pa_form' => [], 'pa_groesse' => [], 'pa_stueckzahl' => []];
    $rows = [];
    foreach ($data['shapes'] as $shape_key => $shape) {
        $terms['pa_form'][$shape_key] = ['de' => $shape['de'], 'en' => $shape['en']];
        foreach ($shape['sizes'] as $size_key => $counts) {
            $size_de = ($shape['size_prefix']['de'] ?? '') . $size_key;
            $size_en = ($shape['size_prefix']['en'] ?? '') . $size_key;
            $terms['pa_groesse'][$size_de] = ['de' => $size_de, 'en' => $size_en];
            foreach ($counts as $tier => $count) {
                $terms['pa_stueckzahl'][$count] = ['de' => $data['quantity_label']($count, 'de'), 'en' => $data['quantity_label']($count, 'en')];
                $rows[] = ['pa_form' => $shape_key, 'pa_groesse' => $size_de, 'pa_stueckzahl' => $count, 'price' => $shape['prices'][$tier]];
            }
        }
    }
    ksort($terms['pa_stueckzahl']);
    return ['terms' => $terms, 'rows' => $rows];
}








// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------
$matrix = kc_matrix($data);
$de_id = kc_find_product($data['de_slug']);
$translations = $de_id && function_exists('pll_get_post_translations') ? pll_get_post_translations($de_id) : [];
$en_id = (int) ($translations['en'] ?? 0);
$assets = kc_asset_entries($data, $images_dir, 'custom-stickers');

$term_counts = array_map('count', $matrix['terms']);
WP_CLI::line(sprintf('variations per language: %d (%s)', count($matrix['rows']), implode(', ', array_map(fn($n, $c) => "{$n}: {$c} terms", array_keys($term_counts), $term_counts))));
foreach ($data['attributes'] as $taxonomy => $def) {
    WP_CLI::line(sprintf('attribute %s ("%s" / "%s"): %s', $taxonomy, $def['de'], $def['en'], wc_attribute_taxonomy_id_by_name(substr($taxonomy, 3)) ? 'exists' : 'will be created'));
}
foreach ($langs as $lang) {
    $id = $lang === 'de' ? $de_id : $en_id;
    WP_CLI::line(sprintf('product [%s] %s: %s', $lang, $lang === 'de' ? $data['de_slug'] : $data['en_slug'], $id ? "exists as #{$id} - left as edited in WordPress (create-only)" : 'will be created as draft'));
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
WP_CLI::line('Fields written on creation only: title, slug, descriptions, categories, tags, global attributes and terms, variations and prices, personalisation fields, purchase mode (purchase), images, status draft.');
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
$snapshot = ['created_at' => gmdate('c'), 'products' => [], 'terms' => [], 'attachments' => []];
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

$product_base = static function (string $lang) use ($data, $attachment_ids): WC_Product_Variable {
    $product = new WC_Product_Variable();
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
    return $product;
};
$decorate = static function (int $id, string $lang) use ($data, &$snapshot): void {
    if (function_exists('pll_set_post_language')) {
        pll_set_post_language($id, $lang);
    }
    wp_set_object_terms($id, kc_term_ids($data['categories'][$lang]), 'product_cat');
    wp_set_object_terms($id, kc_tag_ids($data['tags'][$lang], $lang, $snapshot['terms']), 'product_tag');
    update_post_meta($id, '_kubikart_purchase_mode', 'purchase');
    update_post_meta($id, '_kubikart_custom_fields', kc_fields($data, $lang));
};

$ids = ['de' => $de_id, 'en' => $en_id];
if (!$ids['de']) {
    kc_ensure_attributes($data);
    $created_terms = [];
    $slugs = [];
    foreach ($matrix['terms'] as $taxonomy => $defs) {
        $slugs[$taxonomy] = kc_ensure_terms($taxonomy, $defs, $created_terms);
    }
    WP_CLI::line(sprintf('attribute terms ready (%d new)', count($created_terms)));

    $product = $product_base('de');
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
    $ids['de'] = (int) $product->save();
    $snapshot['products'][] = $ids['de'];
    $decorate($ids['de'], 'de');

    foreach ($matrix['rows'] as $row) {
        $variation = new WC_Product_Variation();
        $variation->set_parent_id($ids['de']);
        $variation->set_status('publish');
        $variation->set_regular_price($row['price']);
        $variation->set_manage_stock(false);
        $variation->set_stock_status('instock');
        $variation->set_attributes([
            'pa_form' => $slugs['pa_form'][$row['pa_form']]['de'],
            'pa_groesse' => $slugs['pa_groesse'][$row['pa_groesse']]['de'],
            'pa_stueckzahl' => $slugs['pa_stueckzahl'][$row['pa_stueckzahl']]['de'],
        ]);
        $variation->save();
    }
    WC_Product_Variable::sync($ids['de']);
    wc_delete_product_transients($ids['de']);
    WP_CLI::line(sprintf('created de product #%d with %d variations', $ids['de'], count($matrix['rows'])));
}

if (!$ids['en']) {
    $english = $product_base('en');
    $ids['en'] = (int) $english->save();
    $snapshot['products'][] = $ids['en'];
    $decorate($ids['en'], 'en');
    if (function_exists('pll_save_post_translations')) {
        pll_save_post_translations($ids);
    }
    // Polylang for WooCommerce translates the attributes and creates the linked English variations.
    $german = wc_get_product($ids['de']);
    $english = wc_get_product($ids['en']);
    PLLWC()->products->copy_product_props($german, $english, 'en');
    PLLWC()->products->copy_variations($ids['de'], $ids['en'], 'en');
    WC_Product_Variable::sync($ids['en']);
    wc_delete_product_transients($ids['en']);
    WP_CLI::line(sprintf('created en product #%d with %d variations', $ids['en'], count(wc_get_product($ids['en'])->get_children())));
}

$snapshot_file = $backup_dir . '/custom-stickers-snapshot-' . gmdate('Ymd-His') . '.json';
file_put_contents($snapshot_file, wp_json_encode($snapshot, JSON_PRETTY_PRINT));
WP_CLI::success("Done. Products: DE #{$ids['de']}, EN #{$ids['en']} (draft). Rollback: wp eval-file scripts/create-custom-stickers.php rollback {$snapshot_file}");
