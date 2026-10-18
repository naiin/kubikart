<?php
/** wp eval-file scripts/import-etsy-videos.php [dry-run|apply] <videos-dir>
 * Attach reviewed original videos to existing imported products only; never publish.
 */
if (!defined('ABSPATH')) exit;
$mode = $args[0] ?? 'dry-run';
$dir = rtrim($args[1] ?? '', '/');
if (!in_array($mode, ['dry-run','apply'], true)) WP_CLI::error('Expected dry-run or apply.');
$files = [
    'bamboo-mum'=>['thank-you-mum-engraved-bamboo-board.mp4'],
    'bamboo-school'=>['personalized-school-start-gift-bamboo.mp4'],
    'jar-new-parents'=>['new-parent-gift-funny-snack-jar-with.mp4'],
    'jar-wedding-hearts'=>['personalized-wedding-gift-with-names.mp4'],
    'jar-wedding-rings'=>['personalized-wedding-gift-with-names-4593659167.mp4'],
    'jar-wedding-us'=>['personalized-wedding-gift-with-names-o-4593637409.mp4'],
    'keychain-3d-name'=>['personalized-name-keychain-with-3d.mp4','personalized-name-keychain-with-3d-2.mp4'],
    'keychain-wood-name'=>['personalized-wooden-name-keychain-with.mp4'],
    'keychain-wood-profession'=>['personalized-wooden-keychain-with-4588906331.mp4'],
];
$defs = require __DIR__.'/data/etsy-gifts.php';
$pending = []; $snapshot = ['products'=>[], 'created_media'=>[]];
foreach ($defs as $def) {
    $products = [];
    foreach ($def['slugs'] as $lang=>$slug) {
        $post = get_page_by_path($slug, OBJECT, 'product');
        if (!$post || !get_post_meta($post->ID, '_kubikart_etsy_source_key', true)) WP_CLI::error('Missing imported product: '.$slug);
        $products[$lang] = $post->ID;
        $snapshot['products'][$post->ID] = ['post'=>get_post($post->ID, ARRAY_A), 'meta'=>get_post_meta($post->ID)];
    }
    foreach ($files[$def['key']] as $i=>$file) {
        $source = $dir.'/'.$file;
        if (!is_readable($source) || wp_check_filetype($source)['type'] !== 'video/mp4') WP_CLI::error('Missing/invalid MP4: '.$file);
        $hash = hash_file('sha256', $source);
        $key = 'etsy/'.$def['key'].'/video-'.($i+1);
        $found = get_posts(['post_type'=>'attachment','post_status'=>'inherit','fields'=>'ids','posts_per_page'=>-1,'suppress_filters'=>true,'meta_key'=>'_kubikart_video_asset_key','meta_value'=>$key]);
        if (count($found)>1 || ($found && get_post_meta($found[0], '_kubikart_video_sha256', true)!==$hash)) WP_CLI::error('Conflicting existing video: '.$key);
        $pending[] = compact('def','products','source','hash','key','i','found');
        WP_CLI::line($def['key'].' #'.($i+1).' -> '.implode('/', $products).($found ? ' (reuse)' : ' (new)'));
    }
}
if ($mode!=='apply') { WP_CLI::success('10 videos matched to nine bilingual product pairs. Dry run; no writes.'); return; }
require_once ABSPATH.'wp-admin/includes/file.php';
require_once ABSPATH.'wp-admin/includes/media.php';
require_once ABSPATH.'wp-admin/includes/image.php';
$backup = dirname(__DIR__).'/backups/etsy-videos-'.gmdate('Ymd-His').'.json';
$save = static function () use (&$snapshot, $backup) {
    if (file_put_contents($backup, wp_json_encode($snapshot, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE))===false) WP_CLI::error('Cannot save backup.');
    chmod($backup, 0600);
};
$save(); $assigned = [];
foreach ($pending as $entry) {
    extract($entry, EXTR_OVERWRITE);
    $titles = ['de'=>$def['de_title'].($i ? ' – Montage' : ' – Produktvideo'), 'en'=>ucwords(str_replace('-', ' ', $def['slugs']['en'])).($i ? ' – Assembly' : ' – Product video')];
    $id = $found[0] ?? 0;
    if (!$id) {
        $temp = wp_tempnam($source);
        if (!$temp || !copy($source, $temp)) WP_CLI::error('Cannot stage video.');
        $id = media_handle_sideload(['name'=>$def['slugs']['de'].'-video-'.($i+1).'.mp4','tmp_name'=>$temp], $products['de'], $titles['de']);
        if (is_wp_error($id)) { @unlink($temp); WP_CLI::error($id->get_error_message()); }
        $snapshot['created_media'][] = $id; $save();
        update_post_meta($id, '_kubikart_video_asset_key', $key);
        update_post_meta($id, '_kubikart_video_sha256', $hash);
        update_post_meta($id, '_kubikart_video_titles', $titles);
    }
    foreach ($products as $product_id) $assigned[$product_id][] = $id;
}
foreach ($assigned as $product_id=>$ids) {
    $existing = get_post_meta($product_id, '_kubikart_video_ids', true);
    update_post_meta($product_id, '_kubikart_video_ids', array_values(array_unique(array_merge(is_array($existing) ? $existing : [], $ids))));
    clean_post_cache($product_id);
    wc_delete_product_transients($product_id);
    $before = $snapshot['products'][$product_id];
    $after_meta = get_post_meta($product_id); unset($after_meta['_kubikart_video_ids'], $before['meta']['_kubikart_video_ids']);
    if (get_post($product_id, ARRAY_A)!==$before['post'] || $after_meta!==$before['meta']) WP_CLI::error('Unrelated product data changed: '.$product_id);
}
WP_CLI::success('10 videos attached to 18 existing translated products; other product data unchanged. Backup: '.$backup);
