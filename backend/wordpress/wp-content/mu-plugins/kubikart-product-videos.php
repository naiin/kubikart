<?php
/** Plugin Name: Kubikart Product Videos
 * Ordered, self-hosted MP4 attachments; no embeds or external tracking.
 */
if (!defined('ABSPATH')) exit;

function kubikart_product_videos(int $product_id): array {
    $ids = get_post_meta($product_id, '_kubikart_video_ids', true);
    if (!is_array($ids)) return [];
    $lang = function_exists('pll_get_post_language') ? pll_get_post_language($product_id) : 'de';
    $videos = [];
    foreach (array_unique(array_map('absint', $ids)) as $id) {
        // get_post_status() resolves attachment inheritance to its parent's draft/publish status.
        if (get_post_mime_type($id) !== 'video/mp4' || get_post_field('post_status', $id) !== 'inherit') continue;
        $url = wp_get_attachment_url($id);
        if (!$url) continue;
        $titles = get_post_meta($id, '_kubikart_video_titles', true);
        $videos[] = ['id'=>$id, 'src'=>esc_url_raw($url), 'title'=>is_array($titles) ? (string)($titles[$lang] ?? get_the_title($id)) : get_the_title($id)];
    }
    return $videos;
}

add_filter('woocommerce_rest_prepare_product_object', function ($response, $product) {
    $data = $response->get_data();
    $data['kubikart_videos'] = kubikart_product_videos((int)$product->get_id());
    $response->set_data($data);
    return $response;
}, 20, 2);

add_action('add_meta_boxes_product', function () {
    add_meta_box('kubikart-product-videos', 'Kubikart: Produktvideos', function ($post) {
        wp_nonce_field('kubikart_video_save', 'kubikart_video_nonce');
        $ids = get_post_meta($post->ID, '_kubikart_video_ids', true);
        echo '<p><label for="kubikart-video-ids">MP4-Medien-IDs, durch Komma getrennt (Reihenfolge bleibt erhalten)</label></p>';
        echo '<input class="widefat" id="kubikart-video-ids" name="kubikart_video_ids" value="'.esc_attr(is_array($ids) ? implode(',', $ids) : '').'">';
    }, 'product', 'side');
});

add_action('save_post_product', function ($id) {
    if (wp_is_post_revision($id) || wp_is_post_autosave($id) || !current_user_can('edit_post', $id)) return;
    if (!isset($_POST['kubikart_video_nonce'], $_POST['kubikart_video_ids']) || !is_string($_POST['kubikart_video_ids']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['kubikart_video_nonce'])), 'kubikart_video_save')) return;
    $ids = array_values(array_unique(array_filter(array_map('absint', explode(',', wp_unslash($_POST['kubikart_video_ids']))))));
    foreach ($ids as $attachment_id) if (get_post_mime_type($attachment_id) !== 'video/mp4') return;
    update_post_meta($id, '_kubikart_video_ids', $ids);
});
