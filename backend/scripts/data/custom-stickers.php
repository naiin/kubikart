<?php
/**
 * Content for create-custom-stickers.php: the "custom stickers with logo or text" product (German + English).
 *
 * Prices, sizes and quantities are the owner's provisional figures (unlaminated stickers on backing sheets, one
 * repeated design per order, shipping extra). The piece counts come from an assumed A3 usable area of 260 x 360 mm
 * with 4 mm gaps and must be checked against the real layout before the product is published.
 */

if (!defined('ABSPATH')) {
    exit;
}

$kk_fmt = static fn(int $n, string $lang): string => number_format($n, 0, $lang === 'de' ? ',' : '.', $lang === 'de' ? '.' : ',');

// Shape groups: price tier (4 prices), then sizes with their four piece counts.
$grid = [ // circle and square share the same grid yield
    25 => [108, 216, 540, 1080], 30 => [70, 140, 350, 700], 40 => [48, 96, 240, 480], 50 => [24, 48, 120, 240],
    60 => [20, 40, 100, 200], 70 => [12, 24, 60, 120], 80 => [12, 24, 60, 120],
];
$rect = [
    '50 × 30' => [42, 84, 210, 420], '60 × 40' => [32, 64, 160, 320], '80 × 40' => [24, 48, 120, 240],
    '80 × 50' => [18, 36, 90, 180], '100 × 50' => [12, 24, 60, 120],
];
$free = [
    '30 × 30' => [70, 140, 350, 700], '40 × 40' => [48, 96, 240, 480], '50 × 50' => [24, 48, 120, 240],
    '60 × 40' => [32, 64, 160, 320], '60 × 60' => [20, 40, 100, 200], '80 × 50' => [18, 36, 90, 180],
    '80 × 80' => [12, 24, 60, 120],
];
$std_prices = ['7.99', '11.99', '23.99', '39.99'];
$free_prices = ['10.99', '14.99', '26.99', '42.99']; // includes the EUR 3 preparation charge

/** Shape key => [label de, label en, size rows (size key => counts), prices, size label callback]. */
$shapes = [
    'round' => ['de' => 'Rund', 'en' => 'Round', 'prices' => $std_prices, 'sizes' => array_combine(array_map(fn($d) => "Ø {$d} mm", array_keys($grid)), array_values($grid)), 'size_en' => null],
    'square' => ['de' => 'Quadratisch', 'en' => 'Square', 'prices' => $std_prices, 'sizes' => array_combine(array_map(fn($d) => "{$d} × {$d} mm", array_keys($grid)), array_values($grid)), 'size_en' => null],
    'rectangle' => ['de' => 'Rechteckig', 'en' => 'Rectangle', 'prices' => $std_prices, 'sizes' => array_combine(array_map(fn($s) => "{$s} mm", array_keys($rect)), array_values($rect)), 'size_en' => null],
    'rounded-rectangle' => ['de' => 'Abgerundetes Rechteck', 'en' => 'Rounded rectangle', 'prices' => $std_prices, 'sizes' => array_combine(array_map(fn($s) => "{$s} mm", array_keys($rect)), array_values($rect)), 'size_en' => null],
    'oval' => ['de' => 'Oval', 'en' => 'Oval', 'prices' => $std_prices, 'sizes' => array_combine(array_map(fn($s) => "{$s} mm", array_keys($rect)), array_values($rect)), 'size_en' => null],
    'custom' => ['de' => 'Freiform', 'en' => 'Custom contour', 'prices' => $free_prices, 'sizes' => array_combine(array_map(fn($s) => "{$s} mm", array_keys($free)), array_values($free)), 'size_prefix' => ['de' => 'innerhalb ', 'en' => 'within ']],
];

