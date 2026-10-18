<?php
/**
 * Applies the approved content, price, personalisation and purchase
 * configuration to the five Business Kits and their English translations, the
 * German "Business-Pakete" category name and a few industry texts.
 *
 * Usage (from the backend folder; `lando wp` or, in the container,
 * `wp --allow-root`):
 *   wp eval-file scripts/configure-business-kits.php                  # dry run (default), writes nothing
 *   wp eval-file scripts/configure-business-kits.php apply <images-dir> # snapshot first, then write
 *   wp eval-file scripts/configure-business-kits.php rollback <file>  # restore a snapshot
 *   wp eval-file scripts/configure-business-kits.php apply <images-dir> append-industry-products
 *                                  # ALSO appends default products missing from curated industry product lists
 *                                  # (adds only, never removes or reorders)
 *   wp eval-file scripts/configure-business-kits.php apply <images-dir> reset-industries
 *                                  # ALSO replaces the industry bundle/product lists with the defaults below
 *                                  # (without it, lists curated in the editor are never touched)
 *
 * <images-dir> is the reviewed Kubikart-Business-Kits image archive (folders
 * starter/gastro/friseur/empfang/fenster, PNG originals; never modified).
 * It is only needed when media has to be imported; KUBIKART_KIT_IMAGES_DIR
 * works as well. Dry runs accept it too, to verify the checksums.
 *
 * Kits are found by their German slug and their Polylang translation, industries
 * and the category by slug; numeric IDs are never assumed. Reruns are idempotent
 * (stable content IDs, nothing is written when nothing differs). Take a database
 * backup before `apply` on any environment other than local development.
 * Original kit images are remembered once in `_kubikart_kit_original_images`.
 */

if (!defined('ABSPATH')) {
    exit;
}

$STD_HELP = [
    'logo' => [
        'de' => 'Dein vorhandenes Logo. Enthalten ist die Anpassung an dein Logo, keine Neugestaltung. Ist die Datei für die Fertigung ungeeignet, melden wir uns vor der Produktion bei dir.',
        'en' => 'Your existing logo. The bundle includes adapting the design to your logo, not designing a new one. If the file is unsuitable for production, we contact you before production starts.',
    ],
    'logo_vinyl' => [
        'de' => 'Dein vorhandenes Logo. Für Folienbeschriftungen muss es sich einfarbig schneiden lassen (keine Fotos oder Farbverläufe). Ist die Datei ungeeignet, melden wir uns vor der Produktion bei dir.',
        'en' => 'Your existing logo. For vinyl lettering it must be suitable for single-colour cutting (no photos or gradients). If the file is unsuitable, we contact you before production starts.',
    ],
    'colour' => [
        'de' => 'Zum Beispiel Schwarz/Weiß oder Dunkelblau/Orange. Die endgültige Material- und Farbkombination stimmen wir im digitalen Entwurf mit dir ab.',
        'en' => 'For example black/white or navy/orange. The final material and colour combination is agreed with you in the digital proof.',
    ],
];

function kk_f(string $id, string $type, bool $required, array $label, array $extra = []): array {
    return array_merge(['id' => $id, 'type' => $type, 'required' => $required, 'label' => $label], $extra);
}

function kk_ph(string $de, string $en): array {
    return ['de' => $de, 'en' => $en];
}

function kk_shared(array $help, bool $vinyl = false, ?array $colour_label = null): array {
    return [
        kk_f('business_name', 'text', true, ['de' => 'Firmenname', 'en' => 'Business name'], [
            'max' => 60,
            'placeholder' => kk_ph('z. B. Salon Müller', 'e.g. Salon Müller'),
            'help' => kk_ph('So soll dein Name auf dem Paket erscheinen.', 'This is how your name should appear on the bundle.'),
        ]),
        kk_f('logo', 'file', true, ['de' => 'Dein Logo', 'en' => 'Your logo'], [
            'help' => $vinyl ? $help['logo_vinyl'] : $help['logo'],
        ]),
        kk_f('colour', 'text', true, $colour_label ?? ['de' => 'Gewünschte Farbkombination', 'en' => 'Requested colour combination'], [
            'max' => 80,
            'placeholder' => kk_ph('z. B. Schwarz/Weiß', 'e.g. black/white'),
            'help' => $help['colour'],
        ]),
    ];
}

function kk_qr_fields(array $q1, array $q2): array {
    return [
        kk_f('qr1_label', 'text', true, ['de' => 'QR-Code 1: Beschriftung', 'en' => 'QR code 1: label'], ['max' => 40, 'placeholder' => $q1['label']]),
        kk_f('qr1_url', 'url', true, ['de' => 'QR-Code 1: Ziel-Link', 'en' => 'QR code 1: destination link'], ['max' => 300, 'placeholder' => $q1['url']]),
        kk_f('qr2_label', 'text', true, ['de' => 'QR-Code 2: Beschriftung', 'en' => 'QR code 2: label'], ['max' => 40, 'placeholder' => $q2['label']]),
        kk_f('qr2_url', 'url', true, ['de' => 'QR-Code 2: Ziel-Link', 'en' => 'QR code 2: destination link'], ['max' => 300, 'placeholder' => $q2['url']]),
        kk_f('nfc_target', 'select', true, ['de' => 'NFC-Chip öffnet', 'en' => 'NFC chip opens'], [
            'help' => kk_ph('Der NFC-Chip öffnet eines der beiden Ziele – ein drittes Ziel ist nicht nötig.', 'The NFC chip opens one of the two destinations – no third link is needed.'),
            'options' => [['qr1', kk_ph('QR-Code 1', 'QR code 1')], ['qr2', kk_ph('QR-Code 2', 'QR code 2')]],
            'default' => 'qr1',
        ]),
    ];
}

function kk_size_field(string $id, array $label, string $max): array {
    return kk_f($id, 'text', true, $label, [
        'max' => 30,
        'placeholder' => kk_ph('z. B. 25 × 15 cm', 'e.g. 25 × 15 cm'),
        'help' => kk_ph("Breite × Höhe in cm, höchstens {$max}.", "Width × height in cm, at most {$max}."),
    ]);
}

$google = kk_ph('z. B. Google-Bewertung', 'e.g. Google review');
$googleUrl = kk_ph('https://g.page/r/…', 'https://g.page/r/…');
$insta = kk_ph('z. B. Instagram', 'e.g. Instagram');
$instaUrl = kk_ph('https://www.instagram.com/…', 'https://www.instagram.com/…');

$application_side = kk_f('application_side', 'select', true, ['de' => 'Anbringung am Glas', 'en' => 'Application on the glass'], [
    'help' => kk_ph(
        'Außen: die Folie wird außen aufs Glas geklebt. Innen: sie wird innen aufs Glas geklebt und ist von außen lesbar – dafür schneiden wir nur die Folienbeschriftungen spiegelverkehrt.',
        'Outside: the vinyl is applied to the outside of the glass. Inside: it is applied to the inside and read from outside – for this we mirror-cut only the vinyl lettering.'
    ),
    'options' => [
        ['outside', kk_ph('Außen auf dem Glas', 'Outside of the glass')],
        ['inside', kk_ph('Innen auf dem Glas, von außen lesbar', 'Inside of the glass, readable from outside')],
    ],
    'default' => 'outside',
]);

