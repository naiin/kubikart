<?php
/**
 * Creates or updates the six enquiry-only Business Bundles (German + English) from the owner's catalogue, imports their
 * images, fills the structured contents (base items + optional upgrades with add/replace semantics) and assigns the
 * bundles to the industry pages.
 *
 * Usage (from the backend folder; `lando wp` or, in the container, `wp --allow-root`):
 *   wp eval-file scripts/create-business-bundles.php                          # dry run (default): writes nothing
 *   wp eval-file scripts/create-business-bundles.php apply <images-dir>       # create/update, import images, assign industries
 *   wp eval-file scripts/create-business-bundles.php rollback <snapshot>      # undo what an apply did
 *
 * <images-dir> is the unzipped bundle pack (folders Barber-Hair-Salon/, ... with the PNG originals; a leading "images/"
 * in the catalogue paths is optional). KUBIKART_BUNDLE_IMAGES_DIR works as well. Originals are never modified; WebP copies
 * are imported and recorded by asset key + checksum, so reruns reuse them and a changed file replaces only the managed
 * association (the older upload is kept, renamed in the manifest).
 *
 * What it writes (managed fields only): title, slug, SKU, descriptions, category, tags, enquiry mode, contents, SEO meta,
 * featured image + gallery, and the industries' bundle lists. New products stay DRAFTS; existing ones keep their status.
 * Starting prices are null in the catalogue and are NOT written: set them in WordPress (the product price is the "from"
 * price). Take a database backup before `apply` outside local development.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/lib/catalogue-engine.php';

$data = require __DIR__ . '/data/business-bundles.php';
$mode = $args[0] ?? 'dry-run';
$langs = ['de', 'en'];

if (!function_exists('kubikart_kit_sanitize_contents_payload') || !function_exists('kubikart_industry_validate_relationships')) {
    WP_CLI::error('The Business Kit Contents mu-plugin and the Business Industries plugin must be active.');
}

// ---------------------------------------------------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------------------------------------------------
if ($mode === 'rollback') {
    $file = $args[1] ?? '';
    if (!$file || !is_readable($file)) {
        WP_CLI::error('Usage: rollback <snapshot-file>');
    }
    $snapshot = json_decode((string) file_get_contents($file), true);
    foreach ($snapshot['industries'] ?? [] as $industry_id => $before) {
        update_post_meta((int) $industry_id, '_kubikart_bundle_ids', $before['bundle_ids']);
        WP_CLI::line("restored bundle list of industry #{$industry_id}");
    }
    foreach ($snapshot['updated'] ?? [] as $id => $before) {
        $product = wc_get_product((int) $id);
        if (!$product) {
            continue;
        }
        $product->set_name($before['name']);
        $product->set_slug($before['slug']);
        $product->set_status($before['status']);
        $product->set_short_description($before['short']);
        $product->set_description($before['content']);
        $product->set_image_id((int) $before['image_id']);
        $product->set_gallery_image_ids(array_map('intval', $before['gallery']));
        $product->save();
        foreach ($before['meta'] as $key => $value) {
            $value === null ? delete_post_meta((int) $id, $key) : update_post_meta((int) $id, $key, $value);
        }
        WP_CLI::line("restored product #{$id}");
    }
    foreach (array_reverse($snapshot['created'] ?? []) as $id) {
        if (get_post_type((int) $id) === 'product' && wp_delete_post((int) $id, true)) {
            WP_CLI::line("deleted created product #{$id}");
        }
    }
    WP_CLI::success('Rolled back. Imported media and tags are kept (unused media is harmless).');
    return;
}
if (!in_array($mode, ['dry-run', 'apply'], true)) {
    WP_CLI::error("Unknown mode '{$mode}'. Use dry-run, apply or rollback.");
}
$apply = $mode === 'apply';
$images_dir = isset($args[1]) && $args[1] !== '' ? rtrim((string) $args[1], '/') : (getenv('KUBIKART_BUNDLE_IMAGES_DIR') ?: '');

// ---------------------------------------------------------------------------------------------------------------------
// Resolve and verify the source products (identity by slug, translation by Polylang, never by number alone)
// ---------------------------------------------------------------------------------------------------------------------
$problems = [];
$sources = [];
foreach ($data['source_slugs'] as $en_id => $slug) {
    $post = get_post($en_id);
    if (!$post || $post->post_type !== 'product') {
        $problems[] = "source product #{$en_id} does not exist";
        continue;
    }
    if ($post->post_name !== $slug) {
        $problems[] = "source product #{$en_id} is '{$post->post_name}', expected '{$slug}' - not attaching it";
        continue;
    }
    $translations = function_exists('pll_get_post_translations') ? pll_get_post_translations($en_id) : [];
    $de_id = (int) ($translations['de'] ?? 0);
    if (!$de_id || (function_exists('pll_get_post_language') && pll_get_post_language($en_id) !== 'en')) {
        $problems[] = "source product #{$en_id} ('{$slug}') is not an English product with a German translation";
        continue;
    }
    $short = static fn(int $id): string => trim(explode(' – ', html_entity_decode(get_the_title($id)))[0]);
    $sources[$en_id] = ['en' => $en_id, 'de' => $de_id, 'title' => ['en' => $short($en_id), 'de' => $short($de_id)]];
}

// ---------------------------------------------------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------------------------------------------------
$categories = ['de' => get_term_by('slug', 'business-kits-de', 'product_cat'), 'en' => get_term_by('slug', 'business-kits', 'product_cat')];
foreach ($langs as $lang) {
    if (!$categories[$lang]) {
        $problems[] = "Business Bundles category for '{$lang}' is missing";
    }
}

/** Text of a bundle in one language with the documented availability corrections applied. */
$bundle_text = static function (array $bundle, string $lang) use ($data): array {
    $fix = $data['corrections'][$bundle['key']]['replace'][$lang] ?? [];
    $apply_fix = static fn(string $text): string => strtr($text, $fix);
    return [
        'title' => $bundle['titles'][$lang],
        'short' => $apply_fix($bundle['short'][$lang]),
        'paragraphs' => array_map($apply_fix, $bundle['paragraphs'][$lang]),
    ];
};