$kk_description = [
    'de' => '<p>Mach aus einer schlichten Verpackung etwas Persönliches: Mit individuell bedruckten Aufklebern bringst du dein Logo, deinen Namen oder eine kleine Botschaft auf Geschenke, Produktverpackungen und vieles mehr.</p>'
        . '<p>Ob Logoetiketten für dein Café, Dankeschön-Aufkleber für Kundenbestellungen oder Namensaufkleber für einen besonderen Anlass – du bestimmst die Gestaltung.</p>'
        . '<p><strong>Zwei Möglichkeiten für dein Design</strong></p>'
        . '<ul><li><strong>Eigenes Design hochladen:</strong> Lade dein fertiges Motiv, Logo oder Layout in möglichst hoher Qualität hoch.</li>'
        . '<li><strong>Wunschtext gestalten:</strong> Gib deinen Text ein und wähle Hintergrundfarbe, Textfarbe und Schrift aus den angebotenen Optionen.</li></ul>'
        . '<p><strong>Deine Auswahlmöglichkeiten</strong></p>'
        . '<ul><li>Form: rund, quadratisch, rechteckig, abgerundetes Rechteck, oval oder Freiform</li>'
        . '<li>Freie Kontur nach Prüfung deines Motivs</li>'
        . '<li>Größe und Stückzahl entsprechend der gewählten Variante</li>'
        . '<li>Bei Textgestaltungen: Hintergrundfarbe, Textfarbe und Schrift</li></ul>'
        . '<p><strong>So bestellst du</strong></p>'
        . '<ol><li>Wähle Form, Größe und Stückzahl.</li><li>Entscheide dich für ein eigenes Design oder eine Textgestaltung.</li>'
        . '<li>Lade deine Datei hoch oder trage deinen Wunschtext samt Gestaltungswünschen ein.</li>'
        . '<li>Prüfe vor dem Bestellen besonders Namen, Schreibweise und Maße.</li></ol>'
        . '<p>Bei runden Aufklebern bezeichnet die Größe den Durchmesser. Bei rechteckigen und ovalen Aufklebern werden Breite × Höhe angegeben.</p>'
        . '<p><strong>Ideen für die Verwendung</strong></p>'
        . '<ul><li>Logoetiketten und Produktverpackungen</li><li>Dankeschön-Aufkleber für Kundenbestellungen</li><li>Geschenke und Gastgeschenke</li>'
        . '<li>Hochzeiten, Geburtstage und Veranstaltungen</li><li>Namensetiketten und Beschriftungen</li></ul>'
        . '<p><strong>Bitte beachten</strong></p>'
        . '<p>Die Hintergrundfarbe wird mitgedruckt. Auch eine reine Textgestaltung wird als zusammenhängender Aufkleber geliefert, nicht als einzeln ausgeschnittene Buchstaben.</p>'
        . '<p>Farben können zwischen Bildschirmdarstellung und Druck leicht abweichen. Für ein sauberes Ergebnis sollte deine hochgeladene Datei scharf und ausreichend groß sein. Sehr kleine Schrift oder feine Details sind nicht für jede Stickergröße geeignet.</p>'
        . '<p>Bringe die Aufkleber auf einer sauberen, trockenen und glatten Oberfläche an. Die Haftung hängt vom jeweiligen Untergrund ab.</p>'
        . '<p>Du erhältst die gewählte Anzahl individuell gestalteter Aufkleber. Abgebildete Verpackungen, Behälter und Dekorationen gehören nicht zum Lieferumfang.</p>',
    'en' => '<p>Give your packaging a personal touch with custom printed stickers featuring your logo, name or message.</p>'
        . '<p>From café labels and customer thank-you stickers to personalised gifts and event labels, create a design that suits your business or occasion.</p>'
        . '<p><strong>Two ways to personalise</strong></p>'
        . '<ul><li><strong>Upload your own design:</strong> Upload your finished artwork, logo or layout in the highest quality available.</li>'
        . '<li><strong>Create a text design:</strong> Enter your wording and choose a background colour, text colour and font from the available options.</li></ul>'
        . '<p><strong>Choose your options</strong></p>'
        . '<ul><li>Shape: circle, square, rectangle, rounded rectangle, oval or custom contour</li>'
        . '<li>Custom contours subject to artwork review</li>'
        . '<li>Size and quantity from the available variations</li>'
        . '<li>Background colour, text colour and font for text designs</li></ul>'
        . '<p><strong>How to order</strong></p>'
        . '<ol><li>Select your shape, size and quantity.</li><li>Choose an uploaded design or a text design.</li>'
        . '<li>Upload your file or enter your wording and design preferences.</li><li>Check names, spelling and dimensions before ordering.</li></ol>'
        . '<p>Round sticker sizes refer to the diameter. Rectangular and oval sizes are shown as width × height.</p>'
        . '<p><strong>Ideas for use</strong></p>'
        . '<ul><li>Business logos and product packaging</li><li>Customer thank-you labels</li><li>Gifts and party favours</li>'
        . '<li>Weddings, birthdays and events</li><li>Name labels and organisation</li></ul>'
        . '<p><strong>Please note</strong></p>'
        . '<p>The background colour forms part of the printed design. Text-only designs are supplied as complete stickers with a background, rather than individually cut letters.</p>'
        . '<p>Printed colours may differ slightly from those shown on your screen. For a clear result, upload sharp, high-quality artwork. Very small text and fine details may not suit every sticker size.</p>'
        . '<p>Apply to a clean, dry and smooth surface. Adhesion depends on the surface material.</p>'
        . '<p>Your order includes the selected quantity of personalised stickers. Packaging, containers and decorative props shown in the images are not included.</p>',
];

