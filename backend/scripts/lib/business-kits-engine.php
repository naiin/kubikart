<?php
/**
 * Engine for configure-business-kits.php: dry-run preview, apply with a
 * restorable snapshot, and rollback. Never run against production without a
 * database backup and a reviewed dry run.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/business-kit-images.php';

const KK_PRODUCT_META_KEYS = [
    '_regular_price', '_sale_price', '_price', '_manage_stock', '_stock_status', '_backorders', '_sold_individually',
    '_thumbnail_id', '_product_image_gallery', '_kubikart_kit_original_images',
    KUBIKART_PRODUCT_FIELDS_META_KEY, KUBIKART_KIT_CONTENTS_META_KEY, KUBIKART_KIT_SCOPE_SUMMARY_META_KEY, KUBIKART_KIT_ORDER_MODE_META_KEY,
    KUBIKART_PURCHASE_MODE_META_KEY, KUBIKART_SET_CONFIG_META_KEY,
];
const KK_INDUSTRY_META_KEYS = [KUBIKART_INDUSTRY_BUNDLES_META, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META];

function kk_is_bundle(array $kit): bool {
    return $kit['bundle'] ?? true;
}

function kk_target_set_config(array $kit, string $lang): string {
    if (empty($kit['set_config'])) {
        return '';
    }
    $config = $kit['set_config'];
    $options = $config['options'];
    ksort($options);
    return wp_json_encode(['field_id' => $config['field_id'], 'unit_label' => $config['unit_label'][$lang], 'options' => $options]);
}

function kk_current_set_config(int $id): string {
    $raw = get_post_meta($id, KUBIKART_SET_CONFIG_META_KEY, true);
    if (!is_array($raw) || !$raw) {
        return '';
    }
    $options = array_map('intval', (array) ($raw['options'] ?? []));
    ksort($options);
    return wp_json_encode(['field_id' => (string) ($raw['field_id'] ?? ''), 'unit_label' => (string) ($raw['unit_label'] ?? ''), 'options' => $options]);
}

function kk_norm(string $value): string {
    return trim(preg_replace('/\s+/', ' ', html_entity_decode(wp_strip_all_tags($value, false), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

function kk_find_de_product(string $slug): int {
    $found = get_posts(['post_type' => 'product', 'name' => $slug, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'suppress_filters' => true]);
    return $found ? (int) $found[0] : 0;
}

function kk_find_post_by_slug(string $slug, string $type): int {
    $found = get_posts(['post_type' => $type, 'name' => $slug, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'suppress_filters' => true]);
    return $found ? (int) $found[0] : 0;
}

function kk_images_for(string $key, array $kit, array $original): array {
    $assets = $GLOBALS['KK_ASSET_IDS'][$key] ?? [];
    if ($assets) {
        return ['image_id' => $assets[0], 'gallery' => array_slice($assets, 1)];
    }
    $selected = array_values(array_filter(array_map(fn($i) => $original[$i] ?? 0, $kit['images'])));
    return ['image_id' => $selected[0] ?? 0, 'gallery' => array_slice($selected, 1)];
}

function kk_target_items(string $key, array $kit, string $lang): array {
    $items = [];
    foreach ($kit['items'] as $index => $item) {
        $items[] = [
            'id' => $key . '-item-' . ($index + 1),
            'product_id' => 0,
            'variation_id' => 0,
            'quantity' => $item['qty'],
            'title' => $item['title'][$lang],
            'description' => $item['desc'][$lang],
            'image_id' => 0,
            'icon' => $item['icon'] ?? '',
        ];
    }
    return $items;
}

/** Normalised, comparable view of what the script manages for one product. */
function kk_target_state(string $key, array $kit, string $lang, array $original): array {
    $images = kk_images_for($key, $kit, $original);
    return [
        'title' => $kit['name'][$lang],
        'short_description' => $kit['short'][$lang],
        'description' => $kit['content'][$lang] . $kit['outro'][$lang],
        'regular_price' => $kit['price'],
        'sale_price' => '',
        'status' => $kit['status'] ?? 'publish',
        'catalog_visibility' => 'visible',
        'manage_stock' => false,
        'stock_status' => 'instock',
        'backorders' => 'no',
        'image_id' => $images['image_id'],
        'gallery' => implode(',', $images['gallery']),
        'personalisation_fields' => wp_json_encode(kk_build_fields($kit['fields'], $lang)),
        'contents' => wp_json_encode(kk_target_items($key, $kit, $lang)),
        'scope_summary' => $kit['summary'][$lang],
        'order_mode' => kk_is_bundle($kit) ? ($kit['mode'] ?? 'enquiry') : '',
        'purchase_mode' => $kit['mode'] ?? 'enquiry',
        'set_config' => kk_target_set_config($kit, $lang),
    ];
}

