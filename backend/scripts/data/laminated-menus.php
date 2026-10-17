<?php
/**
 * Content for create-laminated-menus.php: custom laminated menus and price lists (German + English).
 *
 * A purchase product with four attributes: format (A5 / A4 / A3 / custom), quantity (1 / 5 / 10 / larger), printed sides and
 * design (own artwork / layout service). The 18 priced combinations are the owner's pack prices (supply only). Everything
 * that cannot be priced is a request-only variation that replaces add-to-cart with the quotation form:
 *   - "Wunschformat anfragen"   request_kind "size"  (asks for the finished width x height)
 *   - "Größere Menge anfragen"  request_kind "quote"
 *   - "Layoutservice anfragen"  request_kind "quote"  (no price was given for the layout service)
 * Holders are not included.
 */

if (!defined('ABSPATH')) {
    exit;
}

$ph = static fn(string $de, string $en): array => ['de' => $de, 'en' => $en];

// pack prices [single-sided, double-sided] per format and quantity
$prices = [
    'a5' => ['1' => ['5.90', '6.90'], '5' => ['24.90', '29.90'], '10' => ['44.90', '54.90']],
    'a4' => ['1' => ['7.90', '9.40'], '5' => ['34.90', '42.40'], '10' => ['59.90', '74.90']],
    'a3' => ['1' => ['12.90', '15.40'], '5' => ['54.90', '67.40'], '10' => ['99.90', '124.90']],
];

$rows = [];
$row = static fn(string $format, string $quantity, string $sides, string $design, array $extra = []): array => array_merge([
    'pa_druckformat' => $format, 'pa_kartenanzahl' => $quantity, 'pa_druckseiten' => $sides, 'pa_gestaltung' => $design,
], $extra);
foreach ($prices as $format => $by_quantity) {
    foreach ($by_quantity as $quantity => [$single, $double]) {
        $rows[] = $row($format, $quantity, 'single', 'own', ['price' => $single]);
        $rows[] = $row($format, $quantity, 'double', 'own', ['price' => $double]);
        $rows[] = $row($format, $quantity, 'single', 'layout', ['request_kind' => 'quote']);
        $rows[] = $row($format, $quantity, 'double', 'layout', ['request_kind' => 'quote']);
    }
    $rows[] = $row($format, 'more', 'single', 'own', ['request_kind' => 'quote']);
    $rows[] = $row($format, 'more', 'double', 'own', ['request_kind' => 'quote']);
}
$rows[] = $row('custom', '1', 'single', 'own', ['request_kind' => 'size']);