$plan = [];
foreach ($data['catalogue']['bundles'] as $bundle) {
    $row = ['bundle' => $bundle, 'products' => []];
    foreach ($langs as $lang) {
        $slug = $lang === 'de' ? $bundle['slug'] . '-de' : $bundle['slug'];
        $row['products'][$lang] = ['slug' => $slug, 'existing' => kc_find_product($slug)];
    }
    // A SKU may only belong to this bundle's own records (translations share one SKU); never to another product.
    $sku_owner = (int) wc_get_product_id_by_sku($bundle['sku']);
    $own = array_filter([$row['products']['de']['existing'], $row['products']['en']['existing']]);
    if ($sku_owner && !in_array($sku_owner, $own, true) && get_post_meta($sku_owner, '_kubikart_bundle_key', true) !== $bundle['key']) {
        $problems[] = "SKU {$bundle['sku']} already belongs to product #{$sku_owner} ('" . get_post_field('post_name', $sku_owner) . "')";
    }
    foreach ($bundle['included'] as $item) {
        if (!isset($sources[$item['product_id']])) {
            $problems[] = "bundle {$bundle['key']}: included product #{$item['product_id']} could not be resolved";
        }
    }
    foreach ($bundle['optional'] as $item) {
        if (!isset($sources[$item['product_id']])) {
            $problems[] = "bundle {$bundle['key']}: optional product #{$item['product_id']} could not be resolved";
        }
    }
    foreach ($bundle['images'] as $image) {
        $relative = preg_replace('#^images/#', '', $image['path']);
        $source = $images_dir !== '' ? $images_dir . '/' . $relative : '';
        $key = 'bundles/' . $bundle['key'] . '/' . pathinfo($relative, PATHINFO_FILENAME);
        $existing_asset = kk_find_asset($key);
        $reuse = $existing_asset && (string) get_post_meta($existing_asset, KK_ASSET_SHA_META, true) === $image['sha256'];
        $action = $reuse ? 'reuse' : ($existing_asset ? 'replace' : 'import');
        if ($action !== 'reuse') {
            if ($source === '' || !is_readable($source)) {
                $problems[] = "image {$key}: source file not readable (" . ($source ?: 'no images directory given') . ')';
            } elseif (hash_file('sha256', $source) !== $image['sha256']) {
                // The owner may have cleaned the file: import it, but say so.
                WP_CLI::warning("image {$key}: file differs from the catalogue checksum (edited?); it is imported as supplied.");
            }
        }
        $row['images'][] = ['key' => $key, 'relative' => $relative, 'source' => $source, 'image' => $image, 'existing' => $existing_asset, 'action' => $action];
    }
    $plan[] = $row;
}

