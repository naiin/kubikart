<?php

declare(strict_types=1);

require_once __DIR__ . '/../wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

$baseDir = __DIR__ . '/../generated-media/product-galleries';

$products = [
    64 => ['slug' => 'personalized-paracord-keychain', 'source' => 'personalized-paracord-keychain', 'title' => 'Personalized Paracord Keychain', 'alt' => 'Personalized navy and orange paracord keychain with a metal key ring.'],
    65 => ['slug' => 'personalisierter-paracord-schluesselanhaenger', 'source' => 'personalized-paracord-keychain', 'title' => 'Personalisierter Paracord Schlüsselanhänger', 'alt' => 'Personalisierter Paracord-Schlüsselanhänger in Navy und Orange mit Metallring.'],
    66 => ['slug' => 'engraved-wooden-keychain', 'source' => 'engraved-wooden-keychain', 'title' => 'Engraved Wooden Keychain', 'alt' => 'Round engraved birch wood keychain with a botanical motif and metal ring.'],
    67 => ['slug' => 'holz-schluesselanhaenger-mit-gravur', 'source' => 'engraved-wooden-keychain', 'title' => 'Holz-Schlüsselanhänger mit Gravur', 'alt' => 'Runder Schlüsselanhänger aus Birkenholz mit botanischer Gravur und Metallring.'],
    68 => ['slug' => 'personalized-wooden-name-sign', 'source' => 'personalized-wooden-name-sign', 'title' => 'Personalized Wooden Name Sign', 'alt' => 'Laser-cut birch wood name sign with decorative leaf details.'],
    69 => ['slug' => 'personalisierter-namensschriftzug-holz', 'source' => 'personalized-wooden-name-sign', 'title' => 'Personalisierter Namensschriftzug aus Holz', 'alt' => 'Lasergeschnittener Namensschriftzug aus Birkenholz mit dekorativen Blättern.'],
    70 => ['slug' => 'acrylic-nfc-social-media-stand', 'source' => 'acrylic-nfc-social-media-stand', 'title' => 'Acrylic NFC Social Media Stand', 'alt' => 'Clear acrylic NFC and QR tabletop stand with a navy base.'],
    71 => ['slug' => 'acryl-nfc-social-media-staender', 'source' => 'acrylic-nfc-social-media-stand', 'title' => 'Acryl NFC Social Media Ständer', 'alt' => 'Transparenter NFC- und QR-Tischaufsteller aus Acryl mit navyfarbenem Sockel.'],
    72 => ['slug' => '3d-printed-desktop-organizer', 'source' => '3d-printed-desktop-organizer', 'title' => '3D Printed Desktop Organizer', 'alt' => 'Navy 3D-printed desktop organizer for a phone, pens and business cards.'],
    73 => ['slug' => '3d-druck-desktop-organizer', 'source' => '3d-printed-desktop-organizer', 'title' => '3D-Druck Desktop-Organizer', 'alt' => 'Navyfarbener 3D-gedruckter Desktop-Organizer für Smartphone, Stifte und Karten.'],
    74 => ['slug' => 'laser-engraved-bamboo-pen', 'source' => 'laser-engraved-bamboo-pen', 'title' => 'Laser-Engraved Bamboo Pen', 'alt' => 'Natural bamboo ballpoint pen with a precision laser-engraved botanical motif.'],
    75 => ['slug' => 'lasergravierter-bambus-kugelschreiber', 'source' => 'laser-engraved-bamboo-pen', 'title' => 'Lasergravierter Bambus-Kugelschreiber', 'alt' => 'Kugelschreiber aus natürlichem Bambus mit präziser botanischer Lasergravur.'],
    76 => ['slug' => 'engraved-slate-door-sign', 'source' => 'engraved-slate-door-sign', 'title' => 'Engraved Slate Door Sign', 'alt' => 'Charcoal slate door sign with pale botanical engraving and metal mounts.'],
    77 => ['slug' => 'gravierte-schieferplatte-tuerschild', 'source' => 'engraved-slate-door-sign', 'title' => 'Gravierte Schieferplatte (Türschild)', 'alt' => 'Dunkles Türschild aus Schiefer mit heller botanischer Gravur und Metallhaltern.'],
    78 => ['slug' => '3d-printed-phone-stand', 'source' => '3d-printed-phone-stand', 'title' => '3D Printed Phone Stand', 'alt' => 'Minimal navy 3D-printed smartphone stand with a charging-cable groove.'],
    79 => ['slug' => '3d-druck-smartphone-halter', 'source' => '3d-printed-phone-stand', 'title' => '3D-Druck Smartphone-Halter', 'alt' => 'Minimalistischer navyfarbener 3D-Druck-Smartphone-Halter mit Kabelführung.'],
    80 => ['slug' => 'led-name-light-acrylic', 'source' => 'led-name-light-acrylic', 'title' => 'LED Name Light Acrylic', 'alt' => 'Warm edge-lit engraved acrylic name light in a natural wood base.'],
    81 => ['slug' => 'led-namensleuchte-acryl', 'source' => 'led-name-light-acrylic', 'title' => 'LED-Namensleuchte (Acryl)', 'alt' => 'Warm leuchtende gravierte Acryl-Namensleuchte mit Sockel aus Naturholz.'],
    82 => ['slug' => 'engraved-wooden-cutting-board', 'source' => 'engraved-wooden-cutting-board', 'title' => 'Engraved Wooden Cutting Board', 'alt' => 'Oak cutting board with a precise botanical laser engraving.'],
    83 => ['slug' => 'graviertes-holz-schneidebrett', 'source' => 'engraved-wooden-cutting-board', 'title' => 'Graviertes Holz-Schneidebrett', 'alt' => 'Schneidebrett aus Eiche mit präziser botanischer Lasergravur.'],
    159 => ['slug' => 'starter-visibility-kit', 'source' => 'starter-visibility-kit', 'title' => 'Starter Visibility Kit', 'alt' => 'Starter visibility set with an acrylic review stand and window stickers.'],
    160 => ['slug' => 'starter-visibility-kit-de', 'source' => 'starter-visibility-kit', 'title' => 'Starter Visibility Kit', 'alt' => 'Starter-Sichtbarkeitsset mit Acryl-Bewertungsaufsteller und Fensteraufklebern.'],
    161 => ['slug' => 'gastro-visibility-kit', 'source' => 'gastro-visibility-kit', 'title' => 'Gastro Visibility Kit', 'alt' => 'Hospitality visibility set with menu, review and booking QR displays.'],
    162 => ['slug' => 'gastro-visibility-kit-de', 'source' => 'gastro-visibility-kit', 'title' => 'Gastro Visibility Kit', 'alt' => 'Gastronomie-Sichtbarkeitsset mit Menü-, Bewertungs- und Buchungsdisplays.'],
    163 => ['slug' => 'barber-salon-kit', 'source' => 'barber-salon-kit', 'title' => 'Barber and Salon Kit', 'alt' => 'Salon visibility set with acrylic review, booking and window displays.'],
    164 => ['slug' => 'barber-salon-kit-de', 'source' => 'barber-salon-kit', 'title' => 'Barber & Salon Kit', 'alt' => 'Salon-Sichtbarkeitsset mit Acryl-Aufstellern für Bewertungen und Buchungen.'],
    165 => ['slug' => 'reception-kit', 'source' => 'reception-kit', 'title' => 'Reception Kit', 'alt' => 'Reception set with acrylic QR displays, privacy film and opening-hours sticker.'],
    166 => ['slug' => 'reception-kit-de', 'source' => 'reception-kit', 'title' => 'Reception Kit', 'alt' => 'Empfangsset mit Acryl-QR-Aufstellern, Sichtschutzfolie und Öffnungszeiten-Aufkleber.'],
    167 => ['slug' => 'local-shop-window-kit', 'source' => 'local-shop-window-kit', 'title' => 'Local Shop Window Kit', 'alt' => 'Shop-window set with review, opening-hours, logo and frosted-glass stickers.'],
    168 => ['slug' => 'local-shop-window-kit-de', 'source' => 'local-shop-window-kit', 'title' => 'Local Shop Window Kit', 'alt' => 'Schaufensterset mit Bewertungs-, Öffnungszeiten-, Logo- und Milchglasaufklebern.'],
];

