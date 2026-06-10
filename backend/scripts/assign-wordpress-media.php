<?php

require_once __DIR__ . '/../wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$baseDir = __DIR__ . '/../generated-media';

$productAssets = [
    'personalized-paracord-keychain' => [
        'file' => $baseDir . '/products/personalized-paracord-keychain.png',
        'title' => 'Personalized Paracord Keychain',
        'alt' => 'Premium product image of a personalized paracord keychain.',
        'posts' => [64, 65],
    ],
    'engraved-wooden-keychain' => [
        'file' => $baseDir . '/products/engraved-wooden-keychain.png',
        'title' => 'Engraved Wooden Keychain',
        'alt' => 'Premium product image of an engraved wooden keychain.',
        'posts' => [66, 67],
    ],
    'personalized-wooden-name-sign' => [
        'file' => $baseDir . '/products/personalized-wooden-name-sign.png',
        'title' => 'Personalized Wooden Name Sign',
        'alt' => 'Premium product image of a personalized wooden name sign.',
        'posts' => [68, 69],
    ],
    'acrylic-nfc-social-media-stand' => [
        'file' => $baseDir . '/products/acrylic-nfc-social-media-stand.png',
        'title' => 'Acrylic NFC Social Media Stand',
        'alt' => 'Premium product image of an acrylic NFC social media stand.',
        'posts' => [70, 71],
    ],
    '3d-printed-desktop-organizer' => [
        'file' => $baseDir . '/products/3d-printed-desktop-organizer.png',
        'title' => '3D Printed Desktop Organizer',
        'alt' => 'Premium product image of a 3D printed desktop organizer.',
        'posts' => [72, 73],
    ],
    'laser-engraved-bamboo-pen' => [
        'file' => $baseDir . '/products/laser-engraved-bamboo-pen.png',
        'title' => 'Laser-Engraved Bamboo Pen',
        'alt' => 'Premium product image of a laser-engraved bamboo pen.',
        'posts' => [74, 75],
    ],
    'engraved-slate-door-sign' => [
        'file' => $baseDir . '/products/engraved-slate-door-sign.png',
        'title' => 'Engraved Slate Door Sign',
        'alt' => 'Premium product image of an engraved slate door sign.',
        'posts' => [76, 77],
    ],
    '3d-printed-phone-stand' => [
        'file' => $baseDir . '/products/3d-printed-phone-stand.png',
        'title' => '3D Printed Phone Stand',
        'alt' => 'Premium product image of a 3D printed phone stand.',
        'posts' => [78, 79],
    ],
    'led-name-light-acrylic' => [
        'file' => $baseDir . '/products/led-name-light-acrylic.png',
        'title' => 'LED Name Light Acrylic',
        'alt' => 'Premium product image of an LED acrylic name light.',
        'posts' => [80, 81],
    ],
    'engraved-wooden-cutting-board' => [
        'file' => $baseDir . '/products/engraved-wooden-cutting-board.png',
        'title' => 'Engraved Wooden Cutting Board',
        'alt' => 'Premium product image of an engraved wooden cutting board.',
        'posts' => [82, 83],
    ],
];