$notes = kk_f('notes', 'textarea', false, ['de' => 'Weitere Hinweise', 'en' => 'Additional notes'], ['max' => 500]);

$design_item = function (array $subject): array {
    return [
        'icon' => 'design', 'title' => kk_ph('Gestaltungsanpassung', 'Design adaptation'),
        'qty' => 1,
        'desc' => [
            'de' => "Anpassung {$subject['de']} an dein vorhandenes Logo und deine Farbkombination, ein digitaler Entwurf zur Freigabe und eine gebündelte Korrekturrunde vor der Fertigung. Die Gestaltung eines neuen Logos ist nicht enthalten.",
            'en' => "Adaptation {$subject['en']} to your existing logo and colour combination, one digital proof for approval and one consolidated revision before production. Designing a new logo is not included.",
        ],
    ];
};

$stand_item = [
    'icon' => 'stand', 'title' => kk_ph('Personalisierter Acryl-Aufsteller mit QR-/NFC-Funktion', 'Personalised acrylic QR/NFC stand'),
    'qty' => 1,
    'desc' => kk_ph(
        'Acryl-Aufsteller, ca. 15 × 20 cm, mit zwei beschrifteten QR-Codes und einem NFC-Chip.',
        'Acrylic stand, approx. 15 × 20 cm, with two labelled QR codes and one NFC chip.'
    ),
];

$std_summary = kk_ph(
    'Mit vorhandenem Logo · digitaler Entwurf vor Fertigung · eine Korrekturrunde inklusive · ohne Montage',
    'With your existing logo · digital proof before production · one consolidated revision included · installation not included'
);

$std_outro = kk_ph(
    '<p><strong>Nicht enthalten</strong> sind die Gestaltung eines neuen Logos und die Montage. Der angezeigte Preis ist ein Ab-Preis für den beschriebenen Umfang. Der endgültige Preis hängt von deinen Anforderungen ab; Umfang, Preis und Versand stimmen wir nach deiner Anfrage persönlich mit dir ab. Für andere Größen, Mengen, aufwendigere Gestaltung oder Montage erstellen wir dir gern ein individuelles Angebot.</p>',
    '<p><strong>Not included:</strong> designing a new logo and installation. The price shown is a starting price for the scope described. The final price depends on your requirements; we agree scope, price and shipping with you personally after your enquiry. For other sizes, quantities, more complex artwork or installation we are happy to prepare an individual offer.</p>'
);

$hours_field = kk_f('opening_hours', 'textarea', true, ['de' => 'Öffnungszeiten', 'en' => 'Opening hours'], [
    'max' => 300,
    'placeholder' => kk_ph("Mo–Fr 9–18 Uhr\nSa 10–14 Uhr", "Mon–Fri 9am–6pm\nSat 10am–2pm"),
    'help' => kk_ph('Genau so, wie sie auf der Folie stehen sollen.', 'Exactly as they should appear on the decal.'),
]);

