<?php
/**
 * Image import helpers for configure-business-kits.php.
 *
 * Assets are identified by `_kubikart_asset_key` (business-kit/<kit>/<role>)
 * and `_kubikart_asset_sha256` (hash of the original file), never by numeric ID,
 * so reruns reuse attachments and other environments resolve their own IDs.
 *
 * One attachment is shared by the German and English product: Polylang
 * synchronises featured image and gallery between translations, so separate
 * per-language attachments would be overwritten on the next product save. The
 * German text is the attachment's own title/alt/caption; the English text is
 * kept in `_kubikart_text_en_*` meta and served by the
 * kubikart-localised-media-text mu-plugin for English products.
 */

if (!defined('ABSPATH')) {
    exit;
}

const KK_ASSET_KEY_META = '_kubikart_asset_key';
const KK_ASSET_SHA_META = '_kubikart_asset_sha256';
const KK_ASSET_EN_META = ['title' => '_kubikart_text_en_title', 'alt' => '_kubikart_text_en_alt', 'caption' => '_kubikart_text_en_caption'];

/* "kit" => ordered attachment IDs (or "import:<role>" until imported). A real global: wp eval-file runs scripts inside a function scope. */
$GLOBALS['KK_ASSET_IDS'] = [];

function kk_asset_key(string $kit, string $role): string {
    return "business-kit/{$kit}/{$role}";
}

function kk_find_asset(string $key): int {
    $found = get_posts([
        'post_type' => 'attachment', 'post_status' => 'inherit', 'numberposts' => 1, 'fields' => 'ids',
        'suppress_filters' => true, 'meta_key' => KK_ASSET_KEY_META, 'meta_value' => $key,
    ]);
    return $found ? (int) $found[0] : 0;
}

/** Target texts keyed by field, each with a 'de' (attachment) and 'en' (meta) value. */
function kk_asset_texts(array $kit, array $asset): array {
    $title = fn(string $lang) => $kit['name'][$lang] . ' – ' . $asset['view'][$lang] . ' (' . ($lang === 'de' ? 'Gestaltungsbeispiel' : 'design example') . ')';
    return [
        'title' => ['de' => $title('de'), 'en' => $title('en')],
        'alt' => $asset['alt'],
        'caption' => $asset['caption'],
    ];
}

function kk_asset_basename(array $kit, array $asset): string {
    $base = preg_replace('/-de$/', '', $kit['de_slug']);
    return sanitize_title($base . '-' . preg_replace('/^\d+-/', '', $asset['role']));
}

function kk_asset_current_texts(int $id): array {
    $post = get_post($id);
    $de = ['title' => (string) $post->post_title, 'alt' => (string) get_post_meta($id, '_wp_attachment_image_alt', true), 'caption' => (string) $post->post_excerpt];
    $current = [];
    foreach ($de as $field => $value) {
        $current[$field] = ['de' => $value, 'en' => (string) get_post_meta($id, KK_ASSET_EN_META[$field], true)];
    }
    return $current;
}

/** Registers the ordered image list for one kit (shared by DE and EN) and returns the planned asset actions. */
function kk_plan_kit_assets(string $key, array $kit, ?string $source): array {
    $actions = [];
    $ids = [];
    foreach ($GLOBALS['KIT_IMAGES'][$key] ?? [] as $asset) {
        if ($asset['status'] !== 'accept') {
            continue;
        }
        $asset_key = kk_asset_key($key, $asset['role']);
        $texts = kk_asset_texts($kit, $asset);
        $id = kk_find_asset($asset_key);
        $action = 'import';
        $changes = [];

        if ($id) {
            if ((string) get_post_meta($id, KK_ASSET_SHA_META, true) !== $asset['sha256']) {
                $action = 'replace';
                $id = 0;
            } else {
                $action = 'none';
                foreach (kk_asset_current_texts($id) as $field => $old) {
                    foreach (['de', 'en'] as $lang) {
                        if (kk_norm($old[$lang]) !== kk_norm($texts[$field][$lang])) {
                            $changes["{$field}_{$lang}"] = [$old[$lang], $texts[$field][$lang]];
                            $action = 'update';
                        }
                    }
                }
            }
        }

        $ids[] = $id ?: 'import:' . $asset['role'];
        $actions[] = [
            'kit_key' => $key, 'kit' => $kit, 'asset' => $asset, 'asset_key' => $asset_key,
            'existing_id' => $id, 'action' => $action, 'texts' => $texts, 'changes' => $changes,
            'source_file' => $source ? rtrim($source, '/') . '/' . $asset['file'] : null,
        ];
    }
    if ($ids) {
        $GLOBALS['KK_ASSET_IDS'][$key] = $ids;
    }
    return $actions;
}

/** Verifies that every file needed for imports is present and is exactly the reviewed original. */
function kk_verify_asset_sources(array $assets): array {
    $problems = [];
    foreach ($assets as $entry) {
        if (!in_array($entry['action'], ['import', 'replace'], true)) {
            continue;
        }
        $file = $entry['source_file'];
        if (!$file || !is_readable($file)) {
            $problems[] = "{$entry['asset_key']}: source file not readable (" . ($file ?: 'no image source directory given') . ')';
        } elseif (hash_file('sha256', $file) !== $entry['asset']['sha256']) {
            $problems[] = "{$entry['asset_key']}: {$entry['asset']['file']} does not match the reviewed checksum";
        }
    }
    return array_values(array_unique($problems));
}

function kk_update_asset_texts(int $id, array $texts): void {
    wp_update_post(['ID' => $id, 'post_title' => $texts['title']['de'], 'post_excerpt' => $texts['caption']['de']]);
    update_post_meta($id, '_wp_attachment_image_alt', $texts['alt']['de']);
    foreach (KK_ASSET_EN_META as $field => $meta_key) {
        update_post_meta($id, $meta_key, $texts[$field]['en']);
    }
}

/** Imports one asset (WebP derived from the untouched original) and returns the new attachment ID. */
function kk_import_asset(array $entry): int {
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';

    $basename = kk_asset_basename($entry['kit'], $entry['asset']);
    $editor = wp_get_image_editor($entry['source_file']);
    if (is_wp_error($editor)) {
        WP_CLI::error("{$entry['asset_key']}: " . $editor->get_error_message());
    }
    $editor->set_quality(86);
    $saved = $editor->save(trailingslashit(get_temp_dir()) . $basename . '.webp', 'image/webp');
    if (is_wp_error($saved)) {
        WP_CLI::error("{$entry['asset_key']}: WebP conversion failed: " . $saved->get_error_message());
    }

    $id = media_handle_sideload(
        ['name' => $basename . '.webp', 'tmp_name' => $saved['path']],
        0,
        null,
        ['post_title' => $entry['texts']['title']['de'], 'post_excerpt' => $entry['texts']['caption']['de']]
    );
    if (is_wp_error($id)) {
        @unlink($saved['path']);
        WP_CLI::error("{$entry['asset_key']}: " . $id->get_error_message());
    }

    kk_update_asset_texts($id, $entry['texts']);
    update_post_meta($id, KK_ASSET_KEY_META, $entry['asset_key']);
    update_post_meta($id, KK_ASSET_SHA_META, $entry['asset']['sha256']);
    update_post_meta($id, '_kubikart_asset_source', $entry['asset']['file']);
    return (int) $id;
}
