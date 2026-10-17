<?php
/**
 * Content for create-business-logo-decals.php: the custom business-logo window decal (German + English).
 *
 * Prices are the owner's provisional launch prices for ONE standard, single-colour logo (decal only, plus shipping):
 * 24.99 / 34.99 / 44.99 EUR for an overall width of 20 / 30 / 40 cm, covering artwork up to the same height. Extra text
 * lines are priced as checkboxes (1 line +4.99, 2 lines +7.99 in total); the QR code is a noted request whose price is
 * agreed after review; local on-site installation is an optional +100.00 EUR package.
 */

if (!defined('ABSPATH')) {
    exit;
}

$ph = static fn(string $de, string $en): array => ['de' => $de, 'en' => $en];

return [
    'key' => 'business_logo_decal',
    'asset_prefix' => 'catalogue/business-logo',
    'placeholder_name' => 'Business logo decal',
    'de_slug' => 'firmenlogo-fensterbeschriftung',
    'en_slug' => 'business-logo-window-decal',
    'name' => $ph(
        'Firmenlogo als Fensteraufkleber – Individuelle Folienbeschriftung aus ORACAL® Markenfolie',
        'Custom Business Logo Window Decal – ORACAL® Vinyl Lettering for Shops, Salons & Studios'
    ),
    'short' => $ph(
        'Dein Logo auf Fenster, Glastür oder geeignetem Spiegel: Präzise geschnittene Folienbeschriftung aus hochwertiger ORACAL® Markenfolie. Optional mit Firmenname, Website, Social-Media-Namen oder QR-Code nach Prüfung.',
        'Display your logo on a window, glass door or suitable mirror with custom-cut ORACAL® vinyl. Add your business name, website, social handle or an optional QR code, subject to design review.'
    ),
    'description' => [
        'de' => '<p>Mach dein Geschäft sichtbar – mit einer individuellen Folienbeschriftung passend zu deinem Markenauftritt.</p>'
            . '<p>Ob Logo am Schaufenster, Firmenname auf der Glastür oder Schriftzug am Salonspiegel: Wir setzen dein geeignetes Motiv als geschnittene Beschriftung aus hochwertiger ORACAL® Markenfolie um.</p>'
            . '<p>Zwischen Buchstaben und Motivelementen bleibt die Oberfläche sichtbar. Ein rechteckiger Hintergrund ist bei der normalen Folienbeschriftung nicht vorhanden.</p>'
            . '<p><strong>Deine Gestaltungsmöglichkeiten</strong></p>'
            . '<ul><li>Vorhandenes Firmenlogo oder Wunschtext</li><li>Folienfarbe aus den angebotenen Optionen</li><li>Größe entsprechend der gewählten Variante</li>'
            . '<li>Optional Website, Telefonnummer oder Social-Media-Name</li><li>Optional QR-Code nach Prüfung von Größe und Umsetzung</li></ul>'
            . '<p><strong>Im Preis enthalten</strong></p>'
            . '<ul><li>Ein Logo in einer Standard-Folienfarbe</li><li>Geeignete, schneidfertige Datei (SVG oder vektorbasierte PDF)</li><li>Firmenname, sofern er bereits Teil deines Logos ist</li>'
            . '<li>Eine Vorschau und eine kleine Korrekturrunde</li><li>Übertragungsfolie und Montageanleitung</li><li>Normaler oder gespiegelter Zuschnitt</li></ul>'
            . '<p><strong>Deine Datei</strong></p>'
            . '<p>Lade dein Logo möglichst als SVG oder vektorbasierte PDF hoch. Bei anderen Dateiformaten prüfen wir, ob eine saubere Umsetzung möglich ist.</p>'
            . '<p>Sehr feine Details, Farbverläufe und Fotos lassen sich nicht ohne Weiteres als geschnittene Folie umsetzen. Aufwendige Dateiaufbereitung und mehrfarbige Motive werden bei Bedarf separat angeboten. Eine neue Logoentwicklung ist nicht enthalten.</p>'
            . '<p><strong>Optionaler QR-Code</strong></p>'
            . '<p>Sende die vollständige Zieladresse. Größe, Kontrast, Freiraum und gegebenenfalls eine zusätzliche Hintergrundfläche werden vor der Fertigung abgestimmt. Prüfe den Code nach der Montage am tatsächlichen Einsatzort.</p>'
            . '<p><strong>Größen &amp; Wunschmaß</strong></p>'
            . '<p>Deine Logo-Beschriftung ist mit einer Gesamtbreite von <strong>20, 30 oder 40 cm</strong> erhältlich. Die Höhe ergibt sich aus den Proportionen deines Motivs. Dein Logo wird proportional skaliert und nicht verzerrt. Der Festpreis gilt für Motive bis zu einer Höhe von 20 cm (bei 20 cm Breite), 30 cm (bei 30 cm Breite) bzw. 40 cm (bei 40 cm Breite).</p>'
            . '<p>Bei zusätzlichen Texten oder Social-Media-Elementen bezieht sich die gewählte Breite auf das gesamte vereinbarte Layout.</p>'
            . '<p>Für andere Maße oder höhere Motive wähle <strong>„Wunschmaß anfragen“</strong>. Gib die gewünschte Gesamtbreite und die maximal verfügbare Höhe in Zentimetern an. Nach Prüfung deiner Datei bestätigen wir die möglichen Maße und den Preis. Größe und Ausführung eines optionalen QR-Codes werden separat abgestimmt.</p>'
            . '<p><strong>Bestellung und Montage</strong></p>'
            . '<p>Wähle Größe und Farbe und lade dein Motiv hoch. Gib an, auf welcher Seite der Scheibe die Beschriftung angebracht und von welcher Seite sie gelesen werden soll. Du erhältst vor der Fertigung eine Vorschau zur Freigabe.</p>'
            . '<p>Lieferung mit Übertragungsfolie und Montageanleitung zur Selbstmontage. Für geeignete, saubere und glatte Oberflächen. Optional kannst du im Nahbereich eine Vor-Ort-Montage hinzubuchen; sie ist nur enthalten, wenn du sie ausdrücklich hinzubuchst. Glasflächen und Dekorationen sind nicht enthalten.</p>',
        'en' => '<p>Give your business a recognisable presence with vinyl lettering made to suit your branding.</p>'
            . '<p>From shop-window logos to business names on glass doors and salon mirrors, your suitable artwork is cut from quality ORACAL® branded vinyl. The surface remains visible between letters and design elements, with no rectangular background on standard lettering.</p>'
            . '<p>Choose your available vinyl colour and size. Optional additions include a website, phone number, social-media handle or QR code.</p>'
            . '<p><strong>Included in the price</strong></p>'
            . '<ul><li>One logo in one standard vinyl colour</li><li>Suitable, cut-ready artwork (SVG or vector PDF)</li><li>Your business name, if it is already part of your logo</li>'
            . '<li>One preview and one minor correction round</li><li>Transfer tape and application instructions</li><li>Normal or mirrored cutting</li></ul>'
            . '<p><strong>Artwork</strong></p>'
            . '<p>Upload your existing logo as an SVG or vector PDF where possible. Other file types can be checked for suitability.</p>'
            . '<p>Very fine details, photographs and gradients may require a different production method. Complex artwork preparation and multicolour designs are quoted separately where needed. New logo creation is not included.</p>'
            . '<p><strong>Optional QR code</strong></p>'
            . '<p>Provide the full destination URL. Size, contrast, clear space and any necessary background panel will be agreed before production. Test the code in its final position after installation.</p>'
            . '<p><strong>Sizes &amp; custom dimensions</strong></p>'
            . '<p>Choose an overall logo width of <strong>20, 30 or 40 cm</strong>. Height follows your artwork’s proportions. Your logo is scaled proportionally without stretching. The fixed price covers artwork up to 20 cm high (at 20 cm width), 30 cm high (at 30 cm) or 40 cm high (at 40 cm).</p>'
            . '<p>If additional wording or social-media elements are included, the selected width applies to the complete agreed layout.</p>'
            . '<p>For different dimensions or taller artwork, select <strong>“Request custom size”</strong> and provide your preferred overall width and maximum available height in centimetres. We will review your artwork and confirm the available dimensions and price. Any optional QR code’s size and construction will be agreed separately.</p>'
            . '<p><strong>Ordering and application</strong></p>'
            . '<p>Select your size and colour, upload your artwork, and specify the application side and viewing direction. A preview is provided for approval before production.</p>'
            . '<p>Supplied with transfer tape and instructions for self-installation on suitable clean, smooth surfaces. Local on-site installation can be added as an option and is only included if you add it to your order. Glass and decorative props are not included.</p>',
    ],
    'categories' => [
        'de' => ['fenster-glasaufkleber', 'spiegel-aufkleber', 'business-produkte'],
        'en' => ['window-glass-stickers', 'mirror-stickers', 'business-products'],
    ],
    'tags' => [
        'de' => ['Logo Aufkleber', 'Firmenlogo Folie', 'Fensterlogo', 'Fensterbeschriftung', 'Schaufensterlogo', 'Firmenbeschriftung', 'Spiegel Aufkleber', 'Social Media Folie', 'QR Code Aufkleber', 'Instagram Aufkleber', 'Geschäftslogo', 'ORACAL Folie', 'Logo nach Wunsch'],
        'en' => ['business logo decal', 'window logo sticker', 'custom vinyl logo', 'shop window decal', 'salon window logo', 'glass door logo', 'mirror logo decal', 'social media decal', 'QR code decal', 'business lettering', 'ORACAL vinyl', 'custom shop logo', 'window lettering'],
    ],
    'attributes' => [
        'pa_gesamtbreite' => ['de' => 'Gesamtbreite', 'en' => 'Overall width'],
    ],
    'widths' => [
        '20' => ['de' => '20 cm', 'en' => '20 cm', 'price' => '24.99'],
        '30' => ['de' => '30 cm', 'en' => '30 cm', 'price' => '34.99'],
        '40' => ['de' => '40 cm', 'en' => '40 cm', 'price' => '44.99'],
        'request' => ['de' => 'Wunschmaß anfragen', 'en' => 'Request custom size'],
    ],
    'fields' => [
        ['id' => 'folienfarbe', 'type' => 'select', 'required' => true,
            'label' => $ph('Folienfarbe', 'Vinyl colour'),
            'help' => $ph('Weitere Farben auf Anfrage.', 'Other colours on request.'),
            'options' => [['black', $ph('Schwarz', 'Black')], ['white', $ph('Weiß', 'White')], ['gold', $ph('Gold', 'Gold')]]],
        ['id' => 'logo_datei', 'type' => 'file', 'required' => true,
            'label' => $ph('Dein Logo', 'Your logo'),
            'help' => $ph('Möglichst als SVG oder vektorbasierte PDF. Bei anderen Dateiformaten prüfen wir, ob eine saubere Umsetzung möglich ist.', 'Preferably as an SVG or vector PDF. For other file types we check whether a clean result is possible.')],
        ['id' => 'zusatz_zeile_1', 'type' => 'checkbox', 'required' => false, 'price' => 4.99,
            'label' => $ph('Zusätzliche Textzeile (Website, Telefonnummer oder Social-Media-Name)', 'Additional text line (website, phone number or social handle)'),
            'help' => $ph('Der Text muss in die gewählte Gesamtgröße passen. Wird das Logo dadurch zu klein, schlagen wir vor der Fertigung eine größere Variante vor.', 'The text must fit within the selected overall size. If it makes the logo too small, we will suggest a larger size before production.')],
        ['id' => 'zeile_1', 'type' => 'text', 'required' => true, 'max' => 80, 'showWhen' => ['zusatz_zeile_1', 'true'],
            'label' => $ph('Text der zusätzlichen Zeile', 'Text of the additional line'),
            'placeholder' => $ph('z. B. www.beispiel.de oder @deinname', 'e.g. www.example.com or @yourname')],
        ['id' => 'zusatz_zeile_2', 'type' => 'checkbox', 'required' => false, 'price' => 3.00, 'showWhen' => ['zusatz_zeile_1', 'true'],
            'label' => $ph('Zweite zusätzliche Textzeile', 'Second additional text line'),
            'help' => $ph('Zusammen mit der ersten Zeile 7,99 €.', 'Together with the first line €7.99.')],
        ['id' => 'zeile_2', 'type' => 'text', 'required' => true, 'max' => 80, 'showWhen' => ['zusatz_zeile_2', 'true'],
            'label' => $ph('Text der zweiten Zeile', 'Text of the second line'),
            'placeholder' => $ph('z. B. Telefonnummer', 'e.g. phone number')],
        ['id' => 'qr_gewuenscht', 'type' => 'checkbox', 'required' => false,
            'label' => $ph('QR-Code gewünscht (Angebot nach Prüfung)', 'QR code wanted (quote after review)'),
            'help' => $ph('Ab 14,99 €, je nach Größe und Aufwand. Er ist im Bestellpreis nicht enthalten: Wir stimmen Größe, Konstruktion und Preis mit dir ab, bevor gefertigt wird.', 'From €14.99 depending on size and effort. It is not part of the order price: we agree size, construction and price with you before production.')],
        ['id' => 'qr_url', 'type' => 'url', 'required' => true, 'max' => 300, 'showWhen' => ['qr_gewuenscht', 'true'],
            'label' => $ph('QR-Zieladresse', 'QR destination link'),
            'placeholder' => $ph('https://…', 'https://…'),
            'help' => $ph('Die vollständige Adresse, die sich nach dem Scannen öffnen soll.', 'The full address that should open after scanning.')],
        ['id' => 'anbringung', 'type' => 'select', 'required' => true, 'default' => 'innen-von-aussen',
            'label' => $ph('Anbringung und Leserichtung', 'Application side and reading side'),
            'help' => $ph('Auf welcher Seite der Scheibe wird die Beschriftung angebracht und von welcher Seite soll sie gelesen werden?', 'Which side of the glass is the lettering applied to, and from which side should it be read?'),
            'options' => [
                ['aussen-von-aussen', $ph('Außen angebracht, von außen lesbar', 'Applied outside, read from outside')],
                ['innen-von-aussen', $ph('Innen angebracht, von außen lesbar', 'Applied inside, read from outside')],
                ['innen-von-innen', $ph('Innen angebracht, von innen lesbar', 'Applied inside, read from inside')],
            ]],
        ['id' => 'glas_foto', 'type' => 'file', 'required' => false,
            'label' => $ph('Foto der Glasfläche (optional)', 'Photo of the glass (optional)'),
            'help' => $ph('Hilft uns bei der Prüfung von Größe und Untergrund. Für die Vor-Ort-Montage bitte unbedingt hochladen.', 'Helps us check size and surface. Please always upload one if you book on-site installation.')],
        ['id' => 'montage', 'type' => 'checkbox', 'required' => false, 'price' => 100,
            'label' => $ph('Vor-Ort-Montage im Nahbereich', 'Local on-site installation'),
            'help' => $ph(
                'Optional. Im Nahbereich (bis 15 km Fahrstrecke ab Blaustein): eine zugängliche Glasfläche, Reinigung, Positionierung und Anbringung, bis zu 60 Minuten vor Ort. Ohne Entfernen vorhandener Beschriftung oder starker Klebstoffreste. Längere Anfahrt, weitere Beschriftungen beim selben Termin oder schwierige Untergründe: bitte Anfrage senden. Wir bestätigen Adresse und Foto der Glasfläche, bevor der Montagetermin feststeht.',
                'Optional. Within the local area (up to 15 km driving distance from Blaustein): one accessible glass surface, cleaning, positioning and application, up to 60 minutes on site. Excludes removing existing lettering or heavy adhesive residue. For longer journeys, several decals installed in the same visit or difficult surfaces please send an enquiry. We confirm the address and the photo of the glass before the installation appointment is fixed.'
            )],
        ['id' => 'montageadresse', 'type' => 'text', 'required' => true, 'max' => 150, 'showWhen' => ['montage', 'true'],
            'label' => $ph('Montageadresse', 'Installation address'),
            'placeholder' => $ph('Straße, PLZ, Ort', 'Street, postcode, town')],
        ['id' => 'entfernen', 'type' => 'select', 'required' => true, 'default' => 'no', 'showWhen' => ['montage', 'true'],
            'label' => $ph('Vorhandene Beschriftung entfernen?', 'Remove existing lettering?'),
            'options' => [['no', $ph('Nein', 'No')], ['yes', $ph('Ja – gesondertes Angebot', 'Yes – separate quote')]]],
        ['id' => 'anmerkungen', 'type' => 'textarea', 'required' => false, 'max' => 500,
            'label' => $ph('Weitere Wünsche (optional)', 'Additional requests (optional)'),
            'placeholder' => $ph('z. B. gespiegelter Zuschnitt oder Hinweise zur Anordnung', 'e.g. mirrored cutting or notes on the layout')],
    ],
    'images' => [
        ['role' => '01-main', 'file' => '02-Business-Logo/01-main.png', 'sha256' => 'bf6752cad567f861b3b596346ee79f38b32568c30fd06f93e97d0bc72a4107f2',
            'title' => $ph('Firmenlogo als Folienbeschriftung im Schaufenster', 'Business logo as vinyl lettering on a shop window'),
            'alt' => $ph('Weißes Logo mit Kaffeetasse, dem Schriftzug „Café Luna“ und einem Instagram-Namen als Folienbeschriftung auf einem Schaufenster', 'White logo with a coffee cup, the name “Café Luna” and an Instagram handle as vinyl lettering on a shop window'),
            'caption' => $ph('Gestaltungsbeispiel. Namen und Logos sind Beispiele; Fenster und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names and logos are examples; the window and decoration are not included.')],
        ['role' => '02-colours', 'file' => '02-Business-Logo/02-colours.png', 'sha256' => '16033d8185991a9f9c3ff82d0c09c85e22a49aa235241480960330e294310905',
            'title' => $ph('Folienfarben Schwarz, Weiß und Gold', 'Vinyl colours black, white and gold'),
            'alt' => $ph('Ein Blätter-Logo mit dem Schriftzug „Studio Bella“ in Schwarz, Weiß und Gold auf drei Glasscheiben', 'A leaf logo with the name “Studio Bella” in black, white and gold on three glass panes'),
            'caption' => $ph('Gestaltungsbeispiele. Weitere Farben auf Anfrage; Farben und Umsetzung nach Designprüfung. Glasscheiben gehören nicht zum Lieferumfang.', 'Design examples. Other colours on request; colours and execution subject to design review. Glass panes are not included.')],
        ['role' => '03-sizes', 'file' => '02-Business-Logo/03-sizes.png', 'sha256' => 'c700a55a87c9d5064b1b11c605fef7e1d471d8f6f39e1b27bf74a9cf910e9d1d',
            'title' => $ph('Logobreiten 20, 30 und 40 cm', 'Logo widths 20, 30 and 40 cm'),
            'alt' => $ph('Dasselbe Logo in drei Breiten von 20, 30 und 40 cm auf Glasscheiben', 'The same logo in three widths of 20, 30 and 40 cm on glass panes'),
            'caption' => $ph('Beispielgrößen, nicht maßstabsgetreu. Die Höhe ergibt sich aus dem Logo.', 'Example sizes, not to scale. Height follows your logo.')],
        ['role' => '04-barber', 'file' => '02-Business-Logo/04-barber.png', 'sha256' => '0ac20c1987f07721e071356ec598abb48b77d6704ef2ad2ee9acd469c0d43a57',
            'title' => $ph('Logo-Beschriftung im Barbershop', 'Logo lettering at a barbershop'),
            'alt' => $ph('Weißes Scheren-Logo mit dem Schriftzug „Kontur Barber Studio“ und einem Social-Media-Namen auf dem Schaufenster eines Barbershops', 'White scissors logo with the name “Kontur Barber Studio” and a social handle on the window of a barbershop'),
            'caption' => $ph('Gestaltungsbeispiel. Namen sind Beispiele; Fenster und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names are examples; the window and decoration are not included.')],
    ],
];