WP_CLI::line(sprintf('Bundles in catalogue: %d | source products resolved: %d of %d', count($plan), count($sources), count($data['source_slugs'])));
foreach ($plan as $row) {
    $b = $row['bundle'];
    $label = static fn(string $lang) => $row['products'][$lang]['existing'] ? "exists #{$row['products'][$lang]['existing']}" : 'will be created (draft)';
    WP_CLI::line(sprintf(
        '- %s | SKU %s | de/%s: %s | en/%s: %s | price: %s | %d base items, %d optional, %d images',
        $b['key'], $b['sku'], $row['products']['de']['slug'], $label('de'), $row['products']['en']['slug'], $label('en'),
        $b['starting_price_eur'] === null ? 'unset (owner value required)' : $b['starting_price_eur'],
        count($b['included']), count($b['optional']), count($b['images'])
    ));
    foreach ($row['products'] as $lang => $product) {
        if ($product['existing']) {
            $p = wc_get_product($product['existing']);
            WP_CLI::line(sprintf('    BEFORE %s #%d: "%s" status=%s sku=%s price=%s | AFTER: managed fields below, status kept', $lang, $product['existing'], $p->get_name(), $p->get_status(), $p->get_sku(), $p->get_regular_price() ?: 'unset'));
        }
    }
    foreach ($row['images'] as $img) {
        WP_CLI::line(sprintf('    image [%s] %s%s', $img['action'], $img['key'], $img['existing'] ? " (#{$img['existing']})" : ''));
    }
    if (isset($data['corrections'][$b['key']])) {
        WP_CLI::line('    CORRECTION: ' . $data['corrections'][$b['key']]['reason']);
    }
}
foreach ($data['industries'] as $entry) {
    foreach ($langs as $lang) {
        $post = get_posts(['post_type' => 'business_industry', 'name' => $entry[$lang], 'post_status' => 'any', 'numberposts' => 1, 'suppress_filters' => true]);
        if (!$post) {
            $problems[] = "industry '{$entry[$lang]}' ({$lang}) not found";
            continue;
        }
        $current = get_post_meta($post[0]->ID, '_kubikart_bundle_ids', true);
        WP_CLI::line(sprintf('  industry %-30s #%d current bundle list: %s -> %s', $entry[$lang], $post[0]->ID, wp_json_encode($current ?: []), implode(' + ', $entry['bundles'])));
    }
}
foreach ($problems as $problem) {
    WP_CLI::warning($problem);
}
if (!$apply) {
    WP_CLI::success('Dry run: nothing written.' . ($problems ? ' Fix the warnings above before apply.' : ''));
    return;
}
if ($problems) {
    WP_CLI::error('Aborting: fix the problems above first.');
}

// ---------------------------------------------------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------------------------------------------------
$backup_dir = dirname(untrailingslashit(ABSPATH)) . '/backups';
wp_mkdir_p($backup_dir);
$snapshot = ['created_at' => gmdate('c'), 'created' => [], 'updated' => [], 'industries' => [], 'attachments' => [], 'tags' => []];
$managed_meta = ['_kubikart_kit_scope_summary', '_kubikart_purchase_mode', '_kubikart_kit_order_mode', '_kubikart_kit_contents', '_kubikart_seo_title', '_kubikart_seo_description', '_kubikart_bundle_key'];
$bundle_ids = []; // key => ['de' => id, 'en' => id]