$KITS = [
    'starter' => [
        'de_slug' => 'starter-visibility-kit-de',
        'images' => [],
        // Starting price (WooCommerce regular price) of an enquiry-only bundle.
        'price' => '220',
        'name' => kk_ph('Business-Starterpaket', 'Business Starter Bundle'),
        'short' => kk_ph(
            'Der Einstieg in einen stimmigen Geschäftsauftritt: 100 Visitenkarten, ein QR-Aufsteller sowie Öffnungszeiten und Logo als Vinylfolie.',
            'A coordinated start for your business presentation: 100 business cards, a QR stand, and opening hours and a logo as vinyl decals.'
        ),
        'content' => kk_ph(
            '<p>Das Business-Starterpaket bündelt die Grundlagen für deinen sichtbaren Auftritt: Visitenkarten für den Kundenkontakt, einen QR-Aufsteller für Bewertungen, Website oder Social Media sowie zwei Vinylfolien für Tür oder Schaufenster.</p><p>Der angezeigte Preis ist ein Ab-Preis für diesen Grundumfang. Nach deiner Anfrage melden wir uns bei dir, besprechen deine Anforderungen und bereiten ein Angebot vor.</p><p>Welcher QR-Aufsteller (Modell und Material) und welche Druckausführung der Visitenkarten (Papier, Format, Veredelung) im Paket enthalten sind, bestätigen wir dir im Angebot.</p>',
            '<p>The Business Starter Bundle combines the basics for a visible business presence: business cards for customer contact, a QR stand for reviews, your website or social media, and two vinyl decals for your door or shop window.</p><p>The price shown is a starting price for this base scope. After your enquiry we get in touch, discuss your requirements and prepare an offer.</p><p>Which QR stand (model and material) and which print specification of the business cards (paper, format, finish) are part of the bundle is confirmed to you in the offer.</p>'
        ),
        'summary' => kk_ph(
            'Grundumfang · größere oder zusätzliche Fensterbeschriftungen nur nach Angebot · ohne Montage',
            'Base scope · larger or additional window graphics by quote only · installation not included'
        ),
        'items' => [
            ['icon' => 'sheet', 'title' => kk_ph('Visitenkarten', 'Business cards'), 'qty' => 100, 'desc' => kk_ph('Gedruckt nach deinen Angaben. Papier, Format und Veredelung bestätigen wir im Angebot.', 'Printed to your details. Paper, format and finish are confirmed in the offer.')],
            ['icon' => 'stand', 'title' => kk_ph('QR-Aufsteller', 'QR stand'), 'qty' => 1, 'desc' => kk_ph('Ein QR-Aufsteller. Modell und Material bestätigen wir im Angebot.', 'One QR stand. Model and material are confirmed in the offer.')],
            ['icon' => 'decal-hours', 'title' => kk_ph('Öffnungszeiten aus Vinylfolie', 'Opening-hours vinyl decal'), 'qty' => 1, 'desc' => kk_ph('Einfarbige Vinylfolie, maximale Gesamtgröße (Begrenzungsrahmen) 300 × 400 mm. Die endgültigen Proportionen hängen von der Gestaltung ab.', 'Single-colour vinyl decal, maximum overall size (bounding box) 300 × 400 mm. The final proportions depend on the artwork.')],
            ['icon' => 'decal-logo', 'title' => kk_ph('Kleine Logo-Folie aus Vinyl', 'Small logo vinyl decal'), 'qty' => 1, 'desc' => kk_ph('Einfarbige Vinylfolie, maximale Gesamtgröße (Begrenzungsrahmen) 250 × 250 mm. Die endgültigen Proportionen hängen von der Gestaltung ab.', 'Single-colour vinyl decal, maximum overall size (bounding box) 250 × 250 mm. The final proportions depend on the artwork.')],
        ],
        'fields' => [],
        'outro' => kk_ph(
            '<p><strong>Nicht enthalten</strong> sind vollflächige Fensterbeschriftungen, Montage, die Gestaltung eines neuen Logos und unbegrenzte Korrekturen. Größere oder zusätzliche Fensterbeschriftungen erstellen wir dir gern als Zusatzangebot. Menüs und Aufkleber sind ergänzende Produkte und nicht im Ab-Preis enthalten.</p>',
            '<p><strong>Not included:</strong> full-window graphics, installation, designing a new logo and unlimited revisions. Larger or additional window graphics are quoted separately. Menus and stickers are complementary products and are not included in the starting price.</p>'
        ),
    ],
    'gastro' => [
        'de_slug' => 'gastro-visibility-kit-de',
        'images' => [],
        'price' => '229',
        'name' => kk_ph('Gastro-Paket', 'Café & Restaurant Bundle'),
        'short' => kk_ph(
            'Ein einheitlicher Auftritt für Theke und Tische: personalisierter Bewertungsaufsteller, fünf Speisekarten-Aufsteller und zwei laminierte A3-Menüblätter.',
            'One consistent look for counter and tables: a personalised review stand, five menu table stands and two laminated A3 menu sheets.'
        ),
        'content' => kk_ph(
            '<p>Mach deine Speisekarte und deine Online-Kontaktpunkte im Gastraum leicht zugänglich. Das Gastro-Paket kombiniert einen individuell gestalteten Aufsteller für die Theke mit fünf kompakten QR-Aufstellern für deine Tische.</p><p>Die Tischaufsteller führen zu deiner bestehenden digitalen Speisekarte. Der Thekenaufsteller bietet Platz für zwei Ziele, etwa Google-Bewertungen und Instagram. Ergänzend erhältst du zwei laminierte A3-Ausdrucke deiner druckfertig gelieferten Speisekarte.</p><p>Farben, Logo und Beschriftungen werden aufeinander abgestimmt. So entsteht ein zusammengehöriges Set für Café, Imbiss oder Restaurant.</p><p><strong>Wichtig:</strong> Eine digitale Speisekarte wird nicht erstellt oder gehostet. Du lieferst einen funktionierenden Link zu deiner Speisekarte und eine druckfertige A3-PDF-Datei. Gestaltung der Karte, Preisänderungen und Abtippen sind nicht enthalten. Alle fünf Tischaufsteller haben dasselbe Design und dasselbe Ziel.</p>',
            '<p>Make your menu and your online touchpoints easy to reach in the dining area. The Café & Restaurant Bundle combines an individually designed counter stand with five compact QR stands for your tables.</p><p>The table stands lead to your existing digital menu. The counter stand has room for two destinations, such as Google reviews and Instagram. You also receive two laminated A3 prints of your print-ready menu.</p><p>Colours, logo and lettering are matched to each other, creating a coherent set for a café, snack bar or restaurant.</p><p><strong>Please note:</strong> a digital menu is not created or hosted. You supply a working link to your menu and a print-ready A3 PDF. Menu layout, price edits and retyping are not included. All five table stands share the same design and destination.</p>'
        ),
        'summary' => $std_summary,
        'items' => [
            array_merge($stand_item, ['title' => kk_ph('Personalisierter Acryl-Aufsteller für die Theke', 'Personalised acrylic counter stand')]),
            ['icon' => 'table-stand', 'title' => kk_ph('Tischaufsteller aus Acryl', 'Acrylic table stands'), 'qty' => 5, 'desc' => kk_ph('Passende kompakte Aufsteller, ca. 10 × 15 cm, je mit einem Menü-QR-Code, ohne NFC. Alle fünf haben dasselbe Design und dasselbe Ziel.', 'Matching compact stands, approx. 10 × 15 cm, each with one menu QR code, without NFC. All five share the same design and destination.')],
            ['icon' => 'sheet', 'title' => kk_ph('Laminierte A3-Menüblätter', 'Laminated A3 menu sheets'), 'qty' => 2, 'desc' => kk_ph('Einseitig laminiert, gedruckt nach derselben von dir gelieferten druckfertigen PDF-Datei.', 'Single-sided laminated, printed from the same print-ready PDF that you supply.')],
            $design_item(['de' => 'der Aufsteller', 'en' => 'of the stands']),
        ],
        'fields' => array_merge(
            kk_shared($STD_HELP),
            kk_qr_fields(['label' => $google, 'url' => $googleUrl], ['label' => $insta, 'url' => $instaUrl]),
            [
                kk_f('menu_url', 'url', true, ['de' => 'Link zu deiner digitalen Speisekarte', 'en' => 'Link to your digital menu'], [
                    'max' => 300,
                    'placeholder' => kk_ph('https://deine-speisekarte.de', 'https://your-menu.example'),
                    'help' => kk_ph('Alle fünf Tischaufsteller führen zu diesem Link.', 'All five table stands lead to this link.'),
                ]),
                kk_f('menu_pdf', 'file', true, ['de' => 'Druckfertige Speisekarte (A3-PDF)', 'en' => 'Print-ready menu (A3 PDF)'], [
                    'help' => kk_ph('Druckfertige PDF-Datei im Format A3 für die zwei laminierten Blätter. Gestaltung, Preisänderungen und Abtippen sind nicht enthalten. Ist die Datei größer als 4 MB, schicke sie nach der Bestellung per E-Mail an info@kubikart.de und nenne die Bestellnummer.', 'Print-ready A3 PDF for the two laminated sheets. Menu layout, price edits and retyping are not included. If the file is larger than 4 MB, e-mail it to info@kubikart.de after ordering and quote your order number.'),
                ]),
                $notes,
            ]
        ),
        'outro' => $std_outro,
    ],
    'barber' => [
        'de_slug' => 'barber-salon-kit-de',
        'images' => [],
        'price' => '149',
        'name' => kk_ph('Friseur- & Barber-Paket', 'Barber & Salon Bundle'),
        'short' => kk_ph(
            'Dein Salon im passenden Look: ein individueller QR-/NFC-Aufsteller, zwei Spiegelbeschriftungen und eine laminierte A3-Preisliste.',
            'Your salon in a matching look: a personalised QR/NFC stand, two mirror decals and a laminated A3 price list.'
        ),
        'content' => kk_ph(
            '<p>Bring deinen Geschäftsauftritt an die Stellen, die deine Kundinnen und Kunden täglich sehen: Empfang, Spiegel und Preisliste.</p><p>Der personalisierte Aufsteller bietet zwei QR-Ziele – zum Beispiel Google-Bewertungen und Terminbuchung oder Instagram. Zwei passende Spiegelbeschriftungen ergänzen deinen Namen oder Instagram-Nutzernamen direkt am Arbeitsplatz.</p><p>Für deine Leistungen gestalten wir eine übersichtliche A3-Preisliste auf Grundlage deiner gelieferten Texte. Alle Bestandteile werden an dein bestehendes Logo und deine gewählte Farbkombination angepasst.</p>',
            '<p>Bring your business presentation to the places your customers see every day: reception, mirror and price list.</p><p>The personalised stand offers two QR destinations – for example Google reviews and appointment booking or Instagram. Two matching mirror decals add your name or Instagram username right at the workstation.</p><p>For your services we design a clear A3 price list based on the texts you supply. Every component is adapted to your existing logo and your chosen colour combination.</p>'
        ),
        'summary' => $std_summary,
        'items' => [
            $stand_item,
            ['icon' => 'mirror-decal', 'title' => kk_ph('Spiegelbeschriftung aus Folie', 'Mirror vinyl decals'), 'qty' => 2, 'desc' => kk_ph('Zwei identische einfarbige Folien, maximale Gesamtgröße je 25 × 10 cm, mit deinem Firmennamen oder Instagram-Nutzernamen. Keine aufwendigen Illustrationen.', 'Two identical single-colour decals, maximum overall size 25 × 10 cm each, with your business name or Instagram username. No complex illustrations.')],
            ['icon' => 'sheet', 'title' => kk_ph('Laminierte A3-Preisliste', 'Laminated A3 price list'), 'qty' => 1, 'desc' => kk_ph('Einseitig laminiert, übersichtliches Layout mit höchstens 15 Leistungen und Preisen auf Basis deiner gelieferten Texte.', 'Single-sided laminated, simple layout with a maximum of 15 services and prices, based on the texts you supply.')],
            $design_item(['de' => 'des Aufstellers, der Spiegelbeschriftungen und der Preisliste', 'en' => 'of the stand, the mirror decals and the price list']),
        ],
        'fields' => array_merge(
            kk_shared($STD_HELP),
            kk_qr_fields(['label' => $google, 'url' => $googleUrl], ['label' => kk_ph('z. B. Terminbuchung oder Instagram', 'e.g. Appointment booking or Instagram'), 'url' => kk_ph('https://…', 'https://…')]),
            [
                kk_f('mirror_text_choice', 'select', true, ['de' => 'Text der Spiegelbeschriftung', 'en' => 'Mirror decal text'], [
                    'options' => [['business_name', kk_ph('Firmenname', 'Business name')], ['instagram', kk_ph('Instagram-Nutzername', 'Instagram username')]],
                    'default' => 'business_name',
                ]),
                kk_f('mirror_text', 'text', true, ['de' => 'Wortlaut der Spiegelbeschriftung', 'en' => 'Exact wording for the mirror decals'], [
                    'max' => 40,
                    'placeholder' => kk_ph('z. B. @salon.mueller', 'e.g. @salon.mueller'),
                    'help' => kk_ph('Dein Firmenname oder Instagram-Nutzername, passend zur Auswahl. Beide Beschriftungen sind identisch.', 'Your business name or Instagram username, matching the choice above. Both decals are identical.'),
                ]),
                kk_f('price_list', 'textarea', true, ['de' => 'Texte für die Preisliste', 'en' => 'Price list texts'], [
                    'max' => 1200,
                    'placeholder' => kk_ph("Haarschnitt – 25 €\nBartpflege – 15 €", "Haircut – €25\nBeard trim – €15"),
                    'help' => kk_ph('Höchstens 15 Leistungen mit Preisen, eine Leistung pro Zeile.', 'A maximum of 15 services with prices, one service per line.'),
                ]),
                $notes,
            ]
        ),
        'outro' => $std_outro,
    ],
    'reception' => [
        'de_slug' => 'reception-kit-de',
        'images' => [],
        'price' => '179',
        'name' => kk_ph('Empfangs-Paket', 'Reception Bundle'),
        'short' => kk_ph(
            'Ein abgestimmtes Set für deinen Empfang: Logo-Schild, QR-/NFC-Aufsteller und zwei passende Türschilder.',
            'A coordinated set for your reception area: a logo sign, a QR/NFC stand and two matching door plaques.'
        ),
        'content' => kk_ph(
            '<p>Begrüße Besucherinnen und Besucher mit einem klaren, zusammengehörigen Empfangsbereich. Das Empfangs-Paket verbindet dein Logo mit praktischer Orientierung und einem einfachen Zugang zu deinen Online-Kontakten.</p><p>Das Logo-Schild setzt deinen Unternehmensnamen auf der Theke in Szene. Der QR-/NFC-Aufsteller führt beispielsweise zu deiner Terminbuchung, Website oder Kontaktseite. Zwei passende Türschilder kennzeichnen Räume nach deiner Vorgabe.</p><p>Geeignet für Studios, Büros und andere Unternehmen mit Empfangsbereich.</p>',
            '<p>Welcome visitors with a clear, matching reception area. The Reception Bundle combines your logo with practical orientation and easy access to your online contacts.</p><p>The logo sign puts your company name on the counter. The QR/NFC stand leads, for example, to your appointment booking, website or contact page. Two matching door plaques label rooms as you specify.</p><p>Suitable for studios, offices and other businesses with a reception area.</p>'
        ),
        'summary' => $std_summary,
        'items' => [
            ['icon' => 'sign', 'title' => kk_ph('Freistehendes Logo-Schild aus Acryl', 'Freestanding acrylic logo sign'), 'qty' => 1, 'desc' => kk_ph('Maximale Gesamtgröße 25 × 15 cm, einfache Gestaltung mit bis zu zwei Acrylfarben.', 'Maximum overall size 25 × 15 cm, simple design with up to two acrylic colours.')],
            $stand_item,
            ['icon' => 'plaque', 'title' => kk_ph('Türschilder aus Acryl', 'Acrylic door plaques'), 'qty' => 2, 'desc' => kk_ph('Je 15 × 5 cm, höchstens zwei kurze Textzeilen. Lieferung ohne Montage.', '15 × 5 cm each, maximum two short lines of text. Supplied without installation.')],
            $design_item(['de' => 'des Logo-Schilds, des Aufstellers und der Türschilder', 'en' => 'of the logo sign, the stand and the door plaques']),
        ],
        'fields' => array_merge(
            kk_shared($STD_HELP, false, kk_ph('Gewünschte Farbkombination (bis zu zwei Acrylfarben beim Logo-Schild)', 'Requested colour combination (up to two acrylic colours for the logo sign)')),
            kk_qr_fields(['label' => kk_ph('z. B. Terminbuchung', 'e.g. Appointment booking'), 'url' => kk_ph('https://…', 'https://…')], ['label' => kk_ph('z. B. Website oder Kontaktseite', 'e.g. Website or contact page'), 'url' => kk_ph('https://…', 'https://…')]),
            [
                kk_f('plaque_1_text', 'textarea', true, ['de' => 'Text für Türschild 1', 'en' => 'Text for door plaque 1'], ['max' => 60, 'placeholder' => kk_ph('z. B. Behandlungsraum 1', 'e.g. Treatment room 1'), 'help' => kk_ph('Höchstens zwei kurze Zeilen.', 'A maximum of two short lines.')]),
                kk_f('plaque_2_text', 'textarea', true, ['de' => 'Text für Türschild 2', 'en' => 'Text for door plaque 2'], ['max' => 60, 'placeholder' => kk_ph('z. B. Büro', 'e.g. Office'), 'help' => kk_ph('Höchstens zwei kurze Zeilen.', 'A maximum of two short lines.')]),
                $notes,
            ]
        ),
        'outro' => $std_outro,
    ],
    'window' => [
        'de_slug' => 'local-shop-window-kit-de',
        'images' => [],
        'price' => '199',
        'name' => kk_ph('Schaufenster-Paket', 'Shop Window Bundle'),
        'short' => kk_ph(
            'Logo, Öffnungszeiten und ein klarer Hinweis auf dein Angebot: drei abgestimmte Folienbeschriftungen für deine Glasfläche.',
            'Logo, opening hours and a clear message about your offer: three matching vinyl lettering pieces for your glass surface.'
        ),
        'content' => kk_ph(
            '<p>Nutze deine Eingangstür oder dein Schaufenster, um dein Unternehmen und dein Angebot klar zu zeigen.</p><p>Das Schaufenster-Paket enthält deinen Logo-Schriftzug, deine Öffnungszeiten und eine kurze Angebots- oder Leistungsbeschriftung. Die Gestaltung wird aufeinander abgestimmt und als einfarbige Folienbeschriftung zur Selbstmontage vorbereitet.</p><p>Du erhältst die entgitterten Beschriftungen mit Übertragungsfolie und einer kurzen Anleitung. Vor der Fertigung stimmen wir den digitalen Entwurf mit dir ab.</p><p><strong>Wichtig:</strong> Alle drei Beschriftungen haben dieselbe Folienfarbe und sind für eine glatte, geeignete Glasfläche gedacht. Nicht enthalten sind Vollverklebung, bedruckte Motive, Milchglasfolie, das Entfernen vorhandener Beschriftungen und die Montage.</p>',
            '<p>Use your entrance door or shop window to show your business and your offer clearly.</p><p>The Shop Window Bundle includes your logo lettering, your opening hours and a short offer or service text. The design is coordinated and prepared as single-colour vinyl lettering for self-application.</p><p>You receive the weeded lettering with transfer film and a short application guide. Before production we agree the digital proof with you.</p><p><strong>Please note:</strong> all three pieces share one vinyl colour and are intended for a smooth, suitable glass surface. Not included are full-window wraps, printed graphics, frosted film, removal of existing lettering and installation.</p>'
        ),
        'summary' => kk_ph(
            'Einfarbige Vinylfolie · mit vorhandenem Logo · digitaler Entwurf vor Fertigung · eine Korrekturrunde inklusive · zur Selbstmontage, ohne Montage durch uns',
            'Single-colour vinyl · with your existing logo · digital proof before production · one consolidated revision included · self-application, installation not included'
        ),
        'items' => [
            ['icon' => 'decal-logo', 'title' => kk_ph('Logo-Schriftzug aus Folie', 'Logo vinyl decal'), 'qty' => 1, 'desc' => kk_ph('Einfarbige Vinylfolie, maximale Gesamtgröße 50 × 30 cm.', 'Single-colour vinyl decal, maximum overall size 50 × 30 cm.')],
            ['icon' => 'decal-hours', 'title' => kk_ph('Öffnungszeiten aus Folie', 'Opening-hours vinyl decal'), 'qty' => 1, 'desc' => kk_ph('Einfarbige Vinylfolie, maximale Gesamtgröße 30 × 40 cm.', 'Single-colour vinyl decal, maximum overall size 30 × 40 cm.')],
            ['icon' => 'decal-text', 'title' => kk_ph('Angebots- oder Leistungstext aus Folie', 'Offer or service text vinyl decal'), 'qty' => 1, 'desc' => kk_ph('Einfarbige Vinylfolie, maximale Gesamtgröße 50 × 20 cm, höchstens drei Zeilen und 80 Zeichen.', 'Single-colour vinyl decal, maximum overall size 50 × 20 cm, maximum three lines and 80 characters.')],
            ['icon' => 'guide', 'title' => kk_ph('Übertragungsfolie und Anleitung', 'Transfer film and application guide'), 'qty' => 1, 'desc' => kk_ph('Entgitterte Beschriftungen auf Übertragungsfolie mit kurzer Anleitung zur Selbstmontage.', 'Weeded lettering on transfer film with a short guide for self-application.')],
            $design_item(['de' => 'der drei Beschriftungen', 'en' => 'of the three decals']),
        ],
        'fields' => array_merge(
            kk_shared($STD_HELP, true, kk_ph('Gewünschte Farbe (eine Folienfarbe für alle drei Beschriftungen)', 'Requested colour (one vinyl colour for all three decals)')),
            [
                $hours_field,
                kk_f('promo_text', 'textarea', true, ['de' => 'Angebots- oder Leistungstext', 'en' => 'Offer or service text'], [
                    'max' => 80,
                    'placeholder' => kk_ph('z. B. Reparaturen · Schlüsseldienst · Beratung', 'e.g. Repairs · Key cutting · Advice'),
                    'help' => kk_ph('Höchstens drei Zeilen und 80 Zeichen.', 'A maximum of three lines and 80 characters.'),
                ]),
                kk_size_field('logo_decal_size', kk_ph('Größe der Logo-Folie', 'Size of the logo decal'), '50 × 30 cm'),
                kk_size_field('hours_decal_size', kk_ph('Größe der Öffnungszeiten-Folie', 'Size of the opening-hours decal'), '30 × 40 cm'),
                kk_size_field('promo_decal_size', kk_ph('Größe der Angebots-Folie', 'Size of the offer decal'), '50 × 20 cm'),
                $application_side,
                $notes,
            ]
        ),
        'outro' => kk_ph(
            '<p><strong>Nicht enthalten</strong> sind die Gestaltung eines neuen Logos und die Montage. Der angezeigte Preis ist ein Ab-Preis für den beschriebenen Umfang; der endgültige Preis hängt von deinen Anforderungen ab und wird nach deiner Anfrage persönlich mit dir abgestimmt. Fotos und Farbverläufe sind nicht Teil des Pakets; ist dein Logo nicht für einfarbiges Schneiden geeignet, melden wir uns vor der Fertigung. Für andere Größen, Mengen, aufwendigere Gestaltung oder Montage erstellen wir dir gern ein individuelles Angebot.</p>',
            '<p><strong>Not included:</strong> designing a new logo and installation. The price shown is a starting price for the scope described; the final price depends on your requirements and is agreed with you personally after your enquiry. Photos and gradients are not part of the bundle; if your logo is not suitable for single-colour cutting, we contact you before production. For other sizes, quantities, more complex artwork or installation we are happy to prepare an individual offer.</p>'
        ),
    ],
];