function kk_current_state(WC_Product $product): array {
    $id = $product->get_id();
    $fields = get_post_meta($id, KUBIKART_PRODUCT_FIELDS_META_KEY, true);
    $contents = kubikart_kit_get_items($id);
    foreach ($contents as &$item) {
        $item = array_intersect_key($item, array_flip(['id', 'product_id', 'variation_id', 'quantity', 'title', 'description', 'image_id', 'icon']));
    }
    unset($item);
    return [
        'title' => $product->get_name(),
        'short_description' => $product->get_short_description(),
        'description' => $product->get_description(),
        'regular_price' => (string) $product->get_regular_price(),
        'sale_price' => (string) $product->get_sale_price(),
        'status' => $product->get_status(),
        'catalog_visibility' => $product->get_catalog_visibility(),
        'manage_stock' => (bool) $product->get_manage_stock(),
        'stock_status' => $product->get_stock_status(),
        'backorders' => $product->get_backorders(),
        'image_id' => (int) $product->get_image_id(),
        'gallery' => implode(',', array_map('intval', $product->get_gallery_image_ids())),
        'personalisation_fields' => wp_json_encode(is_array($fields) ? ($fields['fields'] ?? []) : []),
        'contents' => wp_json_encode($contents),
        'scope_summary' => (string) get_post_meta($id, KUBIKART_KIT_SCOPE_SUMMARY_META_KEY, true),
        'order_mode' => (string) get_post_meta($id, KUBIKART_KIT_ORDER_MODE_META_KEY, true),
        'purchase_mode' => (string) get_post_meta($id, KUBIKART_PURCHASE_MODE_META_KEY, true),
        'set_config' => kk_current_set_config($id),
    ];
}

function kk_diff(array $current, array $target): array {
    $changes = [];
    foreach ($target as $field => $value) {
        $old = $current[$field] ?? null;
        $same = in_array($field, ['short_description', 'description', 'title'], true)
            ? kk_norm((string) $old) === kk_norm((string) $value)
            : (string) $old === (string) $value;
        if (!$same) {
            $changes[$field] = [$old, $value];
        }
    }
    return $changes;
}

function kk_preview($value): string {
    $text = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
    $text = kk_norm($text);
    return mb_strlen($text) > 60 ? mb_substr($text, 0, 57) . '…' : ($text === '' ? '(empty)' : $text);
}

function kk_snapshot_post(int $id): array {
    $post = get_post($id);
    $meta = [];
    $keys = $post->post_type === 'business_industry' ? KK_INDUSTRY_META_KEYS : ($post->post_type === 'attachment' ? array_merge(['_wp_attachment_image_alt', KK_ASSET_KEY_META, KK_ASSET_SHA_META], array_values(KK_ASSET_EN_META)) : ($post->post_type === 'product' ? KK_PRODUCT_META_KEYS : []));
    foreach ($keys as $key) {
        $meta[$key] = metadata_exists('post', $id, $key) ? ['exists' => true, 'value' => get_post_meta($id, $key, true)] : ['exists' => false];
    }
    return [
        'id' => $id,
        'type' => $post->post_type,
        'fields' => ['post_title' => $post->post_title, 'post_excerpt' => $post->post_excerpt, 'post_content' => $post->post_content, 'post_status' => $post->post_status],
        'meta' => $meta,
    ];
}

function kk_backup_dir(): string {
    return dirname(untrailingslashit(ABSPATH)) . '/backups';
}