foreach ($plan as $row) {
    $b = $row['bundle'];

    // images: import / replace, then featured + gallery order
    $by_role = ['featured' => 0, 'gallery' => []];
    foreach ($row['images'] as $img) {
        $attachment = $img['existing'];
        if ($img['action'] !== 'reuse') {
            if ($img['existing']) {
                update_post_meta($img['existing'], KK_ASSET_KEY_META, $img['key'] . '@replaced-' . gmdate('Ymd-His'));
            }
            $texts = [
                'title' => $img['image']['alt'],
                'alt' => $img['image']['alt'],
                'caption' => ['de' => '', 'en' => ''],
            ];
            $attachment = kk_import_asset([
                'asset_key' => $img['key'],
                'kit' => ['name' => $b['titles'], 'de_slug' => $b['key']],
                'asset' => ['role' => pathinfo($img['relative'], PATHINFO_FILENAME), 'file' => $img['relative'], 'sha256' => hash_file('sha256', $img['source'])],
                'texts' => $texts,
                'source_file' => $img['source'],
            ]);
            $snapshot['attachments'][] = $attachment;
            WP_CLI::line("imported {$img['key']} as #{$attachment}");
        }
        if ($img['image']['role'] === 'featured') {
            $by_role['featured'] = $attachment;
        } else {
            $by_role['gallery'][(int) $img['image']['order']] = $attachment;
        }
    }
    ksort($by_role['gallery']);

    $created_tags = [];
    foreach ($langs as $lang) {
        $text = $bundle_text($b, $lang);
        $slot = $row['products'][$lang];
        $product = $slot['existing'] ? wc_get_product($slot['existing']) : new WC_Product_Simple();
        if ($slot['existing']) {
            $snapshot['updated'][$slot['existing']] = [
                'name' => $product->get_name(), 'slug' => $product->get_slug(), 'status' => $product->get_status(),
                'short' => $product->get_short_description(), 'content' => $product->get_description(),
                'image_id' => $product->get_image_id(), 'gallery' => $product->get_gallery_image_ids(),
                'meta' => array_combine($managed_meta, array_map(fn($k) => metadata_exists('post', $slot['existing'], $k) ? get_post_meta($slot['existing'], $k, true) : null, $managed_meta)),
            ];
        } else {
            $product->set_status('draft');
        }
        $product->set_name($text['title']);
        $product->set_slug($slot['slug']);
        $product->set_short_description($text['short']);
        $product->set_description(implode("\n", array_map(fn($p) => '<p>' . esc_html($p) . '</p>', $text['paragraphs'])));
        $product->set_catalog_visibility('visible');
        $product->set_manage_stock(false);
        $product->set_stock_status('instock');
        if ($by_role['featured']) {
            $product->set_image_id($by_role['featured']);
        }
        $product->set_gallery_image_ids(array_values($by_role['gallery']));
        if ($b['starting_price_eur'] !== null) {
            $product->set_regular_price((string) $b['starting_price_eur']);
        }
        try {
            $product->set_sku($b['sku']);
        } catch (WC_Data_Exception $exception) {
            // Translations share one SKU; WooCommerce's uniqueness check refuses the second one, so it is written below.
        }
        $id = (int) $product->save();
        if (!$slot['existing']) {
            $snapshot['created'][] = $id;
        }

        pll_set_post_language($id, $lang);
        wp_set_object_terms($id, [(int) $categories[$lang]->term_id], 'product_cat');
        wp_set_object_terms($id, kc_tag_ids($b['tags'][$lang], $lang, $created_tags), 'product_tag');
        if (get_post_meta($id, '_sku', true) !== $b['sku']) {
            update_post_meta($id, '_sku', $b['sku']);
            WC_Data_Store::load('product')->update_lookup_table($id, 'wc_product_meta_lookup');
        }
        update_post_meta($id, '_kubikart_bundle_key', $b['key']);
        update_post_meta($id, '_kubikart_kit_order_mode', 'enquiry');
        if (function_exists('kubikart_set_purchase_mode')) {
            kubikart_set_purchase_mode($id, 'enquiry');
        }
        update_post_meta($id, '_kubikart_seo_title', $b['seo'][$lang][0]);
        update_post_meta($id, '_kubikart_seo_description', $b['seo'][$lang][1]);
        // Optional one-line scope summary next to the price (owner text per bundle); other bundles keep what they have.
        if (isset($b['scope_summary'][$lang])) {
            update_post_meta($id, '_kubikart_kit_scope_summary', mb_substr(sanitize_text_field($b['scope_summary'][$lang]), 0, 200));
        }

        $bundle_ids[$b['key']][$lang] = $id;
    }
    pll_save_post_translations(['de' => $bundle_ids[$b['key']]['de'], 'en' => $bundle_ids[$b['key']]['en']]);

    // structured contents (validated by the plugin; product references are mapped to each bundle's language)
    foreach ($langs as $lang) {
        $id = $bundle_ids[$b['key']][$lang];
        $rows = [];
        foreach ($b['included'] as $item) {
            $quantity = $data['corrections'][$b['key']]['quantity'][$item['product_id']] ?? $item['quantity'];
            $spec = $item['specification'][$lang];
            if ($quantity !== $item['quantity']) {
                $spec = strtr($spec, $data['corrections'][$b['key']]['replace'][$lang] ?? []);
                $spec = $lang === 'de'
                    ? '48 Logo-Aufkleber mit einem Motiv, rund, Ø 40 mm (nächstgelegene verfügbare Packungsgröße).'
                    : '48 logo stickers, one design, round Ø 40 mm (the nearest available pack size).';
            }
            $rows[] = ['product_id' => $item['product_id'], 'quantity' => $quantity, 'title' => $item['title'][$lang] ?? $sources[$item['product_id']]['title'][$lang], 'description' => $spec, 'icon' => $data['icons'][$item['product_id']] ?? '', 'kind' => 'included'];
        }
        foreach ($b['optional'] as $item) {
            $rows[] = [
                'product_id' => $item['product_id'], 'quantity' => 1, 'title' => $item['label'][$lang], 'description' => '', 'icon' => $data['icons'][$item['product_id']] ?? '',
                'kind' => 'optional', 'operation' => $item['operation'], 'replaces_product_id' => $item['replaces_product_id'] ?? '',
            ];
        }
        $result = kubikart_kit_sanitize_contents_payload($rows, 'enquiry', $id);
        if (!$result['valid']) {
            WP_CLI::error("Contents of {$b['key']} ({$lang}) are invalid: " . implode(' | ', $result['errors']));
        }
        update_post_meta($id, '_kubikart_kit_contents', $result['payload']);
        foreach ($result['warnings'] as $warning) {
            WP_CLI::line("  note ({$b['key']}/{$lang}): {$warning}");
        }
        wc_delete_product_transients($id);
    }
    $snapshot['tags'] = array_merge($snapshot['tags'], $created_tags);
    WP_CLI::line(sprintf('bundle %s: de #%d, en #%d (draft until you publish; set the starting price first)', $b['key'], $bundle_ids[$b['key']]['de'], $bundle_ids[$b['key']]['en']));
}