function kk_build_fields(array $fields, string $lang): array {
    $out = [];
    foreach ($fields as $f) {
        $row = [
            'id' => $f['id'],
            'label' => $f['label'][$lang],
            'type' => $f['type'],
            'required' => $f['required'],
            'helperText' => isset($f['help']) ? $f['help'][$lang] : '',
        ];
        if (in_array($f['type'], ['text', 'textarea', 'url'], true)) {
            $row['placeholder'] = isset($f['placeholder']) ? $f['placeholder'][$lang] : '';
            $row['maxLength'] = $f['max'] ?? null;
        }
        if ($f['type'] === 'select') {
            $row['options'] = array_map(fn($o) => ['label' => $o[1][$lang], 'value' => $o[0]], $f['options']);
            if (!empty($f['default'])) {
                $row['defaultValue'] = $f['default'];
            }
        }
        $row['price'] = 0;
        $out[] = $row;
    }
    return $out;
}

// ---------------------------------------------------------------------------
// Direct-purchase catalogue products (not bundles). Created if missing, then
// kept in sync like the bundles. Prices are the approved base prices.
// ---------------------------------------------------------------------------
$qr_fields = function (array $stand_noun): array {
    return [
        kk_f('stand_text', 'text', true, ['de' => 'Text auf dem Ständer', 'en' => 'Text on the stand'], [
            'max' => 40,
            'placeholder' => kk_ph('z. B. Café Sonnenschein', 'e.g. Café Sunshine'),
            'help' => kk_ph('Zum Beispiel dein Firmenname.', 'For example your business name.'),
        ]),
        kk_f('qr_url', 'url', true, ['de' => 'QR-Code: Ziel-Link', 'en' => 'QR code: destination link'], [
            'max' => 300,
            'placeholder' => kk_ph('https://…', 'https://…'),
            'help' => kk_ph('Die Seite, die sich nach dem Scannen öffnet, zum Beispiel deine Bewertungsseite, Speisekarte oder Website.', 'The page that opens after scanning, for example your review page, menu or website.'),
        ]),
        kk_f('logo', 'file', false, ['de' => 'Dein Logo (optional)', 'en' => 'Your logo (optional)'], [
            'help' => kk_ph('Optional. Ob und wie sich dein Logo umsetzen lässt, bestätigen wir dir.', 'Optional. We confirm whether and how your logo can be applied.'),
        ]),
    ];
};

