<?php
/**
 * Must-Use Plugin: Kubikart Rating Sync
 * 
 * Automatically recalculates WooCommerce product ratings when reviews
 * are added, approved, updated, or deleted. No activation needed.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Recalculate rating meta for a specific product.
 */
function kubikart_recalculate_product_rating(int $product_id): void {
    global $wpdb;

    $ratings = $wpdb->get_col($wpdb->prepare("
        SELECT cm.meta_value 
        FROM {$wpdb->comments} c
        INNER JOIN {$wpdb->commentmeta} cm ON c.comment_ID = cm.comment_id
        WHERE c.comment_post_ID = %d 
        AND c.comment_approved = '1'
        AND cm.meta_key = 'rating'
        AND cm.meta_value > 0
    ", $product_id));

    $count = count($ratings);
    $average = $count > 0 ? round(array_sum($ratings) / $count, 2) : 0;

    update_post_meta($product_id, '_wc_average_rating', $average);
    update_post_meta($product_id, '_wc_rating_count', $count);
    update_post_meta($product_id, '_wc_review_count', $count);
}

/**
 * Hook: When a review comment changes, recalculate its product's rating.
 */
function kubikart_on_review_change(int $comment_id): void {
    $comment = get_comment($comment_id);

    if (!$comment || get_post_type($comment->comment_post_ID) !== 'product') {
        return;
    }

    kubikart_recalculate_product_rating((int) $comment->comment_post_ID);
}

add_action('comment_post', 'kubikart_on_review_change');
add_action('wp_set_comment_status', 'kubikart_on_review_change');
add_action('edit_comment', 'kubikart_on_review_change');
add_action('delete_comment', 'kubikart_on_review_change');
add_action('trash_comment', 'kubikart_on_review_change');
add_action('untrash_comment', 'kubikart_on_review_change');
add_action('transition_comment_status', function ($new_status, $old_status, $comment) {
    if (is_object($comment) && isset($comment->comment_ID)) {
        kubikart_on_review_change((int) $comment->comment_ID);
    }
}, 10, 3);

add_action('updated_comment_meta', function ($meta_id, $comment_id, $meta_key) {
    if ($meta_key === 'rating') {
        kubikart_on_review_change($comment_id);
    }
}, 10, 3);