$categoryAssets = [
    'keychains' => [
        'file' => $baseDir . '/categories/keychains.png',
        'title' => 'Keychains Category',
        'alt' => 'Category image for personalized keychains.',
        'terms' => [91, 93],
    ],
    'personalized-gifts' => [
        'file' => $baseDir . '/categories/personalized-gifts.png',
        'title' => 'Personalized Gifts Category',
        'alt' => 'Category image for personalized gifts.',
        'terms' => [95, 97],
    ],
    'wood-products' => [
        'file' => $baseDir . '/categories/wood-products.png',
        'title' => 'Wood Products Category',
        'alt' => 'Category image for wood products.',
        'terms' => [99, 101],
    ],
    'acrylic-products' => [
        'file' => $baseDir . '/categories/acrylic-products.png',
        'title' => 'Acrylic Products Category',
        'alt' => 'Category image for acrylic products.',
        'terms' => [103, 105],
    ],
    '3d-printing' => [
        'file' => $baseDir . '/categories/3d-printing.png',
        'title' => '3D Printing Category',
        'alt' => 'Category image for 3D printing.',
        'terms' => [107, 109],
    ],
    'nfc-social-stands' => [
        'file' => $baseDir . '/categories/nfc-social-stands.png',
        'title' => 'NFC and Social Stands Category',
        'alt' => 'Category image for NFC and social stands.',
        'terms' => [111, 113],
    ],
    'business-products' => [
        'file' => $baseDir . '/categories/business-products.png',
        'title' => 'Business Products Category',
        'alt' => 'Category image for business products.',
        'terms' => [125, 127],
    ],
    'window-door-stickers' => [
        'file' => $baseDir . '/categories/window-door-stickers.png',
        'title' => 'Window and Door Stickers Category',
        'alt' => 'Category image for window and door stickers.',
        'terms' => [129, 131],
    ],
    'menus-price-lists' => [
        'file' => $baseDir . '/categories/menus-price-lists.png',
        'title' => 'Menus and Price Lists Category',
        'alt' => 'Category image for menus and price lists.',
        'terms' => [133, 135],
    ],
    'signs-displays' => [
        'file' => $baseDir . '/categories/signs-displays.png',
        'title' => 'Signs and Displays Category',
        'alt' => 'Category image for signs and displays.',
        'terms' => [137, 139],
    ],
];

/**
 * Import a local image into the media library exactly once per asset key.
 */
function kubikart_import_asset(string $assetKey, string $filePath, string $title, string $alt): int
{
    $existing = get_posts([
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'posts_per_page' => 1,
        'meta_key' => '_kubikart_asset_key',
        'meta_value' => $assetKey,
        'fields' => 'ids',
    ]);

    if (! empty($existing)) {
        $attachmentId = (int) $existing[0];
        update_post_meta($attachmentId, '_wp_attachment_image_alt', $alt);
        wp_update_post([
            'ID' => $attachmentId,
            'post_title' => $title,
        ]);

        return $attachmentId;
    }

    if (! file_exists($filePath)) {
        throw new RuntimeException("Missing asset: {$filePath}");
    }

    $filename = wp_unique_filename(wp_get_upload_dir()['path'], basename($filePath));
    $uploaded = wp_upload_bits($filename, null, file_get_contents($filePath));

    if (! empty($uploaded['error'])) {
        throw new RuntimeException("Upload failed for {$filePath}: {$uploaded['error']}");
    }

    $filetype = wp_check_filetype($uploaded['file']);
    $attachmentId = wp_insert_attachment([
        'post_mime_type' => $filetype['type'] ?: 'image/png',
        'post_title' => $title,
        'post_status' => 'inherit',
    ], $uploaded['file']);

    if (is_wp_error($attachmentId)) {
        throw new RuntimeException("Attachment insert failed for {$filePath}: " . $attachmentId->get_error_message());
    }

    $metadata = wp_generate_attachment_metadata($attachmentId, $uploaded['file']);
    wp_update_attachment_metadata($attachmentId, $metadata);
    update_post_meta($attachmentId, '_wp_attachment_image_alt', $alt);
    update_post_meta($attachmentId, '_kubikart_asset_key', $assetKey);

    return (int) $attachmentId;
}

$summary = [
    'products' => [],
    'categories' => [],
];

foreach ($productAssets as $assetKey => $asset) {
    $attachmentId = kubikart_import_asset(
        'product:' . $assetKey,
        $asset['file'],
        $asset['title'],
        $asset['alt']
    );

    foreach ($asset['posts'] as $postId) {
        set_post_thumbnail($postId, $attachmentId);
        $summary['products'][] = [
            'post_id' => $postId,
            'asset' => $assetKey,
            'attachment_id' => $attachmentId,
        ];
    }
}

foreach ($categoryAssets as $assetKey => $asset) {
    $attachmentId = kubikart_import_asset(
        'category:' . $assetKey,
        $asset['file'],
        $asset['title'],
        $asset['alt']
    );

    foreach ($asset['terms'] as $termId) {
        update_term_meta($termId, 'thumbnail_id', $attachmentId);
        $summary['categories'][] = [
            'term_id' => $termId,
            'asset' => $assetKey,
            'attachment_id' => $attachmentId,
        ];
    }
}

echo wp_json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