$none = kk_ph('', '');
$KITS['qr_3d'] = [
    'create' => true, 'bundle' => false, 'mode' => 'purchase', 'retired_fields' => ['colour'],
    'de_slug' => 'personalisierter-qr-code-aufsteller-nfc', 'en_slug' => 'personalized-qr-code-stand-nfc',
    'legacy_de_slugs' => ['qr-staender-3d-druck', 'qr-code-aufsteller-nfc-3d-druck'],
    'categories' => ['de' => ['qr-nfc-staender', 'business-produkte'], 'en' => ['qr-nfc-stands', 'business-products']],
    'images' => [], 'price' => '39.99',
    'name' => kk_ph('Personalisierter QR-Code-Aufsteller mit NFC – 6 Designs zur Auswahl', 'Personalized QR Code Stand with NFC – Choose from 6 Designs'),
    'short' => kk_ph(
        'Personalisierter 3D-gedruckter Aufsteller mit einem oder zwei QR-Codes und integriertem NFC-Chip. Wähle aus sechs Designs und ergänze deinen Wunschtext sowie optional dein Logo.',
        'Personalized 3D-printed stand with one or two QR codes and an integrated NFC chip. Choose from six designs and add your text and an optional logo.'
    ),
    'content' => kk_ph(
        '<p>Ein Scan oder kurzes Antippen – und deine Kunden gelangen direkt zu deinem digitalen Angebot, etwa Bewertungsseite, Speisekarte, Website oder Online-Terminbuchung.</p><p><strong>Ein oder zwei QR-Codes:</strong> Verlinke ein einzelnes Ziel oder zwei verschiedene Angebote. Jeder QR-Code führt zum jeweils angegebenen Link.</p><p><strong>NFC inklusive:</strong> Der Aufsteller enthält einen NFC-Chip, der den von dir gewählten Link öffnet.</p><p><strong>Lieferumfang:</strong> Ein personalisierter 3D-gedruckter Aufsteller im gewählten Design, mit einem oder zwei QR-Codes und integriertem NFC-Chip.</p><p>Bitte prüfe deine Texte und Links vor der Bestellung sorgfältig.</p>',
        '<p>One scan or a quick tap takes your customers straight to your digital content, such as your review page, menu, website or online booking page.</p><p><strong>One or two QR codes:</strong> Link to a single destination or two different services. Each QR code opens its own link.</p><p><strong>NFC included:</strong> The stand includes an NFC chip that opens the link you choose.</p><p><strong>What is included:</strong> One personalized 3D-printed stand in your selected design, with one or two QR codes and an integrated NFC chip.</p><p>Please check your text and links carefully before ordering.</p>'
    ),
    'summary' => $none, 'items' => [], 'outro' => $none,
    'fields' => [
        kk_f('stand_text', 'text', true, ['de' => 'Text auf dem Ständer', 'en' => 'Text on the stand'], [
            'max' => 40,
            'placeholder' => kk_ph('z. B. Café Sonnenschein', 'e.g. Café Sunshine'),
            'help' => kk_ph('Zum Beispiel dein Firmenname.', 'For example your business name.'),
        ]),
        kk_f('design', 'select', true, ['de' => 'Design wählen', 'en' => 'Choose your design'], [
            'help' => kk_ph('Wähle eines der sechs Designs. Die Nummern findest du im Bild „Designübersicht“ in der Galerie.', 'Choose one of the six designs. The numbers are shown in the “Design overview” image in the gallery.'),
            'options' => array_map(fn($n) => ["design-{$n}", kk_ph("Design {$n}", "Design {$n}")], range(1, 6)),
        ]),
        kk_f('qr_url', 'url', true, ['de' => 'QR-Code 1: Ziel-Link', 'en' => 'QR code 1: destination link'], [
            'max' => 300,
            'placeholder' => kk_ph('https://…', 'https://…'),
            'help' => kk_ph('Die Seite, die sich nach dem Scannen öffnet, zum Beispiel deine Bewertungsseite, Speisekarte oder Website.', 'The page that opens after scanning, for example your review page, menu or website.'),
        ]),
        kk_f('qr_url2', 'url', false, ['de' => 'QR-Code 2: Ziel-Link (optional)', 'en' => 'QR code 2: destination link (optional)'], [
            'max' => 300,
            'placeholder' => kk_ph('https://…', 'https://…'),
            'help' => kk_ph('Nur ausfüllen, wenn dein Aufsteller zwei QR-Codes haben soll.', 'Only fill in if your stand should have two QR codes.'),
        ]),
        kk_f('nfc_target', 'select', false, ['de' => 'NFC-Chip: Welcher Link soll geöffnet werden?', 'en' => 'NFC chip: which link should it open?'], [
            'help' => kk_ph('Wenn du nur einen QR-Code nutzt, lass „QR-Code 1“ ausgewählt.', 'If you use only one QR code, leave “QR code 1” selected.'),
            'options' => [['qr-1', kk_ph('Link von QR-Code 1', 'Link of QR code 1')], ['qr-2', kk_ph('Link von QR-Code 2', 'Link of QR code 2')]],
            'default' => 'qr-1',
        ]),
        kk_f('logo', 'file', false, ['de' => 'Dein Logo (optional)', 'en' => 'Your logo (optional)'], [
            'help' => kk_ph('Optional. Ob und wie sich dein Logo umsetzen lässt, bestätigen wir dir.', 'Optional. We confirm whether and how your logo can be applied.'),
        ]),
    ],
];
$KITS['qr_acrylic'] = [
    // Draft on creation: the product images are managed in WordPress media and are not created by this script.
    'create' => true, 'bundle' => false, 'mode' => 'purchase', 'retired_fields' => ['colour'], 'status' => 'draft',
    'de_slug' => 'personalisierter-acryl-aufsteller-qr-code-nfc', 'en_slug' => 'personalized-acrylic-qr-code-nfc-stand',
    'legacy_de_slugs' => ['qr-staender-acryl'],
    'categories' => ['de' => ['qr-nfc-staender', 'business-produkte'], 'en' => ['qr-nfc-stands', 'business-products']],
    'images' => [], 'price' => '69.99',
    'name' => kk_ph('Personalisierter Acryl-Aufsteller mit QR-Code & NFC – 5 Designs zur Auswahl', 'Personalized Acrylic QR Code & NFC Stand – Choose from 5 Designs'),
    'short' => kk_ph(
        'Acryl-Aufsteller mit zwei QR-Codes und integriertem NFC-Chip für Bewertungen, Terminbuchungen, Speisekarten oder Social Media. Wähle aus fünf Designs und personalisiere deinen Aufsteller mit Wunschtext und optional deinem Logo.',
        'Personalized acrylic stand with two QR codes and an integrated NFC chip. Choose from five designs and add your custom text and optional logo for reviews, bookings, menus or social media.'
    ),
    'content' => kk_ph(
        '<p>Unser personalisierter Acryl-Aufsteller bringt deine digitalen Angebote direkt auf deine Theke, deinen Empfang oder deine Tische. Ein QR-Code-Scan oder kurzes Anhalten eines NFC-fähigen Smartphones genügt, um den jeweiligen Link zu öffnen.</p><p>Die fünf Designs verbinden markante Formen mit aufeinander abgestimmten Farben. Die abgebildeten Geschäftsnamen und Inhalte dienen als Gestaltungsbeispiele.</p><p><strong>Zwei QR-Codes:</strong> Jeder Aufsteller bietet Platz für zwei QR-Codes mit unterschiedlichen Ziel-Links.</p><p><strong>NFC-Chip inklusive:</strong> Der Aufsteller enthält einen NFC-Chip, den wir mit deinem angegebenen Link hinterlegen.</p><p><strong>Lieferumfang:</strong> Ein personalisierter Acryl-Aufsteller im gewählten Design mit passendem Standfuß, zwei QR-Codes und integriertem NFC-Chip. Der Preis bezieht sich auf einen Aufsteller.</p><p>Bitte prüfe deine Angaben und Links vor der Bestellung sorgfältig.</p>',
        '<p>Our personalized acrylic stand brings your digital content directly to your counter, reception desk or tables. Customers can scan a QR code or hold an NFC-enabled smartphone near the marked area to open the assigned link.</p><p>The five designs combine shaped acrylic panels with coordinated colours. The business names and content shown in the images are design examples.</p><p><strong>Two QR codes:</strong> Each stand accommodates two QR codes with separate destination links.</p><p><strong>NFC chip included:</strong> The stand includes an NFC chip configured with your supplied link.</p><p><strong>What is included:</strong> One personalized acrylic stand in your selected design, including its matching base, two QR codes and an integrated NFC chip. The price is for one stand.</p><p>Please check your details and links carefully before ordering.</p>'
    ),
    'summary' => $none, 'items' => [], 'outro' => $none,
    'fields' => [
        kk_f('stand_text', 'text', true, ['de' => 'Text auf dem Ständer', 'en' => 'Text on the stand'], [
            'max' => 40,
            'placeholder' => kk_ph('z. B. Café Sonnenschein', 'e.g. Café Sunshine'),
            'help' => kk_ph('Zum Beispiel dein Firmenname.', 'For example your business name.'),
        ]),
        kk_f('design', 'select', true, ['de' => 'Design wählen', 'en' => 'Choose your design'], [
            'help' => kk_ph('Wähle eines der fünf Designs. Die Nummern findest du im Bild „Designübersicht“ in der Galerie.', 'Choose one of the five designs. The numbers are shown in the “Design overview” image in the gallery.'),
            'options' => array_map(fn($n) => ["design-{$n}", kk_ph("Design {$n}", "Design {$n}")], range(1, 5)),
        ]),
        kk_f('qr_url', 'url', true, ['de' => 'QR-Code 1: Ziel-Link', 'en' => 'QR code 1: destination link'], [
            'max' => 300,
            'placeholder' => kk_ph('https://…', 'https://…'),
            'help' => kk_ph('Die Seite, die sich nach dem Scannen öffnet, zum Beispiel deine Bewertungsseite, Speisekarte oder Website.', 'The page that opens after scanning, for example your review page, menu or website.'),
        ]),
        kk_f('qr_url2', 'url', true, ['de' => 'QR-Code 2: Ziel-Link', 'en' => 'QR code 2: destination link'], [
            'max' => 300,
            'placeholder' => kk_ph('https://…', 'https://…'),
            'help' => kk_ph('Die Seite, die sich nach dem Scannen des zweiten QR-Codes öffnet, zum Beispiel deine Terminbuchung oder Bewertungsseite.', 'The page that opens after scanning the second QR code, for example your booking or review page.'),
        ]),
        kk_f('logo', 'file', false, ['de' => 'Dein Logo (optional)', 'en' => 'Your logo (optional)'], [
            'help' => kk_ph('Optional. Ob und wie sich dein Logo umsetzen lässt, bestätigen wir dir.', 'Optional. We confirm whether and how your logo can be applied.'),
        ]),
    ],
];
$KITS['stickers'] = [
    'create' => true, 'bundle' => false, 'mode' => 'purchase', 'status' => 'draft',
    'de_slug' => 'aufkleber-sets', 'en_slug' => 'sticker-sets',
    'categories' => ['de' => ['aufkleber'], 'en' => ['stickers']],
    'images' => [], 'price' => '5',
    'name' => kk_ph('Aufkleber-Set (rund)', 'Round sticker set'),
    'short' => kk_ph(
        'Runde Aufkleber mit deinem Design, verkauft in Sets. Du wählst den Durchmesser und die Anzahl der Sets.',
        'Round stickers with your design, sold in sets. You choose the diameter and the number of sets.'
    ),
    'content' => kk_ph(
        '<p>Die Aufkleber werden in Sets verkauft. Je nach Durchmesser enthält ein Set:</p><p>25 mm: 54 Sticker pro Set.</p><p>37 mm: 35 Sticker pro Set.</p><p>50 mm: 20 Sticker pro Set.</p><p>Die Menge im Warenkorb zählt Sets, nicht einzelne Sticker. Du lädst dein Design hoch und kannst optional Hinweise ergänzen.</p>',
        '<p>The stickers are sold in sets. Depending on the diameter, one set contains:</p><p>25 mm: 54 stickers per set.</p><p>37 mm: 35 stickers per set.</p><p>50 mm: 20 stickers per set.</p><p>The quantity in the cart counts sets, not individual stickers. You upload your design and can add optional notes.</p>'
    ),
    'summary' => $none, 'items' => [], 'outro' => $none,
    'set_config' => ['field_id' => 'diameter', 'unit_label' => kk_ph('Sticker', 'stickers'), 'options' => ['25' => 54, '37' => 35, '50' => 20]],
    'fields' => [
        kk_f('diameter', 'select', true, ['de' => 'Durchmesser', 'en' => 'Diameter'], [
            'help' => kk_ph('Die Anzahl Sticker pro Set hängt vom Durchmesser ab.', 'The number of stickers per set depends on the diameter.'),
            'options' => [
                ['25', kk_ph('25 mm – 54 Sticker pro Set', '25 mm – 54 stickers per set')],
                ['37', kk_ph('37 mm – 35 Sticker pro Set', '37 mm – 35 stickers per set')],
                ['50', kk_ph('50 mm – 20 Sticker pro Set', '50 mm – 20 stickers per set')],
            ],
        ]),
        kk_f('design', 'file', true, ['de' => 'Dein Design', 'en' => 'Your design'], [
            'help' => kk_ph('Lade das Design hoch, das auf die Aufkleber gedruckt werden soll.', 'Upload the design to be printed on the stickers.'),
        ]),
        kk_f('instructions', 'textarea', false, ['de' => 'Hinweise zur Gestaltung (optional)', 'en' => 'Design notes (optional)'], [
            'max' => 300,
            'placeholder' => kk_ph('z. B. Text oder Farbwünsche', 'e.g. text or colour wishes'),
            'help' => kk_ph('Optional. Zum Beispiel Text, der ergänzt werden soll.', 'Optional. For example text to be added.'),
        ]),
    ],
];