// industry pages: ordered list of the actual bundle products of the page's language
foreach ($data['industries'] as $entry) {
    foreach ($langs as $lang) {
        $post = get_posts(['post_type' => 'business_industry', 'name' => $entry[$lang], 'post_status' => 'any', 'numberposts' => 1, 'suppress_filters' => true])[0];
        $ids = array_map(fn($key) => $bundle_ids[$key][$lang], $entry['bundles']);
        $validation = kubikart_industry_validate_relationships($ids, [], $lang);
        if (!$validation['valid']) {
            WP_CLI::error("Industry {$entry[$lang]}: " . implode(' | ', $validation['errors']));
        }
        $snapshot['industries'][$post->ID] = ['bundle_ids' => get_post_meta($post->ID, '_kubikart_bundle_ids', true) ?: []];
        update_post_meta($post->ID, '_kubikart_bundle_ids', $validation['bundle_ids']);
        delete_post_meta($post->ID, '_kubikart_featured_kit_id');
        WP_CLI::line("industry #{$post->ID} ({$entry[$lang]}): " . implode(', ', $validation['bundle_ids']));
    }
}

$snapshot_file = $backup_dir . '/business_bundles-snapshot-' . gmdate('Ymd-His') . '.json';
file_put_contents($snapshot_file, wp_json_encode($snapshot, JSON_PRETTY_PRINT));
WP_CLI::success('Done. Rollback: wp eval-file scripts/create-business-bundles.php rollback ' . $snapshot_file);