return [
    'key' => 'custom_stickers',
    'de_slug' => 'personalisierte-aufkleber-logo-wunschtext',
    'en_slug' => 'custom-stickers-logo-text',
    'name' => [
        'de' => 'Personalisierte Aufkleber mit Logo oder Wunschtext – Eigene Designs, Farben & Schrift wählen',
        'en' => 'Custom Stickers with Your Logo or Text – Personalised Labels, Choose Shape, Colour & Font',
    ],
    'short' => [
        'de' => 'Dein Design, dein Logo oder dein Wunschtext als individueller Aufkleber. Wähle Form, Größe und Stückzahl und lade deine Datei hoch. Für Textaufkleber kannst du zusätzlich Hintergrundfarbe, Textfarbe und Schrift auswählen – passend für Verpackungen, Geschenke, Veranstaltungen oder dein Business.',
        'en' => 'Turn your design, logo or message into personalised stickers. Choose your shape, size and quantity, then upload your artwork. For text designs, select your background colour, text colour and font—ideal for packaging, gifts, events and small businesses.',
    ],
    'description' => $kk_description,
    'categories' => [
        'de' => ['aufkleber', 'business-produkte', 'personalisierte-geschenke'],
        'en' => ['stickers', 'business-products', 'personalized-gifts'],
    ],
    'tags' => [
        'de' => ['Aufkleber mit Logo', 'Wunschtext Sticker', 'Eigene Designs', 'Logo Etiketten', 'Verpackungssticker', 'Danke Aufkleber', 'Namensaufkleber', 'Runde Aufkleber', 'Etiketten bedrucken', 'Firmenaufkleber', 'Hochzeit Sticker', 'Geschenkaufkleber', 'Sticker gestalten'],
        'en' => ['custom stickers', 'logo stickers', 'personalised labels', 'custom text sticker', 'packaging labels', 'thank you stickers', 'business stickers', 'name labels', 'round stickers', 'wedding stickers', 'gift labels', 'upload your design', 'custom shape sticker'],
    ],
    // Global attributes: the German label is the attribute label, the English label a Polylang string translation.
    'attributes' => [
        'pa_form' => ['de' => 'Form', 'en' => 'Shape'],
        'pa_groesse' => ['de' => 'Größe', 'en' => 'Size'],
        'pa_stueckzahl' => ['de' => 'Stückzahl', 'en' => 'Quantity'],
    ],
    'shapes' => $shapes,
    'quantity_label' => static fn(int $count, string $lang): string => $kk_fmt($count, $lang) . ($lang === 'de' ? ' Stück' : ' pcs'),
    'fields' => [
        ['id' => 'gestaltung', 'type' => 'select', 'required' => true, 'default' => 'upload',
            'label' => ['de' => 'Design-Methode', 'en' => 'Design method'],
            'options' => [['upload', ['de' => 'Eigenes Design hochladen', 'en' => 'Upload your own design']], ['text', ['de' => 'Mit Wunschtext gestalten', 'en' => 'Create a text design']]]],
        ['id' => 'design_datei', 'type' => 'file', 'required' => true, 'showWhen' => ['gestaltung', 'upload'],
            'label' => ['de' => 'Dein Design (Datei)', 'en' => 'Your design file'],
            'help' => ['de' => 'Logo oder druckfertiges Motiv in möglichst hoher Qualität.', 'en' => 'Your logo or print-ready artwork in the highest quality available.']],
        ['id' => 'wunschtext', 'type' => 'textarea', 'required' => true, 'max' => 120, 'showWhen' => ['gestaltung', 'text'],
            'label' => ['de' => 'Wunschtext', 'en' => 'Your wording'],
            'placeholder' => ['de' => 'z. B. Danke für deine Bestellung', 'en' => 'e.g. Thank you for your order'],
            'help' => ['de' => 'Bitte prüfe Schreibweise und Zeichensetzung genau.', 'en' => 'Please check spelling and punctuation carefully.']],
        ['id' => 'hintergrundfarbe', 'type' => 'select', 'required' => true, 'showWhen' => ['gestaltung', 'text'],
            'label' => ['de' => 'Hintergrundfarbe', 'en' => 'Background colour'],
            'options' => [
                ['sage', ['de' => 'Salbeigrün', 'en' => 'Sage green']], ['cream', ['de' => 'Creme', 'en' => 'Cream']], ['rose', ['de' => 'Rosé', 'en' => 'Rose']],
                ['terracotta', ['de' => 'Terrakotta', 'en' => 'Terracotta']], ['black', ['de' => 'Schwarz', 'en' => 'Black']], ['navy', ['de' => 'Marineblau', 'en' => 'Navy']],
                ['other', ['de' => 'Andere Farbe (bitte unter „Besondere Wünsche“ angeben)', 'en' => 'Other colour (please specify under “Special requests”)']],
            ]],
        ['id' => 'textfarbe', 'type' => 'text', 'required' => true, 'max' => 40, 'showWhen' => ['gestaltung', 'text'],
            'label' => ['de' => 'Textfarbe', 'en' => 'Text colour'],
            'placeholder' => ['de' => 'z. B. Weiß', 'en' => 'e.g. white']],
        ['id' => 'schrift', 'type' => 'select', 'required' => true, 'showWhen' => ['gestaltung', 'text'],
            'label' => ['de' => 'Schrift', 'en' => 'Font'],
            'options' => [['modern', ['de' => 'Modern', 'en' => 'Modern']], ['elegant', ['de' => 'Elegant', 'en' => 'Elegant']], ['handwriting', ['de' => 'Handschrift', 'en' => 'Handwriting']]]],
        ['id' => 'randgestaltung', 'type' => 'select', 'required' => true, 'default' => 'white-border',
            'label' => ['de' => 'Randgestaltung', 'en' => 'Edge'],
            'options' => [['white-border', ['de' => 'Weißer Rand', 'en' => 'White border']], ['full-bleed', ['de' => 'Bis zum Rand bedruckt', 'en' => 'Printed to the edge']]]],
        ['id' => 'besondere_wuensche', 'type' => 'textarea', 'required' => false, 'max' => 500,
            'label' => ['de' => 'Besondere Wünsche (optional)', 'en' => 'Special requests (optional)'],
            'placeholder' => ['de' => 'z. B. Hinweise zur Gestaltung oder Farbe', 'en' => 'e.g. notes on design or colour']],
    ],
    // Gallery order follows the numeric suffix of the file names; role 01 is the featured image.
    'images' => [
        ['role' => '01-main', 'file' => 'Curated custom printed stickers in warm studio-1.png', 'sha256' => 'f2831587b0c70f9b5b80dcc11dbee8a963dec169bc2747bf65e877e4d1d7f798',
            'title' => ['de' => 'Individuell bedruckte Aufkleber in fünf Formen', 'en' => 'Custom printed stickers in five shapes'],
            'alt' => ['de' => 'Individuell bedruckte Aufkleber: rund mit Logo, rechteckig mit Dankestext, oval, quadratisch mit Tasse und als Sonne in freier Kontur', 'en' => 'Custom printed stickers: a round logo sticker, a rectangular thank-you sticker, an oval, a square cup design and a sun in a custom contour'],
            'caption' => ['de' => 'Gestaltungsbeispiele. Abgebildete Dekoration gehört nicht zum Lieferumfang.', 'en' => 'Design examples. Decoration shown is not included.']],
        ['role' => '02-shapes', 'file' => 'Choose your shape_ five custom stickers-2.png', 'sha256' => '3946e1727ffd333314f4b4315f4a178bfcb7d98ad3ddf41b278d6b2b2628a8cb',
            'title' => ['de' => 'Aufkleber-Formen im Überblick', 'en' => 'Sticker shapes at a glance'],
            'alt' => ['de' => 'Fünf Beispiele für Aufkleberformen: rund, quadratisch, rechteckig, oval und freie Kontur', 'en' => 'Five example sticker shapes: round, square, rectangular, oval and custom contour'],
            'caption' => ['de' => 'Gestaltungsbeispiele. Freie Kontur nach Prüfung deines Motivs.', 'en' => 'Design examples. Custom contour subject to artwork review.']],
        ['role' => '03-sizes', 'file' => 'Circular sticker size guide-3.png', 'sha256' => '5c28416781ddfc0a1828c74b7c74d50650f18dd1a491512345ee8756c9e57fdb',
            'title' => ['de' => 'Größenbeispiele für runde und rechteckige Aufkleber', 'en' => 'Size examples for round and rectangular stickers'],
            'alt' => ['de' => 'Größenvergleich runder Aufkleber mit 3, 4, 5, 6 und 8 cm Durchmesser sowie ein Rechteck mit Breite und Höhe', 'en' => 'Size comparison of round stickers with 3, 4, 5, 6 and 8 cm diameter and a rectangle with width and height'],
            'caption' => ['de' => 'Beispielgrößen, nicht maßstabsgetreu. Verfügbare Größen siehe Auswahl.', 'en' => 'Example sizes, not to scale. See the selection for available sizes.']],
        ['role' => '04-colours', 'file' => 'Custom stickers_ colors and styles-4.png', 'sha256' => '71fa479c60617e12c38e253c25e622444f470f43e3ab2cd1be74e478badcea3b',
            'title' => ['de' => 'Hintergrundfarben und Schriftstile', 'en' => 'Background colours and font styles'],
            'alt' => ['de' => 'Sechs runde Aufkleber in Salbeigrün, Creme, Rosé, Terrakotta, Schwarz und Marineblau sowie Wunschtext in Modern, Elegant und Handschrift', 'en' => 'Six round stickers in sage green, cream, rose, terracotta, black and navy, plus custom text in modern, elegant and handwriting fonts'],
            'caption' => ['de' => 'Gestaltungsbeispiele für Hintergrundfarben und Schriften.', 'en' => 'Design examples of background colours and fonts.']],
        ['role' => '05-cafe', 'file' => 'Custom café stickers on packaging-5.png', 'sha256' => 'd448a2e26bccdebca650d348a7ff3c7bc94970682c0d17e295668de4ceb76ad5',
            'title' => ['de' => 'Aufkleber auf Café-Verpackungen', 'en' => 'Stickers on café packaging'],
            'alt' => ['de' => 'Runder Logoaufkleber auf einem Kaffeebecher, rechteckiger Dankesaufkleber auf einer Papp-Schachtel und Etikett auf einem Kaffeeglas', 'en' => 'A round logo sticker on a coffee cup, a rectangular thank-you sticker on a cardboard box and a label on a coffee jar'],
            'caption' => ['de' => 'Gestaltungsbeispiel. Becher, Schachtel und Glas gehören nicht zum Lieferumfang.', 'en' => 'Design example. Cup, box and jar are not included.']],
        ['role' => '06-design-or-text', 'file' => 'Custom printed stickers_ design or text-6.png', 'sha256' => '062378a6170e736412af85074937d42af0cbb950dd27c5bc7bddd1880e61162a',
            'title' => ['de' => 'Eigenes Design hochladen oder Wunschtext gestalten', 'en' => 'Upload your own design or create a text design'],
            'alt' => ['de' => 'Links runde Logoaufkleber aus einer hochgeladenen Datei, rechts ovale und rechteckige Aufkleber mit gewähltem Text, Farbe und Schrift', 'en' => 'Round logo stickers from an uploaded file on the left, oval and rectangular stickers with chosen text, colour and font on the right'],
            'caption' => ['de' => 'Gestaltungsbeispiele. Namen und Texte sind Beispiele.', 'en' => 'Design examples. Names and texts are examples.']],
    ],
];