$categorySources = [
    91 => 'personalized-paracord-keychain', 93 => 'personalized-paracord-keychain',
    95 => 'engraved-wooden-keychain', 97 => 'engraved-wooden-keychain',
    99 => 'engraved-wooden-cutting-board', 101 => 'engraved-wooden-cutting-board',
    103 => 'acrylic-nfc-social-media-stand', 105 => 'acrylic-nfc-social-media-stand',
    107 => '3d-printed-desktop-organizer', 109 => '3d-printed-desktop-organizer',
    111 => 'acrylic-nfc-social-media-stand', 113 => 'acrylic-nfc-social-media-stand',
    125 => 'starter-visibility-kit', 127 => 'starter-visibility-kit',
    129 => 'local-shop-window-kit', 131 => 'local-shop-window-kit',
    133 => 'gastro-visibility-kit', 135 => 'gastro-visibility-kit',
    137 => 'engraved-slate-door-sign', 139 => 'engraved-slate-door-sign',
    153 => 'acrylic-nfc-social-media-stand', 155 => 'acrylic-nfc-social-media-stand',
    157 => 'acrylic-nfc-social-media-stand', 159 => 'acrylic-nfc-social-media-stand',
    161 => 'local-shop-window-kit', 163 => 'local-shop-window-kit',
    165 => 'gastro-visibility-kit', 167 => 'gastro-visibility-kit',
    169 => 'local-shop-window-kit', 171 => 'local-shop-window-kit',
    173 => 'reception-kit', 175 => 'reception-kit',
    177 => 'barber-salon-kit', 179 => 'barber-salon-kit',
    181 => 'reception-kit', 183 => 'reception-kit',
    185 => 'starter-visibility-kit', 187 => 'starter-visibility-kit',
];