// Draft catalogue options (unpublished, enquiry-only until the owner decides). The product
// specifications and prices are NOT decided; nothing here states a price, material, print
// specification or delivery time. See docs/07-products-and-bundles.md (open owner inputs) for the exact decisions still needed.
$draft_product = function (string $key, string $de_slug, string $en_slug, array $name, array $short, array $categories, array $legacy_de_slugs = []): array {
    return [
        'create' => true, 'bundle' => false, 'mode' => 'enquiry', 'status' => 'draft',
        'de_slug' => $de_slug, 'en_slug' => $en_slug, 'legacy_de_slugs' => $legacy_de_slugs, 'categories' => $categories,
        'images' => [], 'price' => '', 'name' => $name, 'short' => $short,
        'content' => kk_ph('', ''), 'summary' => kk_ph('', ''), 'items' => [], 'outro' => kk_ph('', ''), 'fields' => [],
    ];
};
// The business-card and opening-hours drafts are placeholders that configure-business-cards.php and
// create-opening-hours-decals.php later fill and rename; the final slugs are listed first and the placeholder slug
// stays as a legacy lookup, so rerunning this script never creates a second draft.
$KITS['business_cards'] = $draft_product('business_cards', 'personalisierte-visitenkarten', 'custom-business-cards',
    kk_ph('Visitenkarten', 'Business cards'),
    kk_ph('Visitenkarten mit deinem Design.', 'Business cards with your design.'),
    ['de' => ['business-produkte'], 'en' => ['business-products']],
    ['visitenkarten']);