/** Creates the German/English skeleton products of a new catalogue entry and links them as Polylang translations. */
function kk_create_product_pair(array $kit): array {
    $ids = [];
    foreach (['de', 'en'] as $lang) {
        $product = new WC_Product_Simple();
        $product->set_name($kit['name'][$lang]);
        $product->set_slug($lang === 'de' ? $kit['de_slug'] : $kit['en_slug']);
        $product->set_status('draft');
        $ids[$lang] = (int) $product->save();
        if (function_exists('pll_set_post_language')) {
            pll_set_post_language($ids[$lang], $lang);
        }
        $term_ids = [];
        foreach ((array) ($kit['categories'][$lang] ?? []) as $category_slug) {
            $term = get_term_by('slug', $category_slug, 'product_cat');
            if ($term) {
                $term_ids[] = (int) $term->term_id;
            }
        }
        if ($term_ids) {
            wp_set_object_terms($ids[$lang], $term_ids, 'product_cat');
        }
    }
    if (function_exists('pll_save_post_translations')) {
        pll_save_post_translations($ids);
    }
    return $ids;
}

/** Creates a category pair (German + English) once and links the translations. */
function kk_create_category_pair(array $def): array {
    $ids = [];
    foreach (['de', 'en'] as $lang) {
        $inserted = wp_insert_term($def['name'][$lang], 'product_cat', ['slug' => $def['slug'][$lang]]);
        if (is_wp_error($inserted)) {
            WP_CLI::error("Category {$def['slug'][$lang]}: " . $inserted->get_error_message());
        }
        $ids[$lang] = (int) $inserted['term_id'];
        if (function_exists('pll_set_term_language')) {
            pll_set_term_language($ids[$lang], $lang);
        }
    }
    if (function_exists('pll_save_term_translations')) {
        pll_save_term_translations($ids);
    }
    return $ids;
}

// ---------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------
$kk_mode = isset($args[0]) ? (string) $args[0] : 'dry-run';
if (!in_array($kk_mode, ['dry-run', 'apply', 'rollback'], true)) {
    WP_CLI::error("Unknown mode '{$kk_mode}'. Use: dry-run (default) | apply | rollback <snapshot.json>");
}

