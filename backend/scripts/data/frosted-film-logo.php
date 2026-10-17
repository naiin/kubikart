<?php
/**
 * Content for create-frosted-film-logo.php: the custom frosted window film with business logo (German + English).
 *
 * A normal purchase product like the business-logo decal. The prices are the owner's proposed prices (supply only) for ONE
 * continuous strip with ONE separate single-colour vinyl logo inside the stated box: 49.99 / 64.99 / 79.99 / 99.99 EUR for
 * 60x20 / 80x30 / 100x30 / 120x40 cm. An extra text line (+4.99) and local on-site installation (+100) are priced
 * checkboxes; the installation price for the 120x40 strip (from 130) and for several panes is confirmed before the
 * appointment. Other dimensions are the request-only size "Wunschmaß anfragen" (enquiry form, no price).
 *
 * The supplied "sizes" image (03-sizes) shows 60/90/120 x 30 cm, which are not the offered sizes, so it is not imported.
 */

if (!defined('ABSPATH')) {
    exit;
}

$ph = static fn(string $de, string $en): array => ['de' => $de, 'en' => $en];

return [
    'key' => 'frosted_film_logo',
    'asset_prefix' => 'catalogue/frosted-film',
    'placeholder_name' => 'Frosted window film with logo',
    'size_attribute' => 'pa_folienformat',
    'de_slug' => 'milchglasfolie-mit-logo',
    'en_slug' => 'frosted-window-film-logo',
    'name' => $ph(
        'Milchglasfolie mit Firmenlogo – Individueller Sichtschutzstreifen für Fenster & Glastüren',
        'Custom Frosted Window Film with Business Logo – Privacy Strip for Glass Doors & Windows'
    ),
    'short' => $ph(
        'Verbinde deinen Markenauftritt mit einem dekorativen Sichtschutz: Individuell zugeschnittene ORACAL® Glasdekorfolie in Milchglasoptik mit separat aufgebrachter Logo-Beschriftung. Für geeignete Fenster, Glastüren und Glasabtrennungen.',
        'Combine your branding with a decorative privacy strip. Custom-sized ORACAL® etched-glass-effect film with separately applied vinyl logo lettering, for suitable windows, glass doors and partitions.'
    ),
    'description' => [
        'de' => '<p>Gestalte deine Glasflächen mit einem ruhigen, professionellen Look. Ein Sichtschutzstreifen in Milchglasoptik reduziert den direkten Einblick im beklebten Bereich und bietet gleichzeitig Platz für dein Firmenlogo.</p>'
            . '<p>Wir verwenden hochwertige ORACAL® Glasdekorfolie und ergänzen dein geeignetes Logo oder deinen Firmennamen als separate Folienbeschriftung.</p>'
            . '<p><strong>So entsteht dein Design</strong></p>'
            . '<p>Die Glasdekorfolie bildet den lichtdurchlässigen Hintergrund in Milchglasoptik. Dein Logo wird als zusätzliche farbige Folienbeschriftung darauf angebracht. Ein transparent aus der Milchglasfolie ausgeschnittenes Logo ist eine andere Ausführung und nur nach gesonderter Absprache erhältlich.</p>'
            . '<p><strong>Individuell abgestimmt</strong></p>'
            . '<ul><li>Breite und Höhe des Folienstreifens</li><li>Vorhandenes Logo oder Firmenname</li><li>Position und Größe des Motivs</li></ul>'
            . '<p>Passend für Salons, Studios, Büros, Praxen und andere Geschäftsräume mit geeigneten Glasflächen.</p>'
            . '<p><strong>Preise und Umfang</strong></p>'
            . '<p>Die Preise gelten für die Lieferung ohne Montage: ein zusammenhängender Folienstreifen mit einem einfarbigen, separat aufgebrachten Logo. Das Logo behält seine Proportionen und passt in die genannte Größe.</p>'
            . '<table><thead><tr><th>Folienstreifen (Breite × Höhe)</th><th>Enthaltenes Logo (max. Breite × Höhe)</th><th>Preis</th></tr></thead><tbody>'
            . '<tr><td>60 × 20 cm</td><td>20 × 15 cm</td><td>49,99 €</td></tr>'
            . '<tr><td>80 × 30 cm</td><td>30 × 20 cm</td><td>64,99 €</td></tr>'
            . '<tr><td>100 × 30 cm</td><td>40 × 20 cm</td><td>79,99 €</td></tr>'
            . '<tr><td>120 × 40 cm</td><td>40 × 30 cm</td><td>99,99 €</td></tr>'
            . '<tr><td>Andere Maße oder mehrere Scheiben</td><td>nach Absprache</td><td>Angebot</td></tr>'
            . '</tbody></table>'
            . '<p>Die Preise gehen von einem durchgehenden Streifen und einfach umsetzbarer, schneidfertiger Vorlage aus.</p>'
            . '<p><strong>Im Preis enthalten</strong></p>'
            . '<ul><li>Milchglasfolie, zugeschnitten auf die vereinbarten rechteckigen Maße</li><li>Ein Logo in einer Standard-Folienfarbe, separat mit Übertragungsfolie geliefert</li><li>Eine Layoutvorschau und eine kleine Korrektur</li><li>Montageanleitung</li><li>Ein Design für eine Glasfläche</li></ul>'
            . '<p><strong>Mögliche Aufpreise</strong></p>'
            . '<ul><li>Eine zusätzliche Textzeile im vereinbarten Layout: +4,99 € (zum Auswählen)</li><li>Einfache Vektorisierung deiner Vorlage: ab 15 €, nach Prüfung</li><li>Größeres oder filigranes Logo: Angebot</li><li>Mehrere Farben: Angebot</li><li>Klares, aus der Milchglasfolie ausgeschnittenes Logo: gesondertes Angebot</li><li>Entfernen vorhandener Folie oder Kleberreste: gesondertes Angebot</li></ul>'
            . '<p><strong>Montage vor Ort (optional)</strong></p>'
            . '<p>Die Montage ist nicht im Preis enthalten, kann aber im Nahbereich (bis 15 km Fahrstrecke ab Blaustein) mitbestellt werden: für +100 € positionieren wir die Milchglasfolie und bringen die separate Logo-Ebene an.</p>'
            . '<ul><li>Eine zugängliche Scheibe, Streifen bis 100 × 30 cm, einfache Anbringung: +100 €</li><li>Größerer Streifen, auch 120 × 40 cm: ab 130 € – den Aufpreis von 30 € bestätigen wir vor dem Termin</li><li>Mehrere Scheiben oder schwieriger Zugang: Angebot</li></ul>'
            . '<p>Wir bestätigen den Montagetermin, nachdem wir Adresse und Foto der Glasfläche geprüft haben. Beispiel: Streifen 80 × 30 cm mit Logo und Montage 164,99 €.</p>'
            . '<p><strong>So bestellst du</strong></p>'
            . '<p>Wähle Format, lade dein Logo und möglichst ein Foto der Glasfläche hoch und gib an, wo die Folie angebracht werden soll. Vor der Fertigung erhältst du eine Layoutvorschau zur Freigabe.</p>'
            . '<p>Mehrere gleiche Scheiben bestellst du über die Stückzahl. Für andere Maße oder unterschiedliche Formate wähle „Wunschmaß anfragen“.</p>'
            . '<p><strong>Größen &amp; Wunschmaß</strong></p>'
            . '<p>Folgende Standardformate stehen zur Auswahl:</p>'
            . '<ul><li><strong>60 × 20 cm</strong></li><li><strong>80 × 30 cm</strong></li><li><strong>100 × 30 cm</strong></li><li><strong>120 × 40 cm</strong></li></ul>'
            . '<p>Alle Maße sind als <strong>Breite × Höhe</strong> angegeben und beziehen sich auf den Milchglasfolien-Streifen. Größe und Position deiner Logo-Beschriftung werden passend dazu abgestimmt.</p>'
            . '<p>Du benötigst andere Maße? Wähle <strong>„Wunschmaß anfragen“</strong> und gib die gewünschte Folienbreite und Folienhöhe in Zentimetern ein. Bei mehreren Scheiben benötigen wir die Maße und Stückzahl je Format. Wir bestätigen Zuschnittmaße, Ausführung und Preis, bevor du etwas bestellst.</p>'
            . '<p>Bitte miss die tatsächlich zu beklebende Glasfläche ohne Rahmen und Dichtungen. Bei Wunschmaßen bestätigen wir die endgültigen Zuschnittmaße, die Ausführung und den Preis vorab.</p>'
            . '<p><strong>Wichtige Hinweise</strong></p>'
            . '<p>Milchglasfolie ist lichtdurchlässig. Der Sichtschutzeffekt hängt unter anderem von Beleuchtung und Abstand zum Glas ab; vollständige Blickdichtigkeit wird nicht zugesichert.</p>'
            . '<p>Dies ist Glasdekorfolie in Milchglasoptik, keine klare getönte Sonnenschutzfolie. Glasart, vorhandene Beschichtungen und die Eignung der Fläche müssen vorab geprüft werden.</p>'
            . '<p>Die Lieferung umfasst die vereinbarte Folie und Logo-Beschriftung sowie eine Montageanleitung. Je nach Ausführung sind mehrere Montageschritte erforderlich. Montage vor Ort ist nur bei Buchung der optionalen Montage enthalten.</p>'
            . '<p>Glasflächen und Dekorationen sind nicht Bestandteil der Lieferung.</p>',
        'en' => '<p>Give your glass surfaces a calm, professional appearance with frosted-effect window film and your business logo.</p>'
            . '<p>The film reduces direct views through the covered area while providing a backdrop for your branding. We use quality ORACAL® glass-decoration film with a separate vinyl logo or business name applied over it.</p>'
            . '<p><strong>Your design</strong></p>'
            . '<p>Choose the strip dimensions, logo size and position. The frosted film forms the light-transmitting background; the logo is an additional vinyl layer.</p>'
            . '<p>A clear logo cut out of the frosted film is a different construction and is available only by separate agreement.</p>'
            . '<p>Suitable applications include salons, studios, offices and practices with compatible glass surfaces.</p>'
            . '<p><strong>Prices and scope</strong></p>'
            . '<p>Prices are for supply only, without installation: one continuous film strip with one single-colour vinyl logo applied separately. The logo keeps its original proportions and fits within the stated size.</p>'
            . '<table><thead><tr><th>Film strip (width × height)</th><th>Included logo (max. width × height)</th><th>Price</th></tr></thead><tbody>'
            . '<tr><td>60 × 20 cm</td><td>20 × 15 cm</td><td>€49.99</td></tr>'
            . '<tr><td>80 × 30 cm</td><td>30 × 20 cm</td><td>€64.99</td></tr>'
            . '<tr><td>100 × 30 cm</td><td>40 × 20 cm</td><td>€79.99</td></tr>'
            . '<tr><td>120 × 40 cm</td><td>40 × 30 cm</td><td>€99.99</td></tr>'
            . '<tr><td>Other dimensions or multiple panes</td><td>as agreed</td><td>Quotation</td></tr>'
            . '</tbody></table>'
            . '<p>Prices assume one continuous strip and straightforward, cut-ready artwork.</p>'
            . '<p><strong>Included in the price</strong></p>'
            . '<ul><li>Frosted film cut to the agreed rectangular dimensions</li><li>One standard-colour vinyl logo, supplied separately with transfer tape</li><li>One layout preview and one minor correction</li><li>Application instructions</li><li>One design for one glass pane</li></ul>'
            . '<p><strong>Possible additional charges</strong></p>'
            . '<ul><li>One additional text line within the agreed layout: +€4.99 (selectable)</li><li>Simple artwork vectorisation: from €15, after review</li><li>Larger or intricate logo: quotation</li><li>Multiple colours: quotation</li><li>Clear logo cut out of the frosted film: separate quotation</li><li>Removal of existing film or adhesive: separate quotation</li></ul>'
            . '<p><strong>On-site installation (optional)</strong></p>'
            . '<p>Installation is not included in the price but can be added within the local area (up to 15 km driving distance from Blaustein): for +€100 we position the frosted film and apply the separate logo layer.</p>'
            . '<ul><li>One accessible pane, strip up to 100 × 30 cm, straightforward application: +€100</li><li>Larger strip, including 120 × 40 cm: from €130 – we confirm the €30 difference before the appointment</li><li>Multiple panes or difficult access: quotation</li></ul>'
            . '<p>We confirm the installation appointment after reviewing the address and the photo of the glass. Example: 80 × 30 cm strip with logo and installation €164.99.</p>'
            . '<p><strong>How to order</strong></p>'
            . '<p>Select your format, upload your logo and ideally a photo of the glass, and tell us where the film will be applied. A layout preview is provided for approval before production.</p>'
            . '<p>Order several identical panes with the quantity. For other dimensions or different formats, select “Request custom size”.</p>'
            . '<p><strong>Sizes &amp; custom dimensions</strong></p>'
            . '<p>Choose from these standard formats:</p>'
            . '<ul><li><strong>60 × 20 cm</strong></li><li><strong>80 × 30 cm</strong></li><li><strong>100 × 30 cm</strong></li><li><strong>120 × 40 cm</strong></li></ul>'
            . '<p>Dimensions are shown as <strong>width × height</strong> and refer to the frosted film strip. Your logo’s size and position will be agreed to suit the strip.</p>'
            . '<p>For another format, select <strong>“Request custom size”</strong> and enter the required film width and height in centimetres. For multiple panes, provide the dimensions and quantity for each format. We confirm cutting dimensions, construction and price before you order anything.</p>'
            . '<p>Measure the glass area to be covered, excluding frames and seals. For custom dimensions we confirm the final cutting dimensions, construction and price in advance.</p>'
            . '<p><strong>Please note</strong></p>'
            . '<p>Frosted film transmits light. Privacy depends on lighting, distance and other conditions; complete concealment is not guaranteed.</p>'
            . '<p>This is decorative etched-glass-effect film, rather than clear tinted solar-control film. Glass type, coatings and surface suitability must be checked before application.</p>'
            . '<p>Your order includes the agreed film and logo lettering with application instructions. Installation may involve several steps. On-site fitting is included only if you add the optional installation; glass and decorative props are not included.</p>',
    ],
    'categories' => [
        'de' => ['milchglas-sichtschutz', 'fenster-glasaufkleber', 'business-produkte'],
        'en' => ['frosted-glass-privacy', 'window-glass-stickers', 'business-products'],
    ],
    'tags' => [
        'de' => ['Milchglasfolie', 'Sichtschutzfolie', 'Milchglas mit Logo', 'Glasdekorfolie', 'Fensterfolie Logo', 'Praxis Sichtschutz', 'Büro Sichtschutz', 'Salon Fensterfolie', 'Glaswand Folie', 'Sichtschutzstreifen', 'Firmenlogo Fenster', 'ORACAL Glasdekor', 'Frosted Glass Folie'],
        'en' => ['frosted window film', 'privacy window film', 'frosted logo film', 'business window film', 'glass privacy strip', 'office privacy film', 'salon window film', 'custom frosted film', 'glass door logo', 'window privacy logo', 'etched glass effect', 'ORACAL glass film', 'frosted glass logo'],
    ],
    'attributes' => [
        'pa_folienformat' => ['de' => 'Folienformat', 'en' => 'Film size'],
    ],
    'widths' => [
        '60x20' => ['de' => '60 × 20 cm · Logo bis 20 × 15 cm', 'en' => '60 × 20 cm · logo up to 20 × 15 cm', 'price' => '49.99'],
        '80x30' => ['de' => '80 × 30 cm · Logo bis 30 × 20 cm', 'en' => '80 × 30 cm · logo up to 30 × 20 cm', 'price' => '64.99'],
        '100x30' => ['de' => '100 × 30 cm · Logo bis 40 × 20 cm', 'en' => '100 × 30 cm · logo up to 40 × 20 cm', 'price' => '79.99'],
        '120x40' => ['de' => '120 × 40 cm · Logo bis 40 × 30 cm', 'en' => '120 × 40 cm · logo up to 40 × 30 cm', 'price' => '99.99'],
        'request' => ['de' => 'Wunschmaß anfragen', 'en' => 'Request custom size'],
    ],
    'fields' => [
        ['id' => 'logo_datei', 'type' => 'file', 'required' => true,
            'label' => $ph('Dein Logo', 'Your logo'),
            'help' => $ph('Möglichst als SVG oder vektorbasierte PDF (hochgeladen werden PNG, JPG, WebP oder PDF). Bei anderen Dateiformaten prüfen wir, ob eine saubere Umsetzung möglich ist.', 'Preferably as an SVG or vector PDF (PNG, JPG, WebP or PDF can be uploaded). For other file types we check whether a clean result is possible.')],
        ['id' => 'logogroesse', 'type' => 'text', 'required' => true, 'max' => 60,
            'label' => $ph('Gewünschte Logogröße (Breite × maximale Höhe in cm)', 'Preferred logo size (width × maximum height in cm)'),
            'placeholder' => $ph('z. B. 20 × 15 cm', 'e.g. 20 × 15 cm'),
            'help' => $ph('Das Logo behält seine Proportionen und passt in die genannte Größe. Im Preis enthalten ist die Logo-Größe des gewählten Formats.', 'The logo keeps its proportions and fits within this size. The price includes the logo size of the selected format.')],
        ['id' => 'logoposition', 'type' => 'select', 'required' => true, 'default' => 'mitte',
            'label' => $ph('Position des Logos', 'Logo position'),
            'options' => [
                ['links', $ph('Links', 'Left')],
                ['mitte', $ph('Mittig', 'Centre')],
                ['rechts', $ph('Rechts', 'Right')],
                ['individuell', $ph('Individuell (bitte unter „Weitere Wünsche“ beschreiben)', 'Custom (describe under “Additional requests”)')],
            ]],
        ['id' => 'zusatz_zeile', 'type' => 'checkbox', 'required' => false, 'price' => 4.99,
            'label' => $ph('Zusätzliche Textzeile', 'Additional text line'),
            'help' => $ph('Der Text muss in das vereinbarte Layout passen.', 'The text must fit within the agreed layout.')],
        ['id' => 'zeile_text', 'type' => 'text', 'required' => true, 'max' => 80, 'showWhen' => ['zusatz_zeile', 'true'],
            'label' => $ph('Text der zusätzlichen Zeile', 'Text of the additional line'),
            'placeholder' => $ph('z. B. www.beispiel.de oder @deinname', 'e.g. www.example.com or @yourname')],
        ['id' => 'anbringung', 'type' => 'select', 'required' => true, 'default' => 'innen-von-aussen',
            'label' => $ph('Anbringung und Leserichtung', 'Application side and reading side'),
            'help' => $ph('Auf welcher Seite der Scheibe wird die Folie angebracht und von welcher Seite soll sie gelesen werden?', 'Which side of the glass is the film applied to, and from which side should it be read?'),
            'options' => [
                ['aussen-von-aussen', $ph('Außen angebracht, von außen lesbar', 'Applied outside, read from outside')],
                ['innen-von-aussen', $ph('Innen angebracht, von außen lesbar', 'Applied inside, read from outside')],
                ['innen-von-innen', $ph('Innen angebracht, von innen lesbar', 'Applied inside, read from inside')],
            ]],
        ['id' => 'glas_foto', 'type' => 'file', 'required' => false,
            'label' => $ph('Foto der Glasfläche (optional)', 'Photo of the glass (optional)'),
            'help' => $ph('Eine Gesamtansicht samt Rahmen hilft uns bei der Prüfung von Maß und Untergrund. Für die Montage bitte unbedingt hochladen.', 'An overall view including the frame helps us check size and surface. Please always upload one if you want installation.')],
        ['id' => 'vorhandene_folie', 'type' => 'select', 'required' => true, 'default' => 'no',
            'label' => $ph('Befindet sich bereits Folie oder Kleber auf der Glasfläche?', 'Is there existing film or adhesive on the glass?'),
            'options' => [['no', $ph('Nein', 'No')], ['yes', $ph('Ja – Entfernen nur nach gesondertem Angebot', 'Yes – removal only after a separate quotation')]]],
        ['id' => 'montage', 'type' => 'checkbox', 'required' => false, 'price' => 100,
            'label' => $ph('Vor-Ort-Montage im Nahbereich', 'Local on-site installation'),
            'help' => $ph(
                'Optional, bis 15 km Fahrstrecke ab Blaustein: eine zugängliche Scheibe, Streifen bis 100 × 30 cm. Für den Streifen 120 × 40 cm gilt ab 130 € (wir bestätigen den Aufpreis vor dem Termin); mehrere Scheiben oder schwieriger Zugang: bitte Wunschmaß anfragen oder uns schreiben. Wir bestätigen den Termin, nachdem wir Adresse und Foto der Glasfläche geprüft haben.',
                'Optional, up to 15 km driving distance from Blaustein: one accessible pane, strip up to 100 × 30 cm. For the 120 × 40 cm strip the price starts at €130 (we confirm the difference before the appointment); several panes or difficult access: please request a custom size or write to us. We confirm the appointment after reviewing the address and the photo of the glass.'
            )],
        ['id' => 'montageadresse', 'type' => 'text', 'required' => true, 'max' => 150, 'showWhen' => ['montage', 'true'],
            'label' => $ph('Montageadresse', 'Installation address'),
            'placeholder' => $ph('Straße, PLZ, Ort', 'Street, postcode, town')],
        ['id' => 'anmerkungen', 'type' => 'textarea', 'required' => false, 'max' => 500,
            'label' => $ph('Weitere Wünsche (optional)', 'Additional requests (optional)'),
            'placeholder' => $ph('z. B. Hinweise zur Anordnung', 'e.g. notes on the layout')],
    ],
    'images' => [
        ['role' => '01-main', 'file' => '03-Frosted-Film/01-main.png', 'sha256' => 'a2a53b18f323c2c66b796890e694faff908b9ee06ba9b4793fec3356a64735ff',
            'title' => $ph('Milchglasfolie mit Logo an einer Glastür', 'Frosted window film with logo on a glass door'),
            'alt' => $ph('Milchglasfolien-Streifen mit dem dunklen Logo „Studio Bella – Kosmetik & Beauty“ auf einer Glastür eines Kosmetikstudios', 'Frosted film strip with the dark logo “Studio Bella – Kosmetik & Beauty” on the glass door of a beauty studio'),
            'caption' => $ph('Gestaltungsbeispiel. Namen und Logos sind Beispiele; Glastür und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names and logos are examples; the glass door and decoration are not included.')],
        ['role' => '02-detail', 'file' => '03-Frosted-Film/02-detail.png', 'sha256' => '7aedbb21cf750423d5b86c32e8124263580162673a32db8341c5dbc6ccdbf7a5',
            'title' => $ph('Sichtschutzstreifen in Milchglasoptik mit Logo', 'Frosted-effect privacy strip with logo'),
            'alt' => $ph('Nahaufnahme eines Milchglasfolien-Streifens mit dem Schriftzug „Raumwerk – Planung & Design“ auf einer Glastür', 'Close-up of a frosted film strip with the lettering “Raumwerk – Planung & Design” on a glass door'),
            'caption' => $ph('Gestaltungsbeispiel. Namen sind Beispiele; Glastür und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names are examples; the glass door and decoration are not included.')],
        ['role' => '04-office', 'file' => '03-Frosted-Film/04-office.png', 'sha256' => 'fc1bad5f56951130447b7ee570ed05c215251a694a65de862c221c5722350c9b',
            'title' => $ph('Milchglasfolie mit Logo im Büro', 'Frosted film with logo in an office'),
            'alt' => $ph('Milchglasfolien-Streifen mit dem Logo „Raumwerk – Planung & Design“ auf einer Glastür in einem Büro', 'Frosted film strip with the logo “Raumwerk – Planung & Design” on a glass door in an office'),
            'caption' => $ph('Gestaltungsbeispiel. Namen sind Beispiele; Glastür, Möbel und Dekoration gehören nicht zum Lieferumfang.', 'Design example. Names are examples; the glass door, furniture and decoration are not included.')],
    ],
];
