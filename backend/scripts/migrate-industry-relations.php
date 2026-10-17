<?php
/**
 * Migrates the industry relationships from the old structure (one "featured
 * kit" plus a mixed "related products" list) to the editor's two ordered lists:
 *
 *   _kubikart_bundle_ids           Business Bundles, in display order
 *   _kubikart_related_product_ids  individual products only, in display order
 *
 * Usage (backend folder; `lando wp` or, in the container, `wp --allow-root`):
 *   wp eval-file scripts/migrate-industry-relations.php                  # dry run (default)
 *   wp eval-file scripts/migrate-industry-relations.php apply            # snapshot first, then write
 *   wp eval-file scripts/migrate-industry-relations.php rollback <file>  # restore a snapshot
 *
 * Rules: the legacy featured bundle comes first (once), followed by the bundle
 * entries of the old mixed list in their order; everything else stays in the
 * product list; duplicates are removed keeping the first position; every ID is
 * mapped to the translation in the industry's own language (kept with a
 * warning if no translation exists). An already migrated industry is left
 * untouched, so the script is safe to repeat. Only the two relationship fields
 * and the retired featured field are written; no industry content changes.
 * Take a database backup before running this anywhere but local development.
 */

if (!defined('ABSPATH')) {
    exit;
}

$mode = isset($args[0]) ? (string) $args[0] : 'dry-run';
if (!in_array($mode, ['dry-run', 'apply', 'rollback'], true)) {
    WP_CLI::error("Unknown mode '{$mode}'. Use: dry-run (default) | apply | rollback <snapshot.json>");
}

$meta_keys = [KUBIKART_INDUSTRY_BUNDLES_META, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, KUBIKART_INDUSTRY_FEATURED_KIT_META];
$backup_dir = dirname(untrailingslashit(ABSPATH)) . '/backups';

if ($mode === 'rollback') {
    $file = $args[1] ?? '';
    if (!$file || !is_readable($file)) {
        WP_CLI::error('Provide the snapshot written by a previous apply: rollback <path/to/snapshot.json>');
    }
    $snapshot = json_decode((string) file_get_contents($file), true);
    if (!is_array($snapshot) || empty($snapshot['industries'])) {
        WP_CLI::error('The snapshot file is not valid.');
    }
    foreach ($snapshot['industries'] as $industry_id => $meta) {
        foreach ($meta as $key => $entry) {
            if (!empty($entry['exists'])) {
                update_post_meta((int) $industry_id, $key, $entry['value']);
            } else {
                delete_post_meta((int) $industry_id, $key);
            }
        }
        if (function_exists('kubikart_revalidate_business_industry')) {
            kubikart_revalidate_business_industry((int) $industry_id, 'updated');
        }
        WP_CLI::line("restored industry #{$industry_id}");
    }
    WP_CLI::success('Industry relationships restored from the snapshot.');
    return;
}

function kmir_is_bundle(int $product_id): bool {
    foreach (['business-kits-de', 'business-kits'] as $slug) {
        if (has_term($slug, 'product_cat', $product_id)) {
            return true;
        }
    }
    return false;
}

/** Translation of a product in the industry's language; the original (and a warning) if none exists. */
function kmir_map(int $product_id, string $lang, array &$warnings): int {
    if (!$lang || !function_exists('pll_get_post') || !function_exists('pll_get_post_language')) {
        return $product_id;
    }
    if (pll_get_post_language($product_id) === $lang) {
        return $product_id;
    }
    $translated = (int) pll_get_post($product_id, $lang);
    if ($translated) {
        return $translated;
    }
    $warnings[] = "product #{$product_id} has no {$lang} translation; kept as saved";
    return $product_id;
}

function kmir_unique(array $ids): array {
    return array_values(array_unique(array_filter(array_map('intval', $ids))));
}