if ($kk_mode === 'rollback') {
    $file = $args[1] ?? '';
    if (!$file || !is_readable($file)) {
        WP_CLI::error('Provide the snapshot file written by a previous apply: rollback <path/to/snapshot.json>');
    }
    $snapshot = json_decode((string) file_get_contents($file), true);
    if (!is_array($snapshot) || empty($snapshot['posts'])) {
        WP_CLI::error('The snapshot file is not valid.');
    }
    foreach ($snapshot['posts'] as $entry) {
        wp_update_post(['ID' => $entry['id']] + $entry['fields']);
        foreach ($entry['meta'] as $meta_key => $meta) {
            if (!empty($meta['exists'])) {
                update_post_meta($entry['id'], $meta_key, $meta['value']);
            } else {
                delete_post_meta($entry['id'], $meta_key);
            }
        }
        if ($entry['type'] === 'product') {
            wc_delete_product_transients($entry['id']);
        }
        WP_CLI::line("restored {$entry['type']} #{$entry['id']}");
    }
    foreach ($snapshot['terms'] ?? [] as $term) {
        wp_update_term($term['term_id'], $term['taxonomy'], ['name' => $term['name']]);
        WP_CLI::line("restored term #{$term['term_id']}");
    }
    foreach ($snapshot['created_products'] ?? [] as $created_id) {
        wp_trash_post((int) $created_id);
        WP_CLI::line("moved product #{$created_id} (created by that run) to the trash");
    }
    if (!empty($snapshot['created_terms'])) {
        WP_CLI::line('Categories created by that run were kept: ' . implode(', ', $snapshot['created_terms']));
    }
    if (!empty($snapshot['created_attachments'])) {
        WP_CLI::line('Media imported by that run was kept (unused media is harmless): ' . implode(', ', $snapshot['created_attachments']));
        WP_CLI::line('To remove it too: wp post delete ' . implode(' ', $snapshot['created_attachments']) . ' --force');
    }
    WP_CLI::success('Rolled back to the snapshot.');
    return;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------
$kk_reset_industries = ($args[2] ?? '') === 'reset-industries';
$kk_append_industries = ($args[2] ?? '') === 'append-industry-products';
$GLOBALS['KIT_IMAGES'] = $KIT_IMAGES;
$kk_image_source = isset($args[1]) && $args[1] !== '' ? (string) $args[1] : (getenv('KUBIKART_KIT_IMAGES_DIR') ?: null);
if ($kk_image_source !== null && !is_dir($kk_image_source)) {
    WP_CLI::error("Image source directory not found: {$kk_image_source}");
}
$plan = ['products' => [], 'terms' => [], 'industries' => [], 'assets' => [], 'categories_new' => []];
$snapshot = ['created_at' => gmdate('c'), 'posts' => [], 'terms' => [], 'created_attachments' => [], 'created_products' => [], 'created_terms' => []];

foreach ($KITS as $key => $kit) {
    $de_id = kk_find_de_product($kit['de_slug']);
    foreach ($kit['legacy_de_slugs'] ?? [] as $legacy_slug) {
        $de_id = $de_id ?: kk_find_de_product($legacy_slug);
    }
    $creating = false;
    if (!$de_id) {
        if (empty($kit['create'])) {
            WP_CLI::warning("Kit {$key}: German product with slug {$kit['de_slug']} not found; skipped.");
            continue;
        }
        $creating = true;
        $targets = ['de' => 0, 'en' => 0];
    } else {
        $translations = function_exists('pll_get_post_translations') ? pll_get_post_translations($de_id) : [];
        $targets = ['de' => $de_id];
        if (!empty($translations['en'])) {
            $targets['en'] = (int) $translations['en'];
        } else {
            WP_CLI::warning("Kit {$key}: no English translation is linked to the German product; only German is processed.");
        }
    }

    $plan['assets'] = array_merge($plan['assets'], kk_plan_kit_assets($key, $kit, $kk_image_source));
    foreach ($targets as $lang => $id) {
        $product = $id ? wc_get_product($id) : null;
        if ($id && !$product) {
            continue;
        }
        $original = $product && metadata_exists('post', $id, '_kubikart_kit_original_images')
            ? array_map('intval', (array) get_post_meta($id, '_kubikart_kit_original_images', true))
            : ($product ? array_values(array_filter(array_merge([(int) $product->get_image_id()], array_map('intval', $product->get_gallery_image_ids())))) : []);
        $target = kk_target_state($key, $kit, $lang, $original);
        $changes = kk_diff($product ? kk_current_state($product) : array_fill_keys(array_keys($target), null), $target);
        // Catalogue products flagged `create` are only CREATED here. Once they exist the owner edits
        // them in WordPress (title, texts, options, images, price); the script never overwrites that.
        $create_only = !$creating && !empty($kit['create']);
        $retire = [];
        if ($create_only) {
            // The one thing enforced on an existing catalogue product: retired option fields are removed.
            $saved_fields = get_post_meta($id, KUBIKART_PRODUCT_FIELDS_META_KEY, true);
            foreach (is_array($saved_fields) ? ($saved_fields['fields'] ?? []) : [] as $saved_field) {
                if (in_array($saved_field['id'] ?? '', $kit['retired_fields'] ?? [], true)) {
                    $retire[] = $saved_field['id'];
                }
            }
            $changes = $retire ? ['retired_fields' => [implode(', ', $retire), '(removed)']] : [];
        }
        $plan['products'][] = compact('key', 'kit', 'lang', 'id', 'target', 'changes', 'original', 'creating', 'create_only', 'retire');
    }
}

foreach ($CATEGORIES_TO_CREATE as $def) {
    if (!get_term_by('slug', $def['slug']['de'], 'product_cat') || !get_term_by('slug', $def['slug']['en'], 'product_cat')) {
        $plan['categories_new'][] = $def;
    }
}
foreach ($CATEGORY_NAMES as $slug => $name) {
    $term = get_term_by('slug', $slug, 'product_cat');
    if ($term && $term->name !== $name) {
        $plan['terms'][] = ['term_id' => $term->term_id, 'slug' => $slug, 'old' => $term->name, 'new' => $name];
    }
}

foreach ($INDUSTRIES as $slug => $def) {
    $id = kk_find_post_by_slug($slug, 'business_industry');
    if (!$id) {
        WP_CLI::warning("Industry {$slug} not found; skipped.");
        continue;
    }
    $post = get_post($id);
    $new = ['post_title' => $post->post_title, 'post_excerpt' => $post->post_excerpt, 'post_content' => $post->post_content];
    foreach (['post_title', 'post_excerpt'] as $field) {
        if (isset($def[$field])) {
            $new[$field] = $def[$field];
        }
    }
    foreach ($def['replace'] ?? [] as $from => $to) {
        $new['post_content'] = str_replace($from, $to, $new['post_content']);
    }
    if (!empty($def['append']) && strpos(kk_norm($new['post_content']), $def['append_marker']) === false) {
        $new['post_content'] .= $def['append'];
    }
    $changes = [];
    foreach ($new as $field => $value) {
        if (kk_norm($value) !== kk_norm($post->$field)) {
            $changes[$field] = [$post->$field, $value];
        }
    }
    $plan['industries'][] = ['id' => $id, 'slug' => $slug, 'new' => $new, 'changes' => $changes];
}

// Industry relationships: the editor-managed lists are only INITIALISED here.
// A list that already exists (even an empty one, which is a deliberate choice)
// is never replaced unless the explicit `reset-industries` argument is given.
function kk_product_id_map(array $plan_products): array {
    $map = [];
    foreach ($plan_products as $entry) {
        $map[$entry['key']][$entry['lang']] = $entry['id'];
    }
    return $map;
}

function kk_industry_ids(array $keys, string $lang, array $map, bool &$pending): array {
    $ids = [];
    foreach ($keys as $product_key) {
        $product_id = (int) ($map[$product_key][$lang] ?? 0);
        if (!$product_id) {
            $pending = true;
            continue;
        }
        if (!in_array($product_id, $ids, true)) {
            $ids[] = $product_id;
        }
    }
    return $ids;
}

/** @return array{0: ?array, 1: ?array, 2: bool} bundle list to write, product list to write (null = leave), pending */
function kk_industry_targets(array $entry, array $map, bool $reset, bool $append = false): array {
    $pending = false;
    $bundles = null;
    $products = null;
    if ($reset || !$entry['bundles_saved']) {
        $bundles = kk_industry_ids($entry['defaults']['bundles'], $entry['lang'], $map, $pending);
    }
    if ($reset || !$entry['products_saved']) {
        $products = kk_industry_ids($entry['defaults']['products'], $entry['lang'], $map, $pending);
    } elseif ($append) {
        // Add-only: keep the curated order, append defaults that are missing.
        $missing = array_values(array_diff(kk_industry_ids($entry['defaults']['products'], $entry['lang'], $map, $pending), $entry['current_products']));
        $products = ($missing || $pending) ? array_merge($entry['current_products'], $missing) : null;
    }
    return [$bundles, $products, $pending];
}

$plan['industry_links'] = [];
$product_id_map = kk_product_id_map($plan['products']);
foreach ($INDUSTRY_PRODUCTS as $de_slug => $defaults) {
    $de_id = kk_find_post_by_slug($de_slug, 'business_industry');
    if (!$de_id) {
        WP_CLI::warning("Industry {$de_slug} not found; relations skipped.");
        continue;
    }
    $translations = function_exists('pll_get_post_translations') ? pll_get_post_translations($de_id) : [];
    foreach (array_filter(['de' => $de_id, 'en' => (int) ($translations['en'] ?? 0)]) as $lang => $industry_id) {
        $entry = [
            'id' => $industry_id, 'slug' => get_post_field('post_name', $industry_id), 'lang' => $lang, 'defaults' => $defaults,
            'bundles_saved' => metadata_exists('post', $industry_id, KUBIKART_INDUSTRY_BUNDLES_META),
            'products_saved' => metadata_exists('post', $industry_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META),
            'current_bundles' => array_values(array_map('intval', (array) get_post_meta($industry_id, KUBIKART_INDUSTRY_BUNDLES_META, true))),
            'current_products' => array_values(array_map('intval', (array) get_post_meta($industry_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true))),
        ];
        [$bundles, $products, $pending] = kk_industry_targets($entry, $product_id_map, $kk_reset_industries, $kk_append_industries);
        $entry['changed'] = ($bundles !== null && ($pending || $bundles !== $entry['current_bundles'] || !$entry['bundles_saved']))
            || ($products !== null && ($pending || $products !== $entry['current_products'] || !$entry['products_saved']));
        $plan['industry_links'][] = $entry;
    }
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------
$total_changes = 0;
foreach ($plan['products'] as $entry) {
    $count = count($entry['changes']);
    $total_changes += $count;
    if ($entry['creating']) {
        WP_CLI::line(sprintf('product [%s/%s] NEW %s: will be created (%d field(s))', $entry['key'], $entry['lang'], $entry['lang'] === 'de' ? $entry['kit']['de_slug'] : $entry['kit']['en_slug'], $count));
        continue;
    }
    WP_CLI::line(sprintf('product [%s/%s] #%d %s: %s', $entry['key'], $entry['lang'], $entry['id'], get_post_field('post_name', $entry['id']), $entry['create_only'] ? ($entry['retire'] ? 'exists - will remove retired option field(s): ' . implode(', ', $entry['retire']) . ' (everything else left as edited in WordPress)' : 'exists - left as edited in WordPress (create-only)') : ($count ? $count . ' field(s) differ' : 'up to date')));
    foreach ($entry['changes'] as $field => [$old, $new]) {
        WP_CLI::line(sprintf('    %s: %s -> %s', $field, kk_preview($old), kk_preview($new)));
    }
}
foreach ($plan['assets'] as $entry) {
    if ($entry['action'] === 'none') {
        continue;
    }
    $total_changes++;
    $detail = $entry['action'] === 'update' ? ' (' . implode(', ', array_keys($entry['changes'])) . ')' : ' from ' . $entry['asset']['file'];
    WP_CLI::line(sprintf('media [%s]: %s%s', $entry['asset_key'], $entry['action'], $detail));
}
foreach ($KIT_IMAGES as $kit_key => $assets) {
    foreach ($assets as $asset) {
        if ($asset['status'] === 'reject') {
            WP_CLI::line(sprintf('media [%s/%s]: not imported - %s', $kit_key, $asset['role'], $asset['reason']));
        }
    }
}
foreach ($plan['categories_new'] as $def) {
    $total_changes++;
    WP_CLI::line(sprintf('category NEW %s / %s: will be created', $def['slug']['de'], $def['slug']['en']));
}
foreach ($plan['terms'] as $term) {
    $total_changes++;
    WP_CLI::line(sprintf('category #%d (%s): "%s" -> "%s"', $term['term_id'], $term['slug'], $term['old'], $term['new']));
}
foreach ($plan['industries'] as $entry) {
    $count = count($entry['changes']);
    $total_changes += $count;
    WP_CLI::line(sprintf('industry #%d %s: %s', $entry['id'], $entry['slug'], $count ? implode(', ', array_keys($entry['changes'])) . ' differ' : 'up to date'));
}
foreach ($plan['industry_links'] as $entry) {
    if ($entry['changed']) {
        $total_changes++;
    }
    WP_CLI::line(sprintf(
        'industry relations #%d %s: %s',
        $entry['id'],
        $entry['slug'],
        $entry['changed']
            ? ($kk_reset_industries ? 'REPLACE with defaults (bundles: ' . implode(', ', $entry['defaults']['bundles']) . ' | products: ' . implode(', ', $entry['defaults']['products']) . ')' : 'initialise missing list(s)')
            : 'left as curated in the editor'
    ));
}
WP_CLI::line('Fields written by this script on kits: title, short/long description, regular price (sale price cleared), stock mode, status/visibility, images, personalisation fields, kit contents, scope summary, order mode. Media: one WebP per accepted image (shared by the German and English product, English texts kept as media meta) is imported once (identified by asset key and original checksum; the original PNG files are never modified) and titles, alt text and captions are kept in sync. Industry relation lists are only initialised when missing (replaced only with `reset-industries`). Purchase mode (enquiry/purchase) and, for sold-in-sets products, the set configuration are written on every product it manages. New catalogue products and their categories are created if missing. Nothing else on the products is touched. Also: the German Business-Pakete category name and the listed industry texts.');

if ($kk_mode === 'dry-run') {
    WP_CLI::success($total_changes ? "Dry run: {$total_changes} difference(s). Re-run with `apply` after taking a database backup." : 'Dry run: everything is already up to date.');
    return;
}

// ---------------------------------------------------------------------------
// Apply (snapshot first)
// ---------------------------------------------------------------------------
if ($total_changes === 0) {
    WP_CLI::success('Nothing to apply; everything is already up to date.');
    return;
}

$problems = kk_verify_asset_sources($plan['assets']);
if ($problems) {
    WP_CLI::error("Image sources are not usable; nothing was changed:\n  " . implode("\n  ", $problems) . "\nPass the reviewed image folder: apply <images-dir> (or set KUBIKART_KIT_IMAGES_DIR).");
}
foreach ($plan['products'] as $entry) {
    if ($entry['id']) {
        $snapshot['posts'][] = kk_snapshot_post($entry['id']);
    }
}
foreach ($plan['industry_links'] as $entry) {
    if ($entry['changed']) {
        $snapshot['posts'][] = kk_snapshot_post($entry['id']);
    }
}
foreach ($plan['assets'] as $entry) {
    if ($entry['action'] === 'update') {
        $snapshot['posts'][] = kk_snapshot_post($entry['existing_id']);
    }
}
foreach ($plan['industries'] as $entry) {
    $snapshot['posts'][] = kk_snapshot_post($entry['id']);
}
foreach ($plan['terms'] as $term) {
    $snapshot['terms'][] = ['term_id' => $term['term_id'], 'taxonomy' => 'product_cat', 'name' => $term['old']];
}
$dir = kk_backup_dir();
if (!is_dir($dir) || !is_writable($dir)) {
    WP_CLI::error("Cannot write the rollback snapshot: {$dir} is not a writable directory. Nothing was changed.");
}
$snapshot_file = $dir . '/kit-config-snapshot-' . gmdate('Ymd-His') . '.json';
if (file_put_contents($snapshot_file, wp_json_encode($snapshot, JSON_UNESCAPED_UNICODE)) === false) {
    WP_CLI::error('Could not write the rollback snapshot. Nothing was changed.');
}
WP_CLI::line('snapshot written: ' . $snapshot_file . ' (restore with: rollback <that file>)');

foreach ($plan['categories_new'] as $def) {
    $created_terms = kk_create_category_pair($def);
    $snapshot['created_terms'] = array_merge($snapshot['created_terms'], array_values($created_terms));
    WP_CLI::line("created category {$def['slug']['de']} / {$def['slug']['en']}");
}
$created_pairs = [];
foreach ($plan['products'] as $index => $entry) {
    if (!$entry['creating']) {
        continue;
    }
    if (!isset($created_pairs[$entry['key']])) {
        $created_pairs[$entry['key']] = kk_create_product_pair($entry['kit']);
        $snapshot['created_products'] = array_merge($snapshot['created_products'], array_values($created_pairs[$entry['key']]));
        WP_CLI::line("created product pair {$entry['key']}");
    }
    $plan['products'][$index]['id'] = $created_pairs[$entry['key']][$entry['lang']];
}
file_put_contents($snapshot_file, wp_json_encode($snapshot, JSON_UNESCAPED_UNICODE));

foreach ($plan['assets'] as $entry) {
    if ($entry['action'] === 'update') {
        kk_update_asset_texts($entry['existing_id'], $entry['texts']);
        WP_CLI::line("updated media text {$entry['asset_key']}");
        continue;
    }
    if (!in_array($entry['action'], ['import', 'replace'], true)) {
        continue;
    }
    if ($entry['action'] === 'replace') {
        $old = kk_find_asset($entry['asset_key']);
        $snapshot['posts'][] = kk_snapshot_post($old);
        update_post_meta($old, KK_ASSET_KEY_META . '_superseded', $entry['asset_key']);
        delete_post_meta($old, KK_ASSET_KEY_META);
    }
    $new_id = kk_import_asset($entry);
    $snapshot['created_attachments'][] = $new_id;
    $GLOBALS['KK_ASSET_IDS'][$entry['kit_key']] = array_map(fn($v) => $v === 'import:' . $entry['asset']['role'] ? $new_id : $v, $GLOBALS['KK_ASSET_IDS'][$entry['kit_key']]);
    WP_CLI::line("imported media {$entry['asset_key']} as #{$new_id}");
}
file_put_contents($snapshot_file, wp_json_encode($snapshot, JSON_UNESCAPED_UNICODE));

foreach ($plan['products'] as $entry) {
    if (!$entry['changes']) {
        continue;
    }
    $id = $entry['id'];
    $t = $entry['target'];
    if ($entry['create_only']) {
        $saved_fields = get_post_meta($id, KUBIKART_PRODUCT_FIELDS_META_KEY, true);
        $saved_fields['fields'] = array_values(array_filter($saved_fields['fields'] ?? [], fn($f) => !in_array($f['id'] ?? '', $entry['retire'], true)));
        update_post_meta($id, KUBIKART_PRODUCT_FIELDS_META_KEY, $saved_fields);
        WP_CLI::line("removed retired option field(s) from product #{$id}: " . implode(', ', $entry['retire']));
        continue;
    }
    if (kk_is_bundle($entry['kit']) && !metadata_exists('post', $id, '_kubikart_kit_original_images')) {
        update_post_meta($id, '_kubikart_kit_original_images', $entry['original']);
    }
    $product = wc_get_product($id);
    $product->set_name($t['title']);
    $product->set_short_description($t['short_description']);
    $product->set_description($t['description']);
    $product->set_regular_price($t['regular_price']);
    $product->set_sale_price('');
    $product->set_status($t['status']);
    $product->set_catalog_visibility($t['catalog_visibility']);
    $product->set_manage_stock(false);
    $product->set_stock_status($t['stock_status']);
    $product->set_backorders($t['backorders']);
    $product->set_sold_individually(false);
    $images = kk_images_for($entry['key'], $entry['kit'], $entry['original']);
    $product->set_image_id($images['image_id']);
    $product->set_gallery_image_ids($images['gallery']);
    $product->save();

    update_post_meta($id, KUBIKART_PRODUCT_FIELDS_META_KEY, [
        'schema_version' => KUBIKART_PRODUCT_FIELDS_SCHEMA_VERSION,
        'fields' => kk_build_fields($entry['kit']['fields'], $entry['lang']),
    ]);
    if (kk_is_bundle($entry['kit'])) {
        update_post_meta($id, KUBIKART_KIT_CONTENTS_META_KEY, ['schema_version' => 1, 'items' => kk_target_items($entry['key'], $entry['kit'], $entry['lang'])]);
        update_post_meta($id, KUBIKART_KIT_SCOPE_SUMMARY_META_KEY, $t['scope_summary']);
        update_post_meta($id, KUBIKART_KIT_ORDER_MODE_META_KEY, $t['order_mode']);
    }
    update_post_meta($id, KUBIKART_PURCHASE_MODE_META_KEY, $t['purchase_mode']);
    if (!empty($entry['kit']['set_config'])) {
        $set = $entry['kit']['set_config'];
        update_post_meta($id, KUBIKART_SET_CONFIG_META_KEY, ['field_id' => $set['field_id'], 'unit_label' => $set['unit_label'][$entry['lang']], 'options' => $set['options']]);
    } else {
        delete_post_meta($id, KUBIKART_SET_CONFIG_META_KEY);
    }
    if (function_exists('kubikart_revalidate_product_fields')) {
        kubikart_revalidate_product_fields($id);
    }
    WP_CLI::line("applied product #{$id}");
}
foreach ($plan['terms'] as $term) {
    wp_update_term($term['term_id'], 'product_cat', ['name' => $term['new']]);
    WP_CLI::line("applied category #{$term['term_id']}");
}
foreach ($plan['industries'] as $entry) {
    if (!$entry['changes']) {
        continue;
    }
    wp_update_post(['ID' => $entry['id']] + $entry['new']);
    WP_CLI::line("applied industry #{$entry['id']}");
}
$product_id_map = kk_product_id_map($plan['products']);
foreach ($plan['industry_links'] as $entry) {
    if (!$entry['changed']) {
        continue;
    }
    [$bundles, $products] = kk_industry_targets($entry, $product_id_map, $kk_reset_industries, $kk_append_industries);
    if ($bundles !== null) {
        update_post_meta($entry['id'], KUBIKART_INDUSTRY_BUNDLES_META, $bundles);
    }
    if ($products !== null) {
        update_post_meta($entry['id'], KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, $products);
    }
    if (function_exists('kubikart_revalidate_business_industry')) {
        kubikart_revalidate_business_industry($entry['id'], 'updated');
    }
    WP_CLI::line("applied industry relations #{$entry['id']}: bundles " . json_encode($bundles) . ' products ' . json_encode($products));
}
WP_CLI::success('Business Kits configured. Keep the snapshot until the result has been checked on the site.');