$KITS['hours_vinyl'] = $draft_product('hours_vinyl', 'oeffnungszeiten-aufkleber', 'opening-hours-window-decal',
    kk_ph('Öffnungszeiten-Folie', 'Opening-hours vinyl decal'),
    kk_ph('Öffnungszeiten als Vinylfolie für Tür oder Schaufenster.', 'Opening hours as a vinyl decal for your door or shop window.'),
    ['de' => ['oeffnungszeiten-aufkleber'], 'en' => ['opening-hours-stickers']],
    ['oeffnungszeiten-folie']);
$KITS['menus'] = $draft_product('menus', 'laminierte-speisekarten-preislisten', 'laminated-menus-price-lists',
    kk_ph('Gedruckte Speisekarten', 'Printed menus'),
    kk_ph('Speisekarten und Preislisten nach deinen Vorgaben.', 'Menus and price lists to your specifications.'),
    ['de' => ['speisekarten-preislisten'], 'en' => ['menus-price-lists']],
    ['speisekarten-menuedruck']);

$CATEGORIES_TO_CREATE = [
    ['slug' => ['de' => 'aufkleber', 'en' => 'stickers'], 'name' => ['de' => 'Aufkleber', 'en' => 'Stickers']],
];

// Default industry relations (German industry slug => bundle keys and product
// keys, in display order). They INITIALISE a missing list only; lists curated in
// the industry editor are never replaced (see the `reset-industries` argument).
// Run migrate-industry-relations.php first on any database that still has the
// old "featured kit" structure.
$INDUSTRY_PRODUCTS = [
    'restaurants-lieferdienste' => ['bundles' => ['gastro', 'starter'], 'products' => ['qr_acrylic', 'qr_3d', 'stickers', 'business_cards', 'hours_vinyl', 'menus']],
    'cafes-baeckereien' => ['bundles' => ['gastro', 'starter', 'window'], 'products' => ['qr_acrylic', 'qr_3d', 'stickers', 'business_cards', 'hours_vinyl', 'menus']],
    'barbershops-salons' => ['bundles' => ['barber', 'starter', 'reception'], 'products' => ['qr_acrylic', 'qr_3d', 'stickers', 'business_cards', 'hours_vinyl']],
    'beauty-nagelstudios' => ['bundles' => ['barber', 'starter', 'reception'], 'products' => ['qr_acrylic', 'qr_3d', 'stickers', 'business_cards', 'hours_vinyl']],
    'praxen-gesundheitsbetriebe' => ['bundles' => ['reception', 'starter', 'window'], 'products' => ['qr_acrylic', 'qr_3d', 'business_cards', 'hours_vinyl']],
    'fahrschulen' => ['bundles' => ['reception', 'starter', 'window'], 'products' => ['qr_acrylic', 'qr_3d', 'business_cards', 'hours_vinyl']],
    'lokale-geschaefte' => ['bundles' => ['window', 'starter'], 'products' => ['qr_acrylic', 'qr_3d', 'stickers', 'business_cards', 'hours_vinyl']],
    'reparatur-servicebetriebe' => ['bundles' => ['starter', 'reception', 'window'], 'products' => ['qr_acrylic', 'qr_3d', 'stickers', 'business_cards', 'hours_vinyl']],
];

