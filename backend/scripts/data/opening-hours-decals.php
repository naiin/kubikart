<?php
/**
 * Content for create-opening-hours-decals.php: the custom opening-hours window decal (German + English).
 *
 * Prices are the owner's approved figures for the decal only (single order, plus shipping): 19.99 / 26.99 / 34.99 EUR
 * for an overall width of 20 / 30 / 40 cm. Local on-site installation is an optional +100.00 EUR package.
 */

if (!defined('ABSPATH')) {
    exit;
}

$ph = static fn(string $de, string $en): array => ['de' => $de, 'en' => $en];

return [
    'key' => 'opening_hours_decal',
    'asset_prefix' => 'catalogue/opening-hours',
    'placeholder_name' => 'Opening hours decal',
    'de_slug' => 'oeffnungszeiten-aufkleber',
    'en_slug' => 'opening-hours-window-decal',
    // The unpublished placeholder drafts created by configure-business-kits.php; converted instead of duplicated.
    'legacy_de_slugs' => ['oeffnungszeiten-folie'],
    'legacy_en_slugs' => ['opening-hours-vinyl-decal'],
    'name' => $ph(
        'Öffnungszeiten-Aufkleber nach Wunsch – Individuelle Fensterbeschriftung aus ORACAL® Folie',
        'Custom Opening Hours Window Decal – Personalised Business Lettering in ORACAL® Vinyl'
    ),
    'short' => $ph(
        'Deine Öffnungszeiten übersichtlich auf Fenster oder Glastür: Individuell geschnittene Beschriftung aus hochwertiger ORACAL® Markenfolie. Wähle Größe, Folienfarbe und Schrift und ergänze auf Wunsch deinen Firmennamen.',
        'Display your opening hours clearly on your shop window or glass door. Made from quality ORACAL® branded vinyl, with your choice of size, available colour and font. Add your business name if required.'
    ),
    'description' => [
        'de' => '<p>Zeige deinen Kunden auf einen Blick, wann du für sie da bist. Unsere individuelle Öffnungszeiten-Beschriftung passt zu Cafés, Restaurants, Salons, Studios, Praxen und Geschäften.</p>'
            . '<p>Deine Angaben werden aus hochwertiger ORACAL® Markenfolie geschnitten. Nach der Montage bleiben nur Buchstaben, Zahlen und Gestaltungselemente auf dem Glas – ohne rechteckigen Hintergrund.</p>'
            . '<p><strong>Individuell für dein Geschäft</strong></p>'
            . '<ul><li>Deine Wochentage und Öffnungszeiten</li><li>Optional Firmenname oder kurzer Hinweis, etwa „Termine nach Vereinbarung“</li>'
            . '<li>Folienfarbe und Schrift aus den angebotenen Optionen</li><li>Größe entsprechend der gewählten Variante</li></ul>'
            . '<p>Die gewählte Breite bezieht sich auf das gesamte Motiv. Die Höhe ergibt sich aus Textmenge und Layout.</p>'
            . '<p><strong>Größen &amp; Wunschmaß</strong></p>'
            . '<p>Wähle eine Gesamtbreite von <strong>20, 30 oder 40 cm</strong>. Die Höhe ergibt sich aus deinen Öffnungszeiten, der Schrift und dem gewählten Layout. Die Breite bezieht sich auf die gesamte Beschriftung, nicht auf einzelne Buchstaben.</p>'
            . '<p>Du benötigst eine andere Größe? Wähle <strong>„Wunschmaß anfragen“</strong> und trage deine gewünschte Breite sowie die maximal verfügbare Höhe in Zentimetern ein.</p>'
            . '<p>Wir prüfen Lesbarkeit und Umsetzbarkeit und bestätigen die endgültigen Maße und den Preis vor der Bestellung einer Sondergröße.</p>'
            . '<p><strong>So bestellst du</strong></p>'
            . '<p>Wähle Größe und Farbe und trage deine Öffnungszeiten vollständig ein. Gib außerdem an, auf welcher Seite der Scheibe die Beschriftung angebracht und von welcher Seite sie gelesen werden soll. Vor der Fertigung erhältst du eine Layoutvorschau zur Freigabe.</p>'
            . '<p><strong>Montage und Lieferumfang</strong></p>'
            . '<p>Du erhältst deine vorbereitete Folienbeschriftung mit Übertragungsfolie und einer Montageanleitung zur Selbstmontage. Optional kannst du im Nahbereich eine Vor-Ort-Montage hinzubuchen.</p>'
            . '<p>Für saubere, glatte und geeignete Glasflächen vorgesehen. Die Eignung beschichteter oder speziell behandelter Scheiben muss vorab geprüft werden. Eine Montage vor Ort ist nur enthalten, wenn du sie ausdrücklich hinzubuchst.</p>'
            . '<p>Abgebildete Türen, Fenster und Dekorationen gehören nicht zum Lieferumfang. Farben können am Bildschirm leicht abweichen.</p>',
        'en' => '<p>Let customers know when you are open with window lettering personalised for your café, restaurant, salon, studio, practice or shop.</p>'
            . '<p>Your design is cut from quality ORACAL® vinyl. Once applied, only the lettering and design elements remain on the glass, with no rectangular background.</p>'
            . '<p>Customise your opening hours, available vinyl colour, font and overall size. Optional wording can include your business name or a short message such as “By appointment”.</p>'
            . '<p>The selected width refers to the complete design. Height depends on the wording and layout.</p>'
            . '<p><strong>Sizes &amp; custom dimensions</strong></p>'
            . '<p>Choose an overall design width of <strong>20, 30 or 40 cm</strong>. Height depends on your opening hours, font and layout. Width refers to the complete lettering design, rather than individual letters.</p>'
            . '<p>For another size, select <strong>“Request custom size”</strong> and enter your preferred width and maximum available height in centimetres.</p>'
            . '<p>We will check readability and suitability and confirm the final dimensions and price before you order a custom size.</p>'
            . '<p><strong>How to order</strong></p>'
            . '<p>When ordering, provide your full opening hours and specify which side of the glass the lettering will be applied to and viewed from. A layout preview is provided for approval before production.</p>'
            . '<p><strong>Installation and what is included</strong></p>'
            . '<p>Supplied with transfer tape and application instructions for self-installation. Local on-site installation can be added as an option. Intended for suitable clean, smooth glass. Coated or specially treated glass requires a suitability check. On-site installation is only included if you add it to your order.</p>'
            . '<p>Windows, doors and decorative props are not included. Screen colours may differ slightly from the actual vinyl.</p>',
    ],
    'categories' => [
        'de' => ['oeffnungszeiten-aufkleber', 'fenster-glasaufkleber', 'business-produkte'],
        'en' => ['opening-hours-stickers', 'window-glass-stickers', 'business-products'],
    ],
    'tags' => [
        'de' => ['Öffnungszeiten', 'Fensterbeschriftung', 'Türbeschriftung', 'Geschäftszeiten', 'Schaufensterfolie', 'Öffnungszeiten Folie', 'Ladenbeschriftung', 'Salon Aufkleber', 'Café Beschriftung', 'Praxis Beschriftung', 'ORACAL Folie', 'Wunschtext Folie', 'Glasbeschriftung'],
        'en' => ['opening hours decal', 'business hours sign', 'shop window decal', 'opening times decal', 'door lettering', 'custom window vinyl', 'salon window decal', 'cafe window decal', 'shop door sticker', 'ORACAL vinyl', 'custom shop sign', 'glass lettering', 'business lettering'],
    ],
    'attributes' => [
        'pa_gesamtbreite' => ['de' => 'Gesamtbreite', 'en' => 'Overall width'],
    ],
    // term key => [de label, en label, price]
    'widths' => [
        '20' => ['de' => '20 cm', 'en' => '20 cm', 'price' => '19.99'],
        '30' => ['de' => '30 cm', 'en' => '30 cm', 'price' => '26.99'],
        '40' => ['de' => '40 cm', 'en' => '40 cm', 'price' => '34.99'],
        // No price: selecting it turns the purchase controls into a custom-size enquiry on the product page.
        'request' => ['de' => 'Wunschmaß anfragen', 'en' => 'Request custom size'],
    ],
    'fields' => [
        ['id' => 'oeffnungszeiten', 'type' => 'textarea', 'required' => true, 'max' => 400,
            'label' => $ph('Deine Öffnungszeiten', 'Your opening hours'),
            'placeholder' => $ph('z. B. Mo–Fr 09:00–18:00, Sa 09:00–14:00, So geschlossen', 'e.g. Mon–Fri 09:00–18:00, Sat 09:00–14:00, Sun closed'),
            'help' => $ph('Bitte vollständig und genau so angeben, wie es auf dem Glas stehen soll.', 'Please enter them in full, exactly as they should appear on the glass.')],
        ['id' => 'hinweis', 'type' => 'text', 'required' => false, 'max' => 60,
            'label' => $ph('Firmenname oder Hinweis (optional)', 'Business name or note (optional)'),
            'placeholder' => $ph('z. B. Termine nach Vereinbarung', 'e.g. By appointment')],
        ['id' => 'folienfarbe', 'type' => 'select', 'required' => true,
            'label' => $ph('Folienfarbe', 'Vinyl colour'),
            'help' => $ph('Weitere Farben auf Anfrage.', 'Other colours on request.'),
            'options' => [['black', $ph('Schwarz', 'Black')], ['white', $ph('Weiß', 'White')], ['gold', $ph('Gold', 'Gold')]]],
        ['id' => 'schrift', 'type' => 'select', 'required' => true, 'default' => 'modern',
            'label' => $ph('Schrift', 'Font'),
            'options' => [
                ['modern', $ph('Modern', 'Modern')], ['elegant', $ph('Elegant', 'Elegant')], ['handschrift', $ph('Handschrift', 'Handwriting')],
                ['custom', $ph('Andere Schrift (bitte angeben)', 'Other font (please specify)')],
            ]],
        ['id' => 'wunschschrift', 'type' => 'text', 'required' => true, 'max' => 80, 'showWhen' => ['schrift', 'custom'],
            'label' => $ph('Gewünschte Schrift', 'Preferred font'),
            'placeholder' => $ph('Name der Schrift oder Link', 'Font name or link'),
            'help' => $ph('Ob sich die Schrift als Folienbeschriftung umsetzen lässt, bestätigen wir dir vor der Fertigung.', 'We confirm before production whether the font can be cut as vinyl lettering.')],
        ['id' => 'anbringung', 'type' => 'select', 'required' => true,
            'label' => $ph('Anbringung und Leserichtung', 'Application side and reading side'),
            'help' => $ph('Auf welcher Seite der Scheibe wird die Beschriftung angebracht und von welcher Seite soll sie gelesen werden?', 'Which side of the glass is the lettering applied to, and from which side should it be read?'),
            'options' => [
                ['innen-von-aussen', $ph('Innen angebracht, von außen lesbar', 'Applied inside, read from outside')],
                ['innen-von-innen', $ph('Innen angebracht, von innen lesbar', 'Applied inside, read from inside')],
                ['aussen-von-aussen', $ph('Außen angebracht, von außen lesbar', 'Applied outside, read from outside')],
                ['aussen-von-innen', $ph('Außen angebracht, von innen lesbar', 'Applied outside, read from inside')],
            ]],
        ['id' => 'glas_foto', 'type' => 'file', 'required' => false,
            'label' => $ph('Foto der Glasfläche (optional)', 'Photo of the glass (optional)'),
            'help' => $ph('Hilft uns bei der Prüfung von Größe und Untergrund. Für die Vor-Ort-Montage bitte unbedingt hochladen.', 'Helps us check size and surface. Please always upload one if you book on-site installation.')],
        ['id' => 'montage', 'type' => 'checkbox', 'required' => false, 'price' => 100,
            'label' => $ph('Vor-Ort-Montage im Nahbereich', 'Local on-site installation'),
            'help' => $ph(
                'Optional. Im Nahbereich (bis 15 km Fahrstrecke ab Blaustein): eine zugängliche Glastür, Reinigung, Positionierung und Anbringung, bis zu 60 Minuten vor Ort. Ohne Entfernen vorhandener Beschriftung oder starker Klebstoffreste. Längere Anfahrt, weitere Türen oder schwierige Untergründe: bitte Anfrage senden. Wir bestätigen Adresse und Foto der Glasfläche, bevor der Montagetermin feststeht.',
                'Optional. Within the local area (up to 15 km driving distance from Blaustein): one accessible glass door, cleaning, positioning and application, up to 60 minutes on site. Excludes removing existing lettering or heavy adhesive residue. For longer journeys, additional doors or difficult surfaces please send an enquiry. We confirm the address and the photo of the glass before the installation appointment is fixed.'
            )],
        ['id' => 'montageadresse', 'type' => 'text', 'required' => true, 'max' => 150, 'showWhen' => ['montage', 'true'],
            'label' => $ph('Montageadresse', 'Installation address'),
            'placeholder' => $ph('Straße, PLZ, Ort', 'Street, postcode, town')],
        ['id' => 'entfernen', 'type' => 'select', 'required' => true, 'default' => 'no', 'showWhen' => ['montage', 'true'],
            'label' => $ph('Vorhandene Beschriftung entfernen?', 'Remove existing lettering?'),
            'options' => [['no', $ph('Nein', 'No')], ['yes', $ph('Ja – gesondertes Angebot', 'Yes – separate quote')]]],
        ['id' => 'anmerkungen', 'type' => 'textarea', 'required' => false, 'max' => 500,
            'label' => $ph('Weitere Wünsche (optional)', 'Additional requests (optional)'),
            'placeholder' => $ph('z. B. Logo-Hinweis oder besondere Anordnung', 'e.g. logo notes or a special layout')],
    ],
    // Gallery order follows the list; the first image is the featured image.
    'images' => [
        ['role' => '01-main', 'file' => '01-Opening-Hours/01-main.png', 'sha256' => 'd81898c45850b3bf0c5466f3dbf85fc25cc358c045dac6cbde54947785e20cff',
            'title' => $ph('Öffnungszeiten-Beschriftung auf einer Glastür', 'Opening-hours lettering on a glass door'),
            'alt' => $ph('Weiße Öffnungszeiten-Beschriftung mit dem Namen „Studio Bella“ auf der Glastür eines Salons', 'White opening-hours lettering with the name “Studio Bella” on the glass door of a salon'),
            'caption' => $ph('Gestaltungsbeispiel. Tür, Glas und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Door, glass and decoration are not included.')],
        ['role' => '02-sizes', 'file' => '01-Opening-Hours/02-sizes.png', 'sha256' => 'f631c24ea807fa56117907595f839d420f64b0c29d26d530c09f076981d6b578',
            'title' => $ph('Drei Breiten: 20, 30 und 40 cm', 'Three widths: 20, 30 and 40 cm'),
            'alt' => $ph('Drei Öffnungszeiten-Beschriftungen auf Übertragungsfolie mit den Breiten 20, 30 und 40 cm', 'Three opening-hours lettering examples on transfer tape with widths of 20, 30 and 40 cm'),
            'caption' => $ph('Beispielgrößen. Die Höhe hängt vom Layout ab.', 'Example sizes. Height depends on the layout.')],
        ['role' => '03-colours', 'file' => '01-Opening-Hours/03-colours.png', 'sha256' => '15c1dcd5e90f67497d71ac344d761e7c1a49cdc97a0993617b0808d9280df040',
            'title' => $ph('Folienfarben Schwarz, Weiß und Gold', 'Vinyl colours black, white and gold'),
            'alt' => $ph('Öffnungszeiten-Beschriftung in Schwarz, Weiß und Gold auf drei Glasscheiben mit Holzfuß', 'Opening-hours lettering in black, white and gold on three glass panes with wooden bases'),
            'caption' => $ph('Gestaltungsbeispiele. Weitere Farben auf Anfrage. Glasscheiben und Holzfüße gehören nicht zum Lieferumfang.', 'Design examples. Other colours on request. Glass panes and wooden bases are not included.')],
        ['role' => '04-cafe', 'file' => '01-Opening-Hours/04-cafe.png', 'sha256' => 'bf7a2a33be527c30cc29784b1ae804c7742009f685bc0891ee8ee7f44516a5eb',
            'title' => $ph('Öffnungszeiten-Beschriftung im Café', 'Opening-hours lettering at a café'),
            'alt' => $ph('Weiße Öffnungszeiten-Beschriftung mit dem Namen „Café Luna“ auf einer Glastür', 'White opening-hours lettering with the name “Café Luna” on a glass door'),
            'caption' => $ph('Gestaltungsbeispiel. Namen sind Beispiele; Tür und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names are examples; the door and decoration are not included.')],
    ],
];