return [
    'key' => 'laminated_menus',
    'asset_prefix' => 'catalogue/laminated-menus',
    'placeholder_name' => 'Laminated menus',
    'size_attribute' => 'pa_druckformat',
    'de_slug' => 'laminierte-speisekarten-preislisten',
    'en_slug' => 'laminated-menus-price-lists',
    'legacy_de_slugs' => ['speisekarten-menuedruck'],
    'legacy_en_slugs' => ['printed-menus'],
    'name' => $ph(
        'Laminierte Speisekarten & Preislisten mit Logo – A5, A4 & A3 für Restaurant, Friseur & Nagelstudio',
        'Custom Laminated Menus & Price Lists – A5, A4 & A3 for Restaurants, Hair Salons & Nail Studios'
    ),
    'short' => $ph(
        'Individuell bedruckte und laminierte Speisekarten, Getränkekarten und Preislisten für Restaurants, Cafés, Friseure und Nagelstudios. Wähle A5, A4 oder A3 sowie einseitigen oder beidseitigen Druck. Eigenes Design hochladen oder einen Layoutservice dazubuchen. Halter nicht enthalten.',
        'Personalised printed and laminated menus, drinks cards and price lists for restaurants, cafés, hair salons and nail studios. Choose A5, A4 or A3 with single-sided or double-sided printing. Upload your artwork or add an optional layout service. Holders are not included.'
    ),
    'description' => [
        'de' => '<p>Präsentiere deine Speisen, Getränke oder Leistungen übersichtlich und passend zu deinem Business – mit deinem Logo, deinen Farben und einer klaren Gestaltung.</p>'
            . '<p>Ob kleine Getränkekarte auf dem Cafétisch, Speisekarte im Restaurant oder größere Preisliste am Empfang deines Salons: Deine Inhalte werden auf Papier gedruckt und mit transparenter Laminierfolie geschützt.</p>'
            . '<p><strong>Für viele Einsatzbereiche</strong></p>'
            . '<ul><li>Speise- und Getränkekarten</li><li>Frühstücks-, Dessert- und Aktionskarten</li><li>Preislisten für Friseure und Barbershops</li><li>Behandlungsübersichten für Nagel- und Kosmetikstudios</li><li>Angebots- und Informationskarten</li></ul>'
            . '<p><strong>Formate &amp; Größen</strong></p>'
            . '<ul><li><strong>A5 – 14,8 × 21 cm:</strong> kompakt für Tische, Getränke und kleine Angebote</li><li><strong>A4 – 21 × 29,7 cm:</strong> für Speisekarten und übersichtliche Leistungslisten</li><li><strong>A3 – 29,7 × 42 cm:</strong> für umfangreichere Inhalte oder größere Preisübersichten</li></ul>'
            . '<p>Alle Angaben beziehen sich auf das Papierformat. Hochformat und Querformat sind möglich.</p>'
            . '<p>Durch den umlaufenden transparenten Laminierungsrand ist das fertige Außenmaß etwas größer. Wenn du einen vorhandenen Halter verwenden möchtest, teile uns dessen nutzbares Innenmaß vor der Bestellung mit.</p>'
            . '<p><strong>Du benötigst ein Wunschformat?</strong></p>'
            . '<p>Wähle „Wunschformat anfragen“ und trage die gewünschte fertige Breite × Höhe in Zentimetern ein. Wir prüfen die Umsetzung und bestätigen Maße und Preis vor deiner Bestellung.</p>'
            . '<p><strong>Einseitig oder beidseitig</strong></p>'
            . '<p>Wähle eine bedruckte Vorderseite mit unbedruckter Rückseite oder nutze beide Seiten – beispielsweise für Speisen vorne und Getränke hinten.</p>'
            . '<p>Eine beidseitig bedruckte Karte zählt als ein Exemplar.</p>'
            . '<p><strong>Dein Design oder unser Layout</strong></p>'
            . '<p><strong>Eigene Druckdatei:</strong> Lade dein fertiges Design möglichst als hochwertige PDF hoch. Bei beidseitigem Druck müssen Vorder- und Rückseite eindeutig erkennbar sein.</p>'
            . '<p><strong>Optionaler Layoutservice:</strong> Sende dein vorhandenes Logo, vollständige Texte und Preise sowie deine Farb- und Schriftwünsche. Wir erstellen ein Layout im Rahmen der gebuchten Gestaltungsoption. Eine neue Logoentwicklung ist nicht enthalten. Wähle dafür „Layoutservice anfragen“ – wir melden uns mit einem Angebot, bevor du etwas bestellst.</p>'
            . '<p>Bei einer durch uns erstellten Gestaltung erhältst du vor dem Druck eine Vorschau zur Freigabe. Prüfe dabei alle Texte, Preise und Kontaktdaten sorgfältig.</p>'
            . '<p><strong>So bestellst du</strong></p>'
            . '<ol><li>Format, Stückzahl, Ausrichtung und Druckseiten auswählen.</li><li>Druckdatei hochladen oder Layoutservice anfragen.</li><li>Logo, Inhalte und Gestaltungswünsche übermitteln.</li><li>Bei Layoutservice: Vorschau prüfen und freigeben.</li></ol>'
            . '<p>Die Packpreise gelten für ein einheitliches Design. Unterschiedliche Motive oder Sprachversionen bitte separat anfragen. Für größere Mengen wähle „Größere Menge anfragen“.</p>'
            . '<p><strong>Material &amp; Pflege</strong></p>'
            . '<p>Bedrucktes Papier mit transparenter Laminierung und umlaufendem versiegeltem Rand. Leichte Verschmutzungen vorsichtig mit einem weichen, leicht feuchten Tuch entfernen. Nicht einweichen und keine scheuernden Reiniger verwenden.</p>'
            . '<p>Die Karten sind flach und nicht selbststehend. Sie können ausgelegt oder mit einem geeigneten separaten Halter verwendet werden. Inhalte sind nach dem Laminieren nicht austauschbar.</p>'
            . '<p><strong>Lieferumfang</strong></p>'
            . '<p>Die gewählte Anzahl bedruckter, laminierter Karten. Halter, Geschirr und Dekorationen sind nicht enthalten.</p>'
            . '<p>Die Bilder zeigen Gestaltungsbeispiele. Farben und Oberflächenwirkung können von der Bildschirmdarstellung abweichen.</p>',
        'en' => '<p>Present your food, drinks, treatments or services in a clear layout that suits your business, with your logo and colours.</p>'
            . '<p>From compact café drinks menus to restaurant menus and larger salon price lists, your design is printed on paper and protected with transparent pouch lamination.</p>'
            . '<p><strong>Suitable for</strong></p>'
            . '<ul><li>Food and drinks menus</li><li>Breakfast, dessert and promotional menus</li><li>Hairdresser and barber price lists</li><li>Nail and beauty treatment lists</li><li>Offers and information cards</li></ul>'
            . '<p><strong>Formats &amp; sizes</strong></p>'
            . '<ul><li><strong>A5 – 14.8 × 21 cm:</strong> compact menus, drinks lists and small offers</li><li><strong>A4 – 21 × 29.7 cm:</strong> menus and clearly arranged service lists</li><li><strong>A3 – 29.7 × 42 cm:</strong> more extensive content or larger price displays</li></ul>'
            . '<p>Dimensions refer to the paper size. Portrait and landscape orientations are available.</p>'
            . '<p>The sealed transparent lamination border makes the finished outer dimensions slightly larger. If using an existing holder, provide its usable internal dimensions before ordering.</p>'
            . '<p><strong>Need a custom format?</strong></p>'
            . '<p>Select “Request custom format” and enter the required finished width × height in centimetres. We will confirm suitability, dimensions and price before you order.</p>'
            . '<p><strong>Single-sided or double-sided</strong></p>'
            . '<p>Choose a printed front with a blank reverse, or use both sides—for example, food on the front and drinks on the back.</p>'
            . '<p>One double-sided card counts as one item.</p>'
            . '<p><strong>Your artwork or our layout service</strong></p>'
            . '<p><strong>Your own artwork:</strong> Upload your finished design, preferably as a high-quality PDF. Clearly identify the front and back for double-sided printing.</p>'
            . '<p><strong>Optional layout service:</strong> Send your existing logo, complete wording, prices, colour preferences and preferred font style. We will arrange these within the scope of your selected design service. New logo creation is not included. Select “Request layout service” and we will get back to you with a quotation before you order anything.</p>'
            . '<p>For layouts created by us, a preview is provided for approval before printing. Please check all wording, prices and contact details carefully.</p>'
            . '<p><strong>How to order</strong></p>'
            . '<ol><li>Choose your format, quantity, orientation and printed sides.</li><li>Upload your artwork or request layout support.</li><li>Provide your logo, content and design preferences.</li><li>For our layout service, check and approve your preview.</li></ol>'
            . '<p>Pack prices apply to one identical design throughout. Request a separate quote for mixed designs or language versions. For larger quantities, select “Request larger quantity”.</p>'
            . '<p><strong>Material &amp; care</strong></p>'
            . '<p>Printed paper protected with transparent lamination and a sealed border. Gently wipe light marks with a soft, slightly damp cloth. Do not soak or use abrasive cleaners.</p>'
            . '<p>These are flat cards and do not stand independently. Lay them flat or use a suitable separate holder. Printed content cannot be replaced after lamination.</p>'
            . '<p><strong>What is included</strong></p>'
            . '<p>Your selected quantity of printed, laminated cards. Holders, tableware and decorative props are not included.</p>'
            . '<p>Images show design examples. Printed colours and surface appearance may differ from your screen.</p>',
    ],
    'categories' => [
        'de' => ['speisekarten-preislisten', 'business-produkte'],
        'en' => ['menus-price-lists', 'business-products'],
    ],
    'tags' => [
        'de' => ['Speisekarte drucken', 'Laminierte Menüs', 'Getränkekarte', 'Preisliste Friseur', 'Nagelstudio Preise', 'Salon Preisliste', 'Menükarte mit Logo', 'Tischmenü', 'Café Speisekarte', 'Preisliste drucken', 'A5 Speisekarte', 'A4 Speisekarte', 'A3 Preisliste'],
        'en' => ['laminated menu', 'custom menu cards', 'restaurant menu', 'drinks menu', 'salon price list', 'nail salon menu', 'hair salon prices', 'cafe menu', 'menu printing', 'price list printing', 'A5 menu card', 'A4 menu card', 'A3 price list'],
    ],
    'attributes' => [
        'pa_druckformat' => ['de' => 'Format', 'en' => 'Format'],
        'pa_kartenanzahl' => ['de' => 'Stückzahl', 'en' => 'Quantity'],
        'pa_druckseiten' => ['de' => 'Druckseiten', 'en' => 'Printed sides'],
        'pa_gestaltung' => ['de' => 'Gestaltung', 'en' => 'Design'],
    ],
    'terms' => [
        'pa_druckformat' => [
            'a5' => $ph('A5 – 14,8 × 21 cm', 'A5 – 14.8 × 21 cm'),
            'a4' => $ph('A4 – 21 × 29,7 cm', 'A4 – 21 × 29.7 cm'),
            'a3' => $ph('A3 – 29,7 × 42 cm', 'A3 – 29.7 × 42 cm'),
            'custom' => $ph('Wunschformat anfragen', 'Request custom format'),
        ],
        'pa_kartenanzahl' => [
            '1' => $ph('1 Stück', '1 piece'),
            '5' => $ph('5 Stück', '5 pieces'),
            '10' => $ph('10 Stück', '10 pieces'),
            'more' => $ph('Größere Menge anfragen', 'Request larger quantity'),
        ],
        'pa_druckseiten' => [
            'single' => $ph('Einseitig bedruckt', 'Single-sided'),
            'double' => $ph('Beidseitig bedruckt', 'Double-sided'),
        ],
        'pa_gestaltung' => [
            'own' => $ph('Eigene Druckdatei', 'Own artwork'),
            'layout' => $ph('Layoutservice anfragen', 'Request layout service'),
        ],
    ],
    'rows' => $rows,
    'fields' => [
        ['id' => 'ausrichtung', 'type' => 'select', 'required' => true, 'default' => 'hochformat',
            'label' => $ph('Ausrichtung', 'Orientation'),
            'options' => [['hochformat', $ph('Hochformat', 'Portrait')], ['querformat', $ph('Querformat', 'Landscape')]]],
        ['id' => 'druckdatei', 'type' => 'file', 'required' => true,
            'label' => $ph('Deine Druckdatei', 'Your print file'),
            'help' => $ph('Möglichst als hochwertige PDF (hochgeladen werden PDF, PNG, JPG oder WebP). Bei beidseitigem Druck müssen Vorder- und Rückseite eindeutig erkennbar sein, zum Beispiel als zwei Seiten einer PDF.', 'Preferably a high-quality PDF (PDF, PNG, JPG or WebP can be uploaded). For double-sided printing, front and back must be clearly identifiable, for example as two pages of one PDF.')],
        ['id' => 'halter_innenmass', 'type' => 'text', 'required' => false, 'max' => 80,
            'label' => $ph('Vorhandener Halter: nutzbares Innenmaß (optional)', 'Existing holder: usable internal size (optional)'),
            'placeholder' => $ph('z. B. 15 × 21,5 cm', 'e.g. 15 × 21.5 cm'),
            'help' => $ph('Nur nötig, wenn die Karte in einen vorhandenen Halter passen soll. Das fertige Außenmaß ist durch den Laminierrand etwas größer als das Papierformat.', 'Only needed if the card must fit an existing holder. The finished outer size is slightly larger than the paper size because of the lamination border.')],
        ['id' => 'anmerkungen', 'type' => 'textarea', 'required' => false, 'max' => 500,
            'label' => $ph('Weitere Wünsche (optional)', 'Additional requests (optional)'),
            'placeholder' => $ph('z. B. Hinweise zu Vorder- und Rückseite', 'e.g. notes on front and back')],
    ],
    'images' => [
        ['role' => '01-cafe', 'file' => 'Elegant laminated menu card in café-1.png', 'sha256' => '05a8e035da6fada185bee01ca2488268b88e39b68a1b0cd70280bc00c28ec298',
            'title' => $ph('Laminierte Speisekarte im Café', 'Laminated menu card in a café'),
            'alt' => $ph('Laminierte Karte „Bistro Luna – Speisen & Getränke“ mit Preisen auf einem Holzfuß an einem Cafétisch', 'Laminated card “Bistro Luna – Speisen & Getränke” with prices on a wooden stand on a café table'),
            'caption' => $ph('Gestaltungsbeispiel. Namen, Inhalte und Preise sind Beispiele; Halter und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names, content and prices are examples; the holder and decoration are not included.')],
        ['role' => '02-formats', 'file' => 'Choose Your Menu Format.png', 'sha256' => 'b0c69412a35de0eec7ab7eb8fbe895b0b8ba48c169e9cfd754f452b0131b0d3a',
            'title' => $ph('Die Formate A5, A4 und A3', 'The formats A5, A4 and A3'),
            'alt' => $ph('Drei laminierte Karten im Format A5, A4 und A3 mit Beispielinhalten für Bistro und Friseur nebeneinander', 'Three laminated cards in A5, A4 and A3 with example content for a bistro and a hair salon side by side'),
            'caption' => $ph('Abbildungen nicht maßstabsgetreu. Papierformat; das Endformat ist durch die Laminierung etwas größer. Halter nicht enthalten.', 'Illustrations not to scale. Paper size; the finished size is slightly larger because of the lamination. Holders are not included.')],
        ['role' => '03-salon', 'file' => 'Premium laminated salon price list-2.png', 'sha256' => '7233f1a1c079e762d298f4e5570fb9606b6140333b7300e2f3d06fd792f93dd8',
            'title' => $ph('Laminierte Preisliste für Friseur & Salon', 'Laminated price list for hair salons'),
            'alt' => $ph('Laminierte Preisliste „Studio Bella“ mit Friseurleistungen auf einem Holzfuß an einem Friseurplatz', 'Laminated price list “Studio Bella” with hairdressing services on a wooden stand at a hair salon station'),
            'caption' => $ph('Gestaltungsbeispiel. Namen, Leistungen und Preise sind Beispiele; Halter und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names, services and prices are examples; the holder and decoration are not included.')],
        ['role' => '04-nails', 'file' => 'Laminated Nail Salon Price List-3.png', 'sha256' => '7158c8ff7f53a94db780c75f291b228143be8bbf338b5874e7a40eb67f0f5d93',
            'title' => $ph('Laminierte Preisliste für ein Nagelstudio', 'Laminated price list for a nail studio'),
            'alt' => $ph('Laminierte Preisliste „Nail Atelier – Behandlungen & Preise“ neben Nagellacken auf einer Marmorplatte', 'Laminated price list “Nail Atelier – Behandlungen & Preise” beside nail polishes on a marble surface'),
            'caption' => $ph('Gestaltungsbeispiel. Namen, Leistungen und Preise sind Beispiele; Dekoration gehört nicht zum Lieferumfang.', 'Design example. Names, services and prices are examples; decoration is not included.')],
        ['role' => '05-design', 'file' => 'Custom laminated menus and salon price lists-4.png', 'sha256' => 'c88076a48855ba3eb70802af7fcc07c3119ef8c3d56a5b17cdd4502cabffc5c9',
            'title' => $ph('Eigenes Design oder Layoutservice', 'Your own design or layout service'),
            'alt' => $ph('Laminierte Getränkekarte und Nagelstudio-Preisliste neben einer druckfertigen Vorlage und einer einfachen Leistungsliste', 'Laminated drinks menu and nail studio price list next to a print-ready file and a plain list of services'),
            'caption' => $ph('Gestaltungsbeispiel. Halter nicht enthalten; Layoutservice optional.', 'Design example. Holders are not included; layout service is optional.')],
        ['role' => '06-sides', 'file' => 'Single or double-sided laminated menu cards-5.png', 'sha256' => '3806fd27b76ba484351006d628d33207535ccc41fc7831345e3b48adf4959da2',
            'title' => $ph('Einseitig oder beidseitig bedruckt', 'Single-sided or double-sided'),
            'alt' => $ph('Vergleich einer einseitig bedruckten Karte mit unbedruckter Rückseite und einer beidseitig bedruckten Karte mit Speisen und Getränken', 'Comparison of a single-sided card with a blank back and a double-sided card with food on one side and drinks on the other'),
            'caption' => $ph('Gestaltungsbeispiel. Eine Karte – wahlweise mit einer oder zwei bedruckten Seiten.', 'Design example. One card – with one or two printed sides, as you choose.')],
        ['role' => '07-flat', 'file' => 'Flat laminated restaurant and nail menus-6.png', 'sha256' => '0262e1c1df1830316c6457457dc3e683e47679cd5b0795f24493bc7c3643e065',
            'title' => $ph('Flache laminierte Karten für Restaurant und Nagelstudio', 'Flat laminated cards for a restaurant and a nail studio'),
            'alt' => $ph('Flach liegende laminierte Getränkekarte und Nagelstudio-Preisliste mit einer druckfertigen Vorlage und einer einfachen Leistungsliste', 'Flat laminated drinks menu and nail studio price list with a print-ready file and a plain list of services'),
            'caption' => $ph('Gestaltungsbeispiel. Die Karten sind flach und nicht selbststehend; Halter nicht enthalten.', 'Design example. The cards are flat and not self-standing; holders are not included.')],
    ],
];