$categoryImageDescriptions = [
    'personalized-paracord-keychain' => ['en' => 'Navy and orange personalized paracord keychain', 'de' => 'Personalisierter Paracord-Schlüsselanhänger in Navy und Orange'],
    'engraved-wooden-keychain' => ['en' => 'Round engraved birch wood keychain', 'de' => 'Runder gravierter Schlüsselanhänger aus Birkenholz'],
    'engraved-wooden-cutting-board' => ['en' => 'Oak cutting board with botanical laser engraving', 'de' => 'Schneidebrett aus Eiche mit botanischer Lasergravur'],
    'acrylic-nfc-social-media-stand' => ['en' => 'Clear acrylic NFC and QR tabletop stand', 'de' => 'Transparenter NFC- und QR-Tischaufsteller aus Acryl'],
    '3d-printed-desktop-organizer' => ['en' => 'Navy 3D-printed desktop organizer', 'de' => 'Navyfarbener 3D-gedruckter Desktop-Organizer'],
    'starter-visibility-kit' => ['en' => 'Visibility kit with acrylic review stand and window stickers', 'de' => 'Sichtbarkeitsset mit Acryl-Bewertungsaufsteller und Fensteraufklebern'],
    'local-shop-window-kit' => ['en' => 'Shop-window set with review and opening-hours stickers', 'de' => 'Schaufensterset mit Bewertungs- und Öffnungszeiten-Aufklebern'],
    'gastro-visibility-kit' => ['en' => 'Hospitality set with menu, review and booking displays', 'de' => 'Gastronomie-Set mit Menü-, Bewertungs- und Buchungsdisplays'],
    'engraved-slate-door-sign' => ['en' => 'Engraved charcoal slate door sign', 'de' => 'Graviertes dunkles Türschild aus Schiefer'],
    'reception-kit' => ['en' => 'Reception set with acrylic displays and privacy film', 'de' => 'Empfangsset mit Acryl-Aufstellern und Sichtschutzfolie'],
    'barber-salon-kit' => ['en' => 'Salon set with acrylic review and booking displays', 'de' => 'Salon-Set mit Acryl-Aufstellern für Bewertungen und Buchungen'],
];

function kubikart_import_seo_image(string $key, string $file, string $filename, string $title, string $alt): int
{
    $existing = get_posts([
        'post_type' => 'attachment', 'post_status' => 'inherit', 'posts_per_page' => 1,
        'fields' => 'ids', 'meta_key' => '_kubikart_asset_key', 'meta_value' => $key,
    ]);
    if ($existing !== []) {
        $id = (int) $existing[0];
        update_post_meta($id, '_wp_attachment_image_alt', $alt);
        wp_update_post(['ID' => $id, 'post_title' => $title]);
        return $id;
    }
    if (! is_file($file)) {
        throw new RuntimeException("Missing generated image: {$file}");
    }
    $uploaded = wp_upload_bits($filename, null, file_get_contents($file));
    if ($uploaded['error'] !== false) {
        throw new RuntimeException("Upload failed for {$filename}: {$uploaded['error']}");
    }
    $id = wp_insert_attachment([
        'post_mime_type' => 'image/webp', 'post_title' => $title, 'post_status' => 'inherit',
    ], $uploaded['file']);
    if (is_wp_error($id)) {
        throw new RuntimeException($id->get_error_message());
    }
    wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $uploaded['file']));
    update_post_meta($id, '_wp_attachment_image_alt', $alt);
    update_post_meta($id, '_kubikart_asset_key', $key);
    return (int) $id;
}

