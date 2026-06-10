<?php
/**
 * Plugin Name: Kubikart Newsletter
 * Description: Custom post type for newsletter subscriptions with double opt-in.
 * Version: 1.0.0
 * Author: Kubikart
 */

if (!defined('ABSPATH')) {
    exit;
}

// Register Custom Post Type
add_action('init', function () {
    register_post_type('newsletter_sub', [
        'labels' => [
            'name'               => 'Newsletter',
            'singular_name'      => 'Subscriber',
            'menu_name'          => 'Newsletter',
            'all_items'          => 'Alle Abonnenten',
            'add_new'            => 'Neu hinzufügen',
            'add_new_item'       => 'Neuen Abonnenten hinzufügen',
            'edit_item'          => 'Abonnent bearbeiten',
            'view_item'          => 'Abonnent ansehen',
            'search_items'       => 'Abonnenten suchen',
            'not_found'          => 'Keine Abonnenten gefunden',
            'not_found_in_trash' => 'Keine Abonnenten im Papierkorb',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'show_in_rest' => true,
        'rest_base'    => 'newsletter-subscribers',
        'menu_icon'    => 'dashicons-email-alt',
        'menu_position'=> 25,
        'supports'     => ['title', 'editor', 'custom-fields'],
        'capability_type' => 'post',
        'has_archive'  => false,
    ]);
});

// Add custom columns to admin list
add_filter('manage_newsletter_sub_posts_columns', function ($columns) {
    $new = [];
    $new['cb'] = $columns['cb'];
    $new['title'] = 'E-Mail';
    $new['nl_status'] = 'Status';
    $new['nl_subscribed'] = 'Angemeldet';
    $new['nl_confirmed'] = 'Bestätigt';
    return $new;
});

add_action('manage_newsletter_sub_posts_custom_column', function ($column, $post_id) {
    $content = get_post_field('post_content', $post_id);
    $data = json_decode($content, true);

    switch ($column) {
        case 'nl_status':
            $status = $data['status'] ?? 'unknown';
            $color = $status === 'confirmed' ? '#059669' : '#d97706';
            $label = $status === 'confirmed' ? '✓ Bestätigt' : '⏳ Ausstehend';
            echo "<span style='color:{$color};font-weight:600;'>{$label}</span>";
            break;
        case 'nl_subscribed':
            echo esc_html($data['subscribed_at'] ?? '–');
            break;
        case 'nl_confirmed':
            echo esc_html($data['confirmed_at'] ?? '–');
            break;
    }
}, 10, 2);

// Make status column sortable
add_filter('manage_edit-newsletter_sub_sortable_columns', function ($columns) {
    $columns['nl_status'] = 'nl_status';
    return $columns;
});
