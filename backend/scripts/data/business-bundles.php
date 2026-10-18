<?php
/**
 * Data for create-business-bundles.php: the six enquiry-only Business Bundles.
 *
 * The owner's catalogue (business-bundles.json, a verbatim copy of bundle-catalogue.json) is the source of truth for all
 * copy, SKUs, slugs, included/optional products, tags, SEO texts, industries and image roles. This file only adds what the
 * catalogue cannot know about this installation:
 *   - the identity (slug) every source product ID must have, so no unrelated product is attached by numeric coincidence,
 *   - short item titles' icons,
 *   - the mapping of the catalogue's industry labels to the real industry records,
 *   - the narrowly necessary corrections for verified product availability (each with its reason).
 * Starting prices are deliberately null in the catalogue and stay unset: nothing here invents a price.
 */

if (!defined('ABSPATH')) {
    exit;
}

$catalogue = json_decode((string) file_get_contents(__DIR__ . '/business-bundles.json'), true);
if (!is_array($catalogue) || empty($catalogue['bundles'])) {
    WP_CLI::error('business-bundles.json is missing or invalid.');
}

return [
    'catalogue' => $catalogue,

    // English product IDs from the catalogue and the slug each must have. Translations are resolved through Polylang.
    'source_slugs' => [
        1221 => 'frosted-window-film-logo',
        1205 => 'business-logo-window-decal',
        1029 => 'custom-stickers-logo-text',
        542 => 'laminated-menus-price-lists',
        540 => 'opening-hours-window-decal',
        538 => 'custom-business-cards',
        509 => 'personalized-acrylic-qr-code-nfc-stand',
        507 => 'personalized-qr-code-stand-nfc',
    ],

    // Icon shown with each product in the bundle overview (see kubikart_kit_icon_options()).
    'icons' => [
        540 => 'decal-hours', 1205 => 'decal-logo', 1221 => 'decal-logo', 1029 => 'decal-text',
        542 => 'sheet', 538 => 'design', 507 => 'stand', 509 => 'stand',
    ],

    // Existing industry records (German slug => English slug) and the bundles shown on them, in this order.
    // A page that combines industries gets the bundle that fits its main audience; the Window Branding bundle suits all.
    'industries' => [
        ['de' => 'barbershops-salons', 'en' => 'barbers-salons', 'bundles' => ['barber-hair-salon', 'window-branding']],
        ['de' => 'beauty-nagelstudios', 'en' => 'beauty-nail-studios', 'bundles' => ['beauty-nail-studio', 'window-branding']],
        ['de' => 'cafes-baeckereien', 'en' => 'cafes-bakeries', 'bundles' => ['cafe-restaurant', 'window-branding']],
        ['de' => 'restaurants-lieferdienste', 'en' => 'restaurants-takeaways', 'bundles' => ['cafe-restaurant', 'window-branding']],
        ['de' => 'lokale-geschaefte', 'en' => 'local-shops', 'bundles' => ['retail-boutique', 'window-branding']],
        ['de' => 'praxen-gesundheitsbetriebe', 'en' => 'clinics-practices', 'bundles' => ['practice-office', 'window-branding']],
        // Not named in the brief: service businesses with a counter or office suit the Practice & Office bundle.
        ['de' => 'reparatur-servicebetriebe', 'en' => 'repair-service-businesses', 'bundles' => ['practice-office', 'window-branding']],
        ['de' => 'fahrschulen', 'en' => 'driving-schools', 'bundles' => ['practice-office', 'window-branding']],
    ],

    // Corrections for verified product availability. The sticker product has no 50-piece pack: the round 40 mm sizes are
    // sold in packs of 48, 96, 240 and 480, so the base scope names the nearest real pack, 48.
    'corrections' => [
        'retail-boutique' => [
            'quantity' => [1029 => 48],
            'replace' => [
                'en' => ['50 logo stickers' => '48 logo stickers'],
                'de' => ['50 Logo-Aufklebern' => '48 Logo-Aufklebern', '50 Logo-Aufkleber' => '48 Logo-Aufkleber'],
            ],
            'reason' => 'Round 40 mm logo stickers exist only in packs of 48, 96, 240 and 480 (no 50-piece pack).',
        ],
    ],
];
