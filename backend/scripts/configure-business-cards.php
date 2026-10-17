<?php
/**
 * Populate the existing German/English business-card product drafts.
 *
 * Usage:
 *   wp eval-file scripts/configure-business-cards.php dry-run <images-dir>
 *   wp eval-file scripts/configure-business-cards.php apply <images-dir>
 *
 * This intentionally does not invent SKU, shipping weight or parcel
 * dimensions. The linked products and their reviewed price variations are
 * published; those fulfilment fields can be added later without changing the
 * storefront contract.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('WooCommerce') || !class_exists('WC_Product_Simple')) {
    WP_CLI::error('WooCommerce is not available.');
}

$mode = $args[0] ?? 'dry-run';
$image_dir = isset($args[1]) ? untrailingslashit($args[1]) : '';
if (!in_array($mode, ['dry-run', 'apply'], true)) {
    WP_CLI::error('Mode must be dry-run or apply.');
}

$copy = [
    'de' => [
        'title' => 'Personalisierte Visitenkarten mit Logo & Kontaktdaten – Eigenes Design oder individuelle Gestaltung',
        'slug' => 'personalisierte-visitenkarten',
        'short' => '<p>Dein Business im passenden Format: Individuell bedruckte Visitenkarten mit deinem Logo, Namen und deinen Kontaktdaten. Lade dein fertiges Design hoch oder wähle die Gestaltung eines einfachen Layouts nach deinen Angaben. Einseitig oder beidseitig im Format 85 × 55 mm.</p>',
        'content' => <<<'HTML'
<p>Hinterlasse einen persönlichen Eindruck – mit Visitenkarten, die zu deinem Unternehmen passen. Ob für dein Café, deinen Salon, dein Studio, dein Handwerk oder deine Dienstleistung: Deine wichtigsten Informationen sind übersichtlich gestaltet und jederzeit griffbereit.</p>
<h2>Dein Design oder Unterstützung bei der Gestaltung</h2>
<ul><li><strong>Eigenes Design:</strong> Du hast bereits ein fertiges Layout? Lade deine Druckdatei für die Vorderseite und gegebenenfalls die Rückseite hoch.</li><li><strong>Einfaches Layout erstellen lassen:</strong> Sende dein vorhandenes Logo, deine Kontaktdaten und deine Wünsche zu Farben und Schrift. Daraus gestalten wir ein übersichtliches Layout im Rahmen der gewählten Gestaltungsoption.</li></ul>
<p>Die Erstellung eines neuen Logos ist nicht Bestandteil der einfachen Layoutgestaltung.</p>
<h2>Deine Auswahlmöglichkeiten</h2>
<ul><li>Format: 85 × 55 mm</li><li>Einseitiger oder beidseitiger Druck</li><li>Stückzahl entsprechend der gewählten Variante</li><li>Eigenes Druckdesign oder einfache Layoutgestaltung</li><li>Hochformat oder Querformat passend zu deinem Design</li></ul>
<h2>Diese Informationen können auf deine Karte</h2>
<ul><li>Firmenname und Logo</li><li>Name und Berufsbezeichnung</li><li>Telefonnummer und E-Mail-Adresse</li><li>Website und Social-Media-Profil</li><li>Geschäftsadresse</li><li>Kurzer Slogan oder ausgewählte Leistungen</li></ul>
<p>Du entscheidest, welche Angaben erscheinen sollen. Weniger Text schafft häufig mehr Platz für eine gut lesbare Gestaltung.</p>
<h2>So bestellst du</h2>
<ol><li>Wähle Stückzahl, Druckseiten und Gestaltungsoption.</li><li>Lade dein fertiges Design hoch oder sende Logo und Kontaktdaten.</li><li>Teile uns bei einer Layoutgestaltung deine Farb- und Schriftwünsche mit.</li><li>Bei einer durch uns erstellten Gestaltung erhältst du vor dem Druck eine Vorschau zur Freigabe. Prüfe alle Angaben sorgfältig.</li></ol>
<h2>Hinweise zu deinen Dateien</h2>
<p>Verwende möglichst eine hochwertige PDF-Datei oder eine scharfe Grafik in ausreichender Auflösung. Bei beidseitigen Karten müssen Vorder- und Rückseite eindeutig erkennbar sein. Die genauen Vorgaben für Beschnitt und Sicherheitsabstand erhältst du passend zur Druckvorbereitung.</p>
<h2>Bitte beachten</h2>
<p>Farben können zwischen Bildschirmdarstellung und Druck leicht abweichen. Die Produktbilder zeigen Gestaltungsbeispiele; maßgeblich sind die in deiner gewählten Variante angegebenen Papier- und Produkteigenschaften.</p>
<p>Du erhältst die bestellte Anzahl bedruckter Visitenkarten. Kartenhalter, Dekorationen und weitere abgebildete Gegenstände sind nicht enthalten.</p>
HTML,
        'tags' => ['Visitenkarten', 'Karten mit Logo', 'Visitenkarten Druck', 'Eigene Gestaltung', 'Firmenkarten', 'Geschäftskarten', 'Kontaktkarten', 'Logo Druck', 'Salon Visitenkarten', 'Café Visitenkarten', 'Karten gestalten', 'Beidseitiger Druck', 'Individuelle Karten'],
    ],
    'en' => [
        'title' => 'Custom Business Cards with Your Logo & Contact Details – Upload Your Design or Choose Layout Design',
        'slug' => 'custom-business-cards',
        'short' => '<p>Business cards made for your brand. Add your logo, name and contact details using your own print-ready artwork or choose a simple layout created from your information. Available with single-sided or double-sided printing in an 85 × 55 mm format.</p>',
        'content' => <<<'HTML'
<p>Make your next introduction memorable with personalised business cards that suit your brand.</p>
<p>Whether you run a café, beauty studio, barbershop, trade business or professional service, your cards keep your essential details together in a clear, convenient format.</p>
<h2>Upload your design or choose layout support</h2>
<ul><li><strong>Your own artwork:</strong> Upload your finished design for the front and, where applicable, the back of your cards.</li><li><strong>Simple layout design:</strong> Send your existing logo, contact details, colour preferences and preferred font style. We will arrange these into a clear layout according to your selected design option.</li></ul>
<p>Creating a new logo is not included in the simple layout service.</p>
<h2>Choose your options</h2>
<ul><li>Size: 85 × 55 mm</li><li>Single-sided or double-sided printing</li><li>Quantity from the available variations</li><li>Your own artwork or simple layout design</li><li>Landscape or portrait orientation to suit your design</li></ul>
<h2>What can you include?</h2>
<ul><li>Business name and logo</li><li>Your name and job title</li><li>Phone number and email address</li><li>Website and social media profile</li><li>Business address</li><li>A short tagline or selected services</li></ul>
<p>Choose the details most useful to your customers. Keeping the wording concise leaves more space for a readable design.</p>
<h2>How to order</h2>
<ol><li>Select your quantity, printed sides and design option.</li><li>Upload your finished artwork or send your logo and contact information.</li><li>For layout design, add your colour and font preferences.</li><li>For layouts created by us, you will receive a preview for approval before printing. Please check every detail carefully.</li></ol>
<h2>Artwork guidance</h2>
<p>Use a high-quality PDF or sharp, high-resolution artwork wherever possible. For double-sided cards, clearly identify the front and back. Bleed and safe-margin requirements will be provided to match the print setup.</p>
<h2>Please note</h2>
<p>Printed colours may differ slightly from those displayed on your screen. Images show design examples; the paper and product specifications stated in your selected variation apply to your order.</p>
<p>Your order includes the selected quantity of printed business cards. Card holders, props and other decorative items are not included.</p>
HTML,
        'tags' => ['business cards', 'custom business card', 'personalised cards', 'logo business cards', 'business card print', 'double sided cards', 'small business cards', 'salon business cards', 'barber cards', 'cafe business cards', 'contact cards', 'upload your design', 'business stationery'],
    ],
];

$fields = [
    'de' => [
        ['id' => 'printing', 'label' => 'Druckseiten', 'type' => 'select', 'required' => true, 'helperText' => 'Wähle, ob Vorderseite oder Vorder- und Rückseite bedruckt werden.', 'options' => [['label' => 'Einseitig', 'value' => 'single-sided'], ['label' => 'Beidseitig', 'value' => 'double-sided']], 'defaultValue' => 'single-sided', 'price' => 0],
        ['id' => 'design_service', 'label' => 'Gestaltungsoption', 'type' => 'select', 'required' => true, 'helperText' => 'Wähle eine fertige Druckdatei oder eine einfache Layoutgestaltung mit deinem vorhandenen Logo.', 'options' => [['label' => 'Fertiges Design hochladen', 'value' => 'own-artwork'], ['label' => 'Einfaches Layout erstellen lassen', 'value' => 'simple-layout']], 'defaultValue' => 'own-artwork', 'price' => 0],
        ['id' => 'orientation', 'label' => 'Ausrichtung', 'type' => 'select', 'required' => true, 'helperText' => 'Wähle die Ausrichtung passend zu deinem Design.', 'options' => [['label' => 'Querformat', 'value' => 'landscape'], ['label' => 'Hochformat', 'value' => 'portrait']], 'defaultValue' => 'landscape', 'price' => 0],
        ['id' => 'artwork', 'label' => 'Fertige Druckdatei', 'type' => 'file', 'required' => true, 'helperText' => 'Lade dein fertiges Design hoch. Für beidseitige Designs eignet sich eine mehrseitige PDF mit eindeutig benannter Vorder- und Rückseite.', 'showWhen' => ['field' => 'design_service', 'equals' => 'own-artwork'], 'price' => 0],
        ['id' => 'logo', 'label' => 'Vorhandenes Logo', 'type' => 'file', 'required' => false, 'helperText' => 'Optional: Lade dein vorhandenes Logo für die einfache Layoutgestaltung hoch. Die Erstellung eines neuen Logos ist nicht enthalten.', 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'business_name', 'label' => 'Dein Firmenname', 'type' => 'text', 'required' => true, 'helperText' => 'Schreibweise genau so, wie sie auf der Visitenkarte erscheinen soll.', 'placeholder' => 'Firmenname', 'maxLength' => 100, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'customer_name', 'label' => 'Dein Name', 'type' => 'text', 'required' => true, 'helperText' => 'Name und optional Berufsbezeichnung für die Visitenkarte.', 'placeholder' => 'Vor- und Nachname, Berufsbezeichnung', 'maxLength' => 120, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'social_contact_details', 'label' => 'Social Media, Adresse, Telefon und weitere Angaben', 'type' => 'textarea', 'required' => false, 'helperText' => 'Trage nur die Angaben ein, die auf der Karte erscheinen sollen.', 'placeholder' => 'Instagram, Website, Adresse, Telefonnummer …', 'maxLength' => 1200, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'business_email', 'label' => 'Deine geschäftliche E-Mail-Adresse', 'type' => 'text', 'required' => true, 'helperText' => 'E-Mail-Adresse genau so, wie sie gedruckt werden soll.', 'placeholder' => 'name@unternehmen.de', 'maxLength' => 254, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'design_preferences', 'label' => 'Farb- und Schriftwünsche', 'type' => 'textarea', 'required' => false, 'helperText' => 'Beschreibe deine gewünschten Farben und den Stil der Schrift.', 'placeholder' => 'Zum Beispiel Dunkelblau und Beige, klare moderne Schrift.', 'maxLength' => 500, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'additional_notes', 'label' => 'Weitere Hinweise', 'type' => 'textarea', 'required' => false, 'helperText' => 'Optional: zusätzliche Hinweise zu deiner Bestellung.', 'placeholder' => '', 'maxLength' => 500, 'price' => 0],
    ],
    'en' => [
        ['id' => 'printing', 'label' => 'Printed sides', 'type' => 'select', 'required' => true, 'helperText' => 'Choose printing on the front only or on both front and back.', 'options' => [['label' => 'Single-sided', 'value' => 'single-sided'], ['label' => 'Double-sided', 'value' => 'double-sided']], 'defaultValue' => 'single-sided', 'price' => 0],
        ['id' => 'design_service', 'label' => 'Design option', 'type' => 'select', 'required' => true, 'helperText' => 'Choose print-ready artwork or a simple layout using your existing logo.', 'options' => [['label' => 'Upload finished artwork', 'value' => 'own-artwork'], ['label' => 'Simple layout design', 'value' => 'simple-layout']], 'defaultValue' => 'own-artwork', 'price' => 0],
        ['id' => 'orientation', 'label' => 'Orientation', 'type' => 'select', 'required' => true, 'helperText' => 'Choose the orientation that matches your design.', 'options' => [['label' => 'Landscape', 'value' => 'landscape'], ['label' => 'Portrait', 'value' => 'portrait']], 'defaultValue' => 'landscape', 'price' => 0],
        ['id' => 'artwork', 'label' => 'Finished print artwork', 'type' => 'file', 'required' => true, 'helperText' => 'Upload your finished artwork. For double-sided artwork, use a multi-page PDF with the front and back clearly identified.', 'showWhen' => ['field' => 'design_service', 'equals' => 'own-artwork'], 'price' => 0],
        ['id' => 'logo', 'label' => 'Existing logo', 'type' => 'file', 'required' => false, 'helperText' => 'Optional: upload your existing logo for the simple layout service. Creating a new logo is not included.', 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'business_name', 'label' => 'Your business name', 'type' => 'text', 'required' => true, 'helperText' => 'Enter it exactly as it should appear on the business card.', 'placeholder' => 'Business name', 'maxLength' => 100, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'customer_name', 'label' => 'Your name', 'type' => 'text', 'required' => true, 'helperText' => 'Your name and optional job title for the business card.', 'placeholder' => 'First and last name, job title', 'maxLength' => 120, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'social_contact_details', 'label' => 'Social media, address, phone and other details', 'type' => 'textarea', 'required' => false, 'helperText' => 'Enter only the details that should appear on the card.', 'placeholder' => 'Instagram, website, address, phone number …', 'maxLength' => 1200, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'business_email', 'label' => 'Your business email', 'type' => 'text', 'required' => true, 'helperText' => 'Enter the email address exactly as it should be printed.', 'placeholder' => 'name@business.com', 'maxLength' => 254, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'design_preferences', 'label' => 'Colour and font preferences', 'type' => 'textarea', 'required' => false, 'helperText' => 'Describe your preferred colours and font style.', 'placeholder' => 'For example navy and beige with a clean modern font.', 'maxLength' => 500, 'showWhen' => ['field' => 'design_service', 'equals' => 'simple-layout'], 'price' => 0],
        ['id' => 'additional_notes', 'label' => 'Additional notes', 'type' => 'textarea', 'required' => false, 'helperText' => 'Optional: any other information about your order.', 'placeholder' => '', 'maxLength' => 500, 'price' => 0],
    ],
];

$images = [
    ['file' => 'Premium business card design collection-2.png', 'key' => 'featured', 'de' => ['Gestaltungsbeispiele für personalisierte Visitenkarten', 'Personalisierte Visitenkarten – Gestaltungsbeispiele'], 'en' => ['Design examples for custom business cards', 'Custom business cards – design examples']],
    ['file' => 'Four stylish business card designs-1.png', 'key' => 'four-designs', 'de' => ['Vier Gestaltungsbeispiele für Visitenkarten', 'Vier beispielhafte Visitenkarten-Designs'], 'en' => ['Four business card design examples', 'Four example business card designs']],
    ['file' => 'Personalized Business Card Design Options-3.png', 'key' => 'design-options', 'de' => ['Optionen für personalisierte Visitenkarten', 'Beispiele für individuelle Visitenkarten-Gestaltung'], 'en' => ['Custom business card design options', 'Examples of custom business card layouts']],
    ['file' => 'Classic business card dimensions-4.png', 'key' => 'dimensions', 'de' => ['Visitenkartenformat 85 × 55 mm', 'Formatbeispiel: 85 × 55 mm'], 'en' => ['Business card size 85 × 55 mm', 'Size example: 85 × 55 mm']],
    ['file' => 'Single or double-sided business card designs-5.png', 'key' => 'print-sides', 'de' => ['Einseitige und beidseitige Visitenkarten', 'Beispiele für einseitigen und beidseitigen Druck'], 'en' => ['Single-sided and double-sided business cards', 'Examples of single-sided and double-sided printing']],
    ['file' => 'Studio Bella beauty business cards-6.png', 'key' => 'salon-example', 'de' => ['Visitenkarten-Gestaltungsbeispiel für ein Beauty-Studio', 'Beispiel für Beauty-Studio-Visitenkarten'], 'en' => ['Business card design example for a beauty studio', 'Example business cards for a beauty studio']],
];

$variation_rows = [];
foreach (['Brown Kraft' => ['50' => '35', '100' => '50'], 'Grass Paper' => ['50' => '47', '100' => '75'], 'Cotton White' => ['50' => '47', '100' => '75'], 'Cotton Jute' => ['50' => '47', '100' => '75'], 'Cotton Coffee' => ['50' => '47', '100' => '75']] as $paper => $prices) {
    foreach ($prices as $quantity => $price) {
        $variation_rows[] = ['paper' => $paper, 'quantity' => $quantity, 'price' => $price];
    }
}

function kbc_find_product(array $slugs): int {
    foreach ($slugs as $slug) {
        $ids = get_posts(['post_type' => 'product', 'name' => $slug, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'suppress_filters' => true]);
        if ($ids) return (int) $ids[0];
    }
    return 0;
}

function kbc_find_asset(string $key): int {
    $ids = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_kubikart_asset_key', 'meta_value' => 'catalogue/business-cards/' . $key]);
    return $ids ? (int) $ids[0] : 0;
}

function kbc_import_asset(array $def, string $dir): int {
    $existing = kbc_find_asset($def['key']);
    if ($existing) return $existing;
    $source = $dir . '/' . $def['file'];
    if (!is_readable($source)) WP_CLI::error('Missing image: ' . $source);
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $tmp = wp_tempnam($def['file']);
    if (!$tmp || !copy($source, $tmp)) WP_CLI::error('Could not stage image: ' . $def['file']);
    $id = media_handle_sideload(['name' => $def['file'], 'tmp_name' => $tmp], 0, $def['de'][1]);
    if (is_wp_error($id)) WP_CLI::error('Could not import ' . $def['file'] . ': ' . $id->get_error_message());
    update_post_meta($id, '_kubikart_asset_key', 'catalogue/business-cards/' . $def['key']);
    update_post_meta($id, '_kubikart_asset_sha256', hash_file('sha256', $source));
    update_post_meta($id, '_kubikart_asset_source', $def['file']);
    return (int) $id;
}

function kbc_update_asset_text(int $id, array $def): void {
    wp_update_post(['ID' => $id, 'post_title' => $def['de'][1], 'post_excerpt' => 'Gestaltungsbeispiel; abgebildete Dekorationen sind nicht enthalten.']);
    update_post_meta($id, '_wp_attachment_image_alt', $def['de'][0]);
    update_post_meta($id, '_kubikart_text_en_title', $def['en'][1]);
    update_post_meta($id, '_kubikart_text_en_alt', $def['en'][0]);
    update_post_meta($id, '_kubikart_text_en_caption', 'Design example; pictured props are not included.');
}

function kbc_sync_variations(int $product_id, array $rows): void {
    $existing = [];
    foreach (wc_get_products(['parent' => $product_id, 'limit' => -1, 'type' => 'variation', 'return' => 'objects', 'status' => ['publish', 'private', 'draft', 'pending']]) as $variation) {
        $attributes = $variation->get_attributes();
        $key = sanitize_title($attributes['paper-papier'] ?? '') . '|' . sanitize_title($attributes['quantity-stuckzahl'] ?? '');
        $existing[$key] = $variation;
    }

    $wanted = [];
    foreach ($rows as $row) {
        $key = sanitize_title($row['paper']) . '|' . sanitize_title($row['quantity']);
        $wanted[$key] = true;
        $variation = $existing[$key] ?? new WC_Product_Variation();
        if (!$variation->get_id()) $variation->set_parent_id($product_id);
        $variation->set_status('publish');
        $variation->set_attributes(['paper-papier' => $row['paper'], 'quantity-stuckzahl' => $row['quantity']]);
        $variation->set_regular_price($row['price']);
        $variation->set_sale_price('');
        $variation->set_sku('');
        $variation->set_manage_stock(false);
        $variation->set_stock_status('instock');
        $variation->set_weight('');
        $variation->set_length('');
        $variation->set_width('');
        $variation->set_height('');
        $variation->save();
    }

    foreach ($existing as $key => $variation) {
        if (!isset($wanted[$key])) $variation->delete(true);
    }
    WC_Product_Variable::sync($product_id);
    wc_delete_product_transients($product_id);
}

$de_id = kbc_find_product([$copy['de']['slug'], 'visitenkarten']);
if (!$de_id) WP_CLI::error('German business-card draft was not found.');
$translations = function_exists('pll_get_post_translations') ? pll_get_post_translations($de_id) : [];
$en_id = (int) ($translations['en'] ?? 0);
if (!$en_id) $en_id = kbc_find_product([$copy['en']['slug'], 'business-cards']);
if (!$en_id) WP_CLI::error('English business-card draft was not found.');

foreach ($images as $def) {
    if (!is_readable($image_dir . '/' . $def['file'])) WP_CLI::error('Missing or unreadable image: ' . $image_dir . '/' . $def['file']);
}

WP_CLI::line("Products: DE #{$de_id}, EN #{$en_id}");
WP_CLI::line('Will set: localized copy/slugs/tags, six images, format plus paper/quantity attributes, 10 priced variations and 11 personalization fields.');
WP_CLI::line('Will leave unset: SKU, shipping weight and parcel dimensions. Products are published and visible.');
if ($mode === 'dry-run') {
    WP_CLI::success('Dry run complete; no changes made.');
    return;
}

$attachment_ids = [];
foreach ($images as $def) {
    $attachment_id = kbc_import_asset($def, $image_dir);
    kbc_update_asset_text($attachment_id, $def);
    $attachment_ids[] = $attachment_id;
}

foreach (['de' => $de_id, 'en' => $en_id] as $lang => $id) {
    wp_set_object_terms($id, 'variable', 'product_type');
    $product = new WC_Product_Variable($id);
    $product->set_name($copy[$lang]['title']);
    $product->set_slug($copy[$lang]['slug']);
    $product->set_short_description(wp_kses_post($copy[$lang]['short']));
    $product->set_description(wp_kses_post($copy[$lang]['content']));
    $product->set_status('publish');
    $product->set_catalog_visibility('visible');
    $product->set_regular_price('');
    $product->set_sale_price('');
    $product->set_price('');
    $product->set_sku('');
    $product->set_weight('');
    $product->set_length('');
    $product->set_width('');
    $product->set_height('');
    $product->set_image_id($attachment_ids[0]);
    $product->set_gallery_image_ids(array_slice($attachment_ids, 1));
    $format_attribute = new WC_Product_Attribute();
    $format_attribute->set_id(0);
    // Polylang for WooCommerce synchronises custom product attributes across
    // translations. Use the bilingual-safe label "Format" for both products
    // so the last saved translation cannot overwrite the German label.
    $format_attribute->set_name('Format');
    $format_attribute->set_options(['85 × 55 mm']);
    $format_attribute->set_position(0);
    $format_attribute->set_visible(true);
    $format_attribute->set_variation(false);

    $paper_attribute = new WC_Product_Attribute();
    $paper_attribute->set_id(0);
    $paper_attribute->set_name('Paper / Papier');
    $paper_attribute->set_options(['Brown Kraft', 'Grass Paper', 'Cotton White', 'Cotton Jute', 'Cotton Coffee']);
    $paper_attribute->set_position(1);
    $paper_attribute->set_visible(true);
    $paper_attribute->set_variation(true);

    $quantity_attribute = new WC_Product_Attribute();
    $quantity_attribute->set_id(0);
    $quantity_attribute->set_name('Quantity / Stückzahl');
    $quantity_attribute->set_options(['50', '100']);
    $quantity_attribute->set_position(2);
    $quantity_attribute->set_visible(true);
    $quantity_attribute->set_variation(true);
    $product->set_attributes([$format_attribute, $paper_attribute, $quantity_attribute]);
    $product->save();

    kbc_sync_variations($id, $variation_rows);

    update_post_meta($id, '_kubikart_custom_fields', ['schema_version' => 3, 'fields' => $fields[$lang]]);
    update_post_meta($id, '_kubikart_purchase_mode', 'purchase');

    $term_ids = [];
    foreach ($copy[$lang]['tags'] as $tag_name) {
        $term = term_exists($tag_name, 'product_tag');
        if (!$term) $term = wp_insert_term($tag_name, 'product_tag');
        if (is_wp_error($term)) WP_CLI::error('Could not create tag ' . $tag_name . ': ' . $term->get_error_message());
        $term_id = (int) (is_array($term) ? $term['term_id'] : $term);
        if (function_exists('pll_set_term_language')) pll_set_term_language($term_id, $lang);
        $term_ids[] = $term_id;
    }
    wp_set_object_terms($id, $term_ids, 'product_tag', false);
    if (function_exists('pll_set_post_language')) pll_set_post_language($id, $lang);
}

if (function_exists('pll_save_post_translations')) pll_save_post_translations(['de' => $de_id, 'en' => $en_id]);
if (function_exists('kubikart_frontend_revalidate_product')) {
    kubikart_frontend_revalidate_product($de_id, 'updated');
    kubikart_frontend_revalidate_product($en_id, 'updated');
}

WP_CLI::success("Updated published products DE #{$de_id} and EN #{$en_id} with media IDs " . implode(', ', $attachment_ids) . '.');