// Industry/category updates. Kits and industries are located by slug and
// translation relationship, never by numeric ID.
$CATEGORY_NAMES = ['business-kits-de' => 'Business-Pakete', 'business-kits' => 'Business Bundles'];

$beauty_de = '<h2>Passendes Business-Paket</h2><p>Das Friseur- &amp; Barber-Paket passt auch zu Beauty- und Nagelstudios, die ihren Auftritt am Empfang und am Arbeitsplatz abstimmen möchten: ein Aufsteller mit zwei QR-Zielen (zum Beispiel Bewertung und Terminbuchung), Spiegelbeschriftung mit Studioname oder Instagram-Nutzername und eine laminierte A3-Preisliste mit deinen Leistungen. Die Details stimmen wir nach deiner Anfrage persönlich mit dir ab.</p>';
$beauty_en = '<h2>A suitable Business Bundle</h2><p>The Barber &amp; Salon Bundle also suits beauty and nail studios that want a consistent look at reception and at the workstation: a stand with two QR destinations (for example reviews and appointment booking), mirror decals with your studio name or Instagram username and a laminated A3 price list of your services. We agree these details with you personally after your enquiry.</p>';

$INDUSTRIES = [
    'barbershops-salons' => [
        'post_title' => 'Friseure & Barbershops',
        'post_excerpt' => 'Buchung, Bewertungen, Social Media und sichtbare Informationen für Friseure und Barbershops verbinden.',
        'replace' => ['Barbershops und Salons nutzen' => 'Friseure und Barbershops nutzen'],
    ],
    'beauty-nagelstudios' => [
        'append' => $beauty_de, 'append_marker' => 'passt auch zu Beauty- und Nagelstudios',
        'replace' => ['Die Angaben dazu machst du direkt bei der Bestellung.' => 'Die Details stimmen wir nach deiner Anfrage persönlich mit dir ab.'],
    ],
    'beauty-nail-studios' => [
        'append' => $beauty_en, 'append_marker' => 'also suits beauty and nail studios',
        'replace' => [
            'You provide these details when you order.' => 'We agree these details with you personally after your enquiry.',
            'A suitable Business Kit' => 'A suitable Business Bundle',
            'The Barber &amp; Salon Kit also' => 'The Barber &amp; Salon Bundle also',
        ],
    ],
];

require __DIR__ . '/data/business-kit-images.php';
require __DIR__ . '/lib/business-kits-engine.php';