$plan = [];
$industries = get_posts(['post_type' => 'business_industry', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true]);
foreach ($industries as $industry_id) {
    $industry_id = (int) $industry_id;
    $lang = function_exists('pll_get_post_language') ? (string) pll_get_post_language($industry_id) : '';
    $warnings = [];

    $bundles_saved = metadata_exists('post', $industry_id, KUBIKART_INDUSTRY_BUNDLES_META);
    $existing_bundles = $bundles_saved ? kmir_unique((array) get_post_meta($industry_id, KUBIKART_INDUSTRY_BUNDLES_META, true)) : [];
    $old_related = kmir_unique((array) get_post_meta($industry_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, true));
    $legacy_featured = (int) get_post_meta($industry_id, KUBIKART_INDUSTRY_FEATURED_KIT_META, true);
    $has_featured_meta = metadata_exists('post', $industry_id, KUBIKART_INDUSTRY_FEATURED_KIT_META);

    $legacy_bundles = $legacy_featured ? [kmir_map($legacy_featured, $lang, $warnings)] : [];
    $products = [];
    foreach ($old_related as $product_id) {
        $mapped = kmir_map($product_id, $lang, $warnings);
        if (kmir_is_bundle($mapped) || kmir_is_bundle($product_id)) {
            $legacy_bundles[] = $mapped;
        } else {
            $products[] = $mapped;
        }
    }

    $new_bundles = kmir_unique(array_merge($existing_bundles, $legacy_bundles));
    $new_products = kmir_unique($products);
    $write_bundles = $legacy_bundles || $bundles_saved ? $new_bundles : null;
    $changed = $has_featured_meta
        || ($write_bundles !== null && $write_bundles !== $existing_bundles)
        || $new_products !== $old_related
        || ($write_bundles !== null && !$bundles_saved);

    $plan[$industry_id] = compact('lang', 'existing_bundles', 'old_related', 'legacy_featured', 'write_bundles', 'new_products', 'changed', 'warnings');
    WP_CLI::line(sprintf(
        'industry #%d %s [%s] %s',
        $industry_id,
        get_post_field('post_name', $industry_id),
        $lang ?: '-',
        $changed
            ? sprintf('bundles %s -> %s | products %s -> %s%s', json_encode($existing_bundles), json_encode($write_bundles ?? $existing_bundles), json_encode($old_related), json_encode($new_products), $legacy_featured ? " | featured {$legacy_featured} moved" : '')
            : 'already migrated'
    ));
    foreach ($warnings as $warning) {
        WP_CLI::warning("industry #{$industry_id}: {$warning}");
    }
}

$changes = count(array_filter(array_column($plan, 'changed')));
if ($mode === 'dry-run') {
    WP_CLI::success($changes ? "Dry run: {$changes} industr" . ($changes === 1 ? 'y' : 'ies') . ' would change. Re-run with `apply` after a database backup.' : 'Dry run: nothing to migrate.');
    return;
}
if ($changes === 0) {
    WP_CLI::success('Nothing to migrate.');
    return;
}

if (!is_dir($backup_dir) || !is_writable($backup_dir)) {
    WP_CLI::error("Cannot write the snapshot: {$backup_dir} is not a writable directory. Nothing was changed.");
}
$snapshot = ['created_at' => gmdate('c'), 'industries' => []];
foreach ($plan as $industry_id => $entry) {
    if (!$entry['changed']) {
        continue;
    }
    foreach ($meta_keys as $key) {
        $snapshot['industries'][$industry_id][$key] = metadata_exists('post', $industry_id, $key)
            ? ['exists' => true, 'value' => get_post_meta($industry_id, $key, true)]
            : ['exists' => false];
    }
}
$snapshot_file = $backup_dir . '/industry-relations-snapshot-' . gmdate('Ymd-His') . '.json';
if (file_put_contents($snapshot_file, wp_json_encode($snapshot)) === false) {
    WP_CLI::error('Could not write the snapshot. Nothing was changed.');
}
WP_CLI::line("snapshot written: {$snapshot_file} (restore with: rollback <that file>)");

foreach ($plan as $industry_id => $entry) {
    if (!$entry['changed']) {
        continue;
    }
    if ($entry['write_bundles'] !== null) {
        update_post_meta($industry_id, KUBIKART_INDUSTRY_BUNDLES_META, $entry['write_bundles']);
    }
    update_post_meta($industry_id, KUBIKART_INDUSTRY_RELATED_PRODUCTS_META, $entry['new_products']);
    delete_post_meta($industry_id, KUBIKART_INDUSTRY_FEATURED_KIT_META);
    if (function_exists('kubikart_revalidate_business_industry')) {
        kubikart_revalidate_business_industry($industry_id, 'updated');
    }
    WP_CLI::line("migrated industry #{$industry_id}");
}
WP_CLI::success('Industry relationships migrated. Keep the snapshot until the result has been checked.');