/**
 * Assign locale-specific media without triggering Polylang's configured
 * featured-image/product-gallery synchronization across translation pairs.
 */
function kubikart_set_localized_product_media(int $postId, int $featuredId, array $galleryIds): void
{
    global $wpdb;

    foreach (['_thumbnail_id' => (string) $featuredId, '_product_image_gallery' => implode(',', $galleryIds)] as $key => $value) {
        $wpdb->delete($wpdb->postmeta, ['post_id' => $postId, 'meta_key' => $key], ['%d', '%s']);
        $wpdb->insert($wpdb->postmeta, ['post_id' => $postId, 'meta_key' => $key, 'meta_value' => $value], ['%d', '%s', '%s']);
    }
    clean_post_cache($postId);
    wp_cache_delete($postId, 'post_meta');
}

$viewSuffixes = ['', '-detail', '-context'];
$summary = ['products' => [], 'categories' => []];

foreach ($products as $postId => $product) {
    $actualSlug = get_post_field('post_name', $postId);
    if ($actualSlug !== $product['slug']) {
        throw new RuntimeException("Product {$postId} slug changed: expected {$product['slug']}, found {$actualSlug}");
    }
    $ids = [];
    foreach ($viewSuffixes as $index => $suffix) {
        $view = $index + 1;
        $isGerman = function_exists('pll_get_post_language') && pll_get_post_language($postId) === 'de';
        $viewLabel = $isGerman
            ? ($index === 0 ? 'Hauptansicht' : ($index === 1 ? 'Detailansicht' : 'Anwendungsansicht'))
            : ($index === 0 ? 'main view' : ($index === 1 ? 'detail view' : 'context view'));
        $baseAlt = rtrim($product['alt'], '.');
        $viewAlt = $index === 0
            ? $product['alt']
            : ($isGerman
                ? $baseAlt . ($index === 1 ? ' in einer Nahaufnahme.' : ' in einer passenden Anwendungsszene.')
                : $baseAlt . ($index === 1 ? ' in a close detail view.' : ' shown in a styled setting.'));
        $ids[] = kubikart_import_seo_image(
            "product-gallery-v3:{$postId}:{$view}",
            "{$baseDir}/{$product['source']}-{$view}.webp",
            "{$product['slug']}{$suffix}.webp",
            "{$product['title']} — {$viewLabel}",
            $viewAlt
        );
    }
    kubikart_set_localized_product_media($postId, $ids[0], array_slice($ids, 1));
    $summary['products'][] = ['post_id' => $postId, 'slug' => $product['slug'], 'attachments' => $ids];
}

foreach ($categorySources as $termId => $source) {
    $term = get_term($termId, 'product_cat');
    if (! $term instanceof WP_Term) {
        throw new RuntimeException("Missing product category {$termId}");
    }
    $isGerman = preg_match('/(^|[-])(de|druck|produkte|geschenke|staender|aufkleber|displays|listen|schutz)(-|$)/', $term->slug) === 1
        || in_array($termId, [93, 97, 101, 105, 109, 113, 125, 129, 133, 137, 155, 159, 163, 167, 171, 175, 179, 183, 187], true);
    $language = $isGerman ? 'de' : 'en';
    $description = $categoryImageDescriptions[$source][$language];
    $alt = $isGerman
        ? "{$description} für die Kategorie " . html_entity_decode($term->name) . '.'
        : "{$description} for the " . html_entity_decode($term->name) . ' category.';
    $attachmentId = kubikart_import_seo_image(
        "category-thumbnail-v3:{$termId}",
        "{$baseDir}/{$source}-1.webp",
        "{$term->slug}.webp",
        html_entity_decode($term->name) . ' — category image',
        html_entity_decode($alt)
    );
    update_term_meta($termId, 'thumbnail_id', $attachmentId);
    $summary['categories'][] = ['term_id' => $termId, 'slug' => $term->slug, 'attachment' => $attachmentId];
}

echo wp_json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
