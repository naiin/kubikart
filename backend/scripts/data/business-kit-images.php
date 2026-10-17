<?php
/**
 * Stable asset map for the Business Bundle mockup images (AI-generated, illustrative).
 *
 * Identity is `<bundle>/<role>` plus the SHA-256 of the ORIGINAL file; WordPress
 * attachment IDs are never stored here. Each accepted asset is imported once
 * per language (own localised title, alt text and caption) as WebP derived
 * from the original; the original PNG files are not modified or deleted.
 *
 * `status` is the review result against the approved package contents
 * (docs/07-products-and-bundles.md). Rejected assets are not imported
 * and the reason is kept here. Never change the package scope to fit an image.
 */

if (!defined('ABSPATH')) {
    exit;
}

function kka(string $role, string $file, string $sha, array $view, array $alt, array $caption): array {
    return ['role' => $role, 'file' => $file, 'sha256' => $sha, 'status' => 'accept', 'view' => $view, 'alt' => $alt, 'caption' => $caption];
}

function kkr(string $role, string $file, string $sha, string $reason): array {
    return ['role' => $role, 'file' => $file, 'sha256' => $sha, 'status' => 'reject', 'reason' => $reason];
}

$V_OVERVIEW = ['de' => 'Übersicht', 'en' => 'Overview'];
$V_USE = ['de' => 'Im Einsatz', 'en' => 'In use'];
$V_DETAIL = ['de' => 'Detailansicht', 'en' => 'Detail view'];
$V_ALT = ['de' => 'Alternative Ansicht', 'en' => 'Alternative view'];

$KIT_IMAGES = [
    'starter' => [
        kka('01-uebersicht', 'starter/01-uebersicht.png', '055e173d4083cf0ddd52cad417fc1d5632d1f7e95a8cce8e9b2f2050790bfcb7', $V_OVERVIEW,
            ['de' => 'Gestaltungsbeispiel für das Business-Starterpaket: dunkelblauer Acryl-Aufsteller mit zwei QR-Codes und NFC-Symbol, daneben Öffnungszeiten und Logo-Schriftzug als Beispiel auf Glasplatten. Illustrative Darstellung.', 'en' => 'Design example for the Business Starter Bundle: a navy acrylic stand with two QR codes and an NFC symbol, next to an opening-hours list and a logo lettering shown on glass panels. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Aufsteller sowie Öffnungszeiten und Logo-Schriftzug. Im Paket sind die beiden Beschriftungen Vinylfolien; Glasplatten und Halterungen sind Display-Requisiten und nicht enthalten. Die 100 Visitenkarten des Pakets sind nicht abgebildet. Der abgebildete Aufsteller ist ein Beispiel; Modell und Ausführung des enthaltenen QR-Aufstellers bestätigen wir im Angebot.', 'en' => 'Illustrative image: stand plus opening hours and logo lettering. In the bundle both lettering items are vinyl decals; the glass panels and fixings are display props and not included. The 100 business cards of the bundle are not shown. The stand pictured is an example; the model and finish of the QR stand included are confirmed in the offer.']),
        kkr('02-im-einsatz', 'starter/02-im-einsatz.png', '57f9964ae04be260656e21b16bd1af01c6da8b01a0b2113c65a811b2f3377a90',
            'The logo appears twice (on the door glass and again as a wall logo inside) while the bundle supplies exactly one logo decal; the second logo implies an item that is not in the package.'),
        kka('03-detail', 'starter/03-detail.png', '34a5de3534e0821d265176262013d7c3f4e6d7dbc717b7dc90dfc206349f838a', $V_DETAIL,
            ['de' => 'Detailansicht: Aufsteller mit zwei QR-Codes und NFC-Symbol auf einer Theke vor einer Glasfläche mit Logo-Schriftzug und Öffnungszeiten aus Folie. Illustrative Darstellung.', 'en' => 'Detail view: a stand with two QR codes and an NFC symbol on a counter in front of a glass surface with a vinyl logo lettering and opening hours. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, Detailansicht: Aufsteller und beide Folien-Beschriftungen. Glasfläche und Theke sind nicht enthalten. Die Visitenkarten sind nicht abgebildet. Der Aufsteller ist ein Beispiel; Modell und Ausführung bestätigen wir im Angebot.', 'en' => 'Illustrative image, detail view: the stand and both vinyl lettering items. The glass surface and counter are not included. The business cards are not shown. The stand is an example; model and finish are confirmed in the offer.']),
        kka('04-alternative-ansicht', 'starter/04-alternative-ansicht.png', '3302e61816d0e3932c398c993dbcba0125d59837321b5da1997fdabbd8b60052', $V_ALT,
            ['de' => 'Alternative Ansicht: Aufsteller mit zwei QR-Codes und NFC-Symbol, daneben Öffnungszeiten und Logo-Schriftzug als Folien auf transparentem Träger. Illustrative Darstellung.', 'en' => 'Alternative view: a stand with two QR codes and an NFC symbol next to opening hours and a logo lettering as decals on a clear carrier. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Aufsteller und die zwei Folien-Beschriftungen. Logo, Texte und Zeiten sind Beispiele. Die Visitenkarten sind nicht abgebildet. Der Aufsteller ist ein Beispiel; Modell und Ausführung bestätigen wir im Angebot.', 'en' => 'Illustrative image: the stand and the two vinyl lettering items. Logo, texts and times are examples. The business cards are not shown. The stand is an example; model and finish are confirmed in the offer.']),
    ],
    'gastro' => [
        kka('01-uebersicht', 'gastro/01-uebersicht.png', 'd32826dcdb3d1063ef11d6ca9f81da274240601f8adee216249a5b9b8704626f', $V_OVERVIEW,
            ['de' => 'Gestaltungsbeispiel für das Gastro-Paket: ein Theken-Aufsteller mit zwei QR-Codes und NFC-Symbol, fünf Tischaufsteller mit Speisekarten-QR-Code und zwei Menüblätter im A3-Format. Illustrative Darstellung.', 'en' => 'Design example for the Gastro Bundle: one counter stand with two QR codes and an NFC symbol, five table stands with a menu QR code and two A3 menu sheets. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: 1 Theken-Aufsteller, 5 Tischaufsteller und 2 laminierte A3-Menüblätter. Die Halter der Menüblätter sind hier nur Dekoration; QR-Codes sind Beispiele.', 'en' => 'Illustrative image: 1 counter stand, 5 table stands and 2 laminated A3 menu sheets. The holders for the menu sheets are decoration only here; QR codes are examples.']),
        kka('02-im-einsatz', 'gastro/02-im-einsatz.png', 'ac9e09e9c8d3eef0899591a246eb41f05bf8a75209e9cd3c36e12636dfecc49c', $V_USE,
            ['de' => 'Gestaltungsbeispiel für das Gastro-Paket auf einer Café-Theke: ein Aufsteller mit zwei QR-Codes, fünf Tischaufsteller und zwei Menüblätter. Illustrative Darstellung.', 'en' => 'Design example for the Gastro Bundle on a café counter: one stand with two QR codes, five table stands and two menu sheets. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, im Einsatz: 1 Aufsteller, 5 Tischaufsteller und 2 Menüblätter. Theke, Kaffeemaschine und Dekoration sind nicht enthalten; Formen und Farben sind Beispiele.', 'en' => 'Illustrative image, in use: 1 stand, 5 table stands and 2 menu sheets. The counter, coffee machine and decoration are not included; shapes and colours are examples.']),
        kka('03-detail', 'gastro/03-detail.png', 'd07fb1f220aa2f2d7da55ddd985a957dc286e097ca457cea49fa207f6f61fa9d', $V_DETAIL,
            ['de' => 'Detailansicht des Theken-Aufstellers aus dem Gastro-Paket mit zwei beschrifteten QR-Codes und NFC-Symbol. Illustrative Darstellung.', 'en' => 'Detail view of the counter stand from the Gastro Bundle with two labelled QR codes and an NFC symbol. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, Detailansicht: nur der Theken-Aufsteller. Form, Logo und QR-Muster sind Beispiele; die Tischaufsteller und Menüblätter sind hier nicht abgebildet.', 'en' => 'Illustrative image, detail view: the counter stand only. Shape, logo and QR pattern are examples; the table stands and menu sheets are not shown here.']),
        kka('04-alternative-ansicht', 'gastro/04-alternative-ansicht.png', 'c88aa46e8cb6fa060915eac4f366fe73ed23d0cb910c0cba9e3f0900c68d7be3', $V_ALT,
            ['de' => 'Alternative Ansicht des Gastro-Pakets: ein Aufsteller mit zwei QR-Codes, fünf Tischaufsteller und zwei Menüblätter mit unterschiedlichen Beispiel-Layouts. Illustrative Darstellung.', 'en' => 'Alternative view of the Gastro Bundle: one stand with two QR codes, five table stands and two menu sheets with different example layouts. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: 1 Aufsteller, 5 Tischaufsteller, 2 Menüblätter. Die zwei Beispiel-Menüs zeigen unterschiedliche Layouts; im Paket sind beide Blätter Ausdrucke derselben von dir gelieferten druckfertigen PDF-Datei.', 'en' => 'Illustrative image: 1 stand, 5 table stands, 2 menu sheets. The two example menus show different layouts; in the bundle both sheets are prints of the same print-ready PDF you supply.']),
    ],
    'barber' => [
        kka('01-uebersicht', 'friseur/01-uebersicht.png', '7ea4c18d0c08a960fac0e2ce825d280e3dc0bba7eebd40a58dbd3561f090aee8', $V_OVERVIEW,
            ['de' => 'Gestaltungsbeispiel für das Friseur- & Barber-Paket: schwarzer Aufsteller mit zwei QR-Codes und NFC-Symbol, goldene Spiegelbeschriftung und eine A3-Preisliste. Illustrative Darstellung.', 'en' => 'Design example for the Barber & Salon Bundle: a black stand with two QR codes and an NFC symbol, gold mirror lettering and an A3 price list. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Aufsteller, Spiegelbeschriftung und A3-Preisliste. Im Paket ist die Preisliste ein laminiertes Papierblatt; der hier sichtbare Halter und die Spiegel sind nicht enthalten.', 'en' => 'Illustrative image: stand, mirror lettering and A3 price list. In the bundle the price list is a laminated paper sheet; the holder shown here and the mirrors are not included.']),
        kkr('02-im-einsatz', 'friseur/02-im-einsatz.png', '664008822dcf1fe8449ec4d9521bd49678be640a76da2c88f3868c78fef64967',
            'The A3 price list is shown as a rigid, framed wall sign. The bundle supplies a laminated paper sheet without frame or installation, so the picture implies a different item and mounting.'),
        kka('03-detail', 'friseur/03-detail.png', '71be29f21a120ae381d7bebadd5a5c6e9022dd19cf617748f9a9cde9279d05c6', $V_DETAIL,
            ['de' => 'Detailansicht: schwarzer Aufsteller mit zwei QR-Codes und NFC-Symbol, goldene Spiegelbeschriftung im Hintergrund und im Vordergrund eine laminierte A3-Preisliste. Illustrative Darstellung.', 'en' => 'Detail view: a black stand with two QR codes and an NFC symbol, gold mirror lettering in the background and a laminated A3 price list in the foreground. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, Detailansicht: Aufsteller, Spiegelbeschriftung und Preisliste (nur teilweise sichtbar). Spiegel und Tresen sind nicht enthalten.', 'en' => 'Illustrative image, detail view: stand, mirror lettering and price list (only partly visible). The mirror and counter are not included.']),
        kka('04-alternative-ansicht', 'friseur/04-alternative-ansicht.png', '948b52e0cd347ad7908903f95150cfc1d1818e2be55df25a51f7859c8efe696c', $V_ALT,
            ['de' => 'Alternative Ansicht: Aufsteller mit zwei QR-Codes, goldene Spiegelbeschriftung und eine laminierte A3-Preisliste mit Beispielleistungen. Illustrative Darstellung.', 'en' => 'Alternative view: a stand with two QR codes, gold mirror lettering and a laminated A3 price list with example services. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Aufsteller, Spiegelbeschriftung und laminierte A3-Preisliste. Das Porträt-Motiv und die Beispielleistungen sind Gestaltungsbeispiele; das Porträt ist nicht Teil des Pakets.', 'en' => 'Illustrative image: stand, mirror lettering and laminated A3 price list. The portrait artwork and the example services are design examples; the portrait is not part of the bundle.']),
    ],
    'reception' => [
        kka('01-uebersicht', 'empfang/01-uebersicht.png', '1164e7ab6e5a161635b36bfdefd1331fbe1e2c6d03d75f4e0d41251f8cc8212d', $V_OVERVIEW,
            ['de' => 'Gestaltungsbeispiel für das Empfangs-Paket: freistehendes Logo-Schild aus Acryl, Aufsteller mit zwei QR-Codes und NFC-Symbol sowie zwei Türschilder „Büro“ und „Besprechung“. Illustrative Darstellung.', 'en' => 'Design example for the Reception Bundle: a freestanding acrylic logo sign, a stand with two QR codes and an NFC symbol and two door plaques reading “Büro” and “Besprechung”. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Logo-Schild, Aufsteller und 2 Türschilder (hier auf der Theke abgelegt; Lieferung ohne Montage). Namen und QR-Muster sind Beispiele.', 'en' => 'Illustrative image: logo sign, stand and 2 door plaques (shown on the counter here; supplied without installation). Names and QR patterns are examples.']),
        kka('02-im-einsatz', 'empfang/02-im-einsatz.png', 'e18b65562226bfda204f71be5ea6694e71046a6a686e01d2d73d4ad3549945eb', $V_USE,
            ['de' => 'Gestaltungsbeispiel des Empfangs-Pakets auf einer Empfangstheke: Logo-Schild, Aufsteller mit QR-Codes und zwei dunkle Türschilder. Illustrative Darstellung.', 'en' => 'Design example of the Reception Bundle on a reception counter: logo sign, stand with QR codes and two dark door plaques. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, im Einsatz: Logo-Schild, Aufsteller und 2 Türschilder. Theke, Pflanze und Einrichtung sind nicht enthalten; Farben und Formen sind Beispiele.', 'en' => 'Illustrative image, in use: logo sign, stand and 2 door plaques. The counter, plant and furnishings are not included; colours and shapes are examples.']),
        kka('03-detail', 'empfang/03-detail.png', 'b2a27a77c85fe2d28bddff6b0aa333e78c14a140adb77159d232124e407ac38d', $V_DETAIL,
            ['de' => 'Detailansicht des Empfangs-Pakets: Logo-Schild, schmaler Aufsteller mit zwei QR-Codes und zwei transparente Türschilder. Illustrative Darstellung.', 'en' => 'Detail view of the Reception Bundle: logo sign, a narrow stand with two QR codes and two clear door plaques. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, Detailansicht: Logo-Schild, Aufsteller und 2 Türschilder. Logo, Fußform und Beschriftung sind Beispiele.', 'en' => 'Illustrative image, detail view: logo sign, stand and 2 door plaques. Logo, base shape and lettering are examples.']),
        kka('04-alternative-ansicht', 'empfang/04-alternative-ansicht.png', '8c1565be210d2d97ad13958bbd304d692883c16228f06b76d05f276da389d12f', $V_ALT,
            ['de' => 'Alternative Ansicht des Empfangs-Pakets mit hellen Türschildern, Logo-Schild und Aufsteller mit zwei QR-Codes. Illustrative Darstellung.', 'en' => 'Alternative view of the Reception Bundle with light door plaques, logo sign and a stand with two QR codes. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Logo-Schild, Aufsteller und 2 Türschilder. Die endgültige Material- und Farbkombination wird im digitalen Entwurf abgestimmt.', 'en' => 'Illustrative image: logo sign, stand and 2 door plaques. The final material and colour combination is agreed in the digital proof.']),
    ],
    'window' => [
        kka('01-uebersicht', 'fenster/01-uebersicht.png', '309420d726113b291f11398dd0782277fd10775b85d888e5ded892f81a7b0f11', $V_OVERVIEW,
            ['de' => 'Gestaltungsbeispiel für das Schaufenster-Paket: Logo-Schriftzug, Öffnungszeiten und ein dreizeiliger Angebotstext als drei getrennte Folien auf einer Schaufensterfläche. Illustrative Darstellung.', 'en' => 'Design example for the Shop Window Bundle: a logo lettering, opening hours and a three-line offer text as three separate decals on a shop window. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Logo-Schriftzug, Öffnungszeiten und Angebotstext als drei getrennte Folien. Übertragungsfolie und Anleitung sind nicht abgebildet; Schaufenster und Einrichtung sind nicht enthalten.', 'en' => 'Illustrative image: logo lettering, opening hours and offer text as three separate decals. The transfer film and guide are not shown; the window and furnishings are not included.']),
        kka('02-im-einsatz', 'fenster/02-im-einsatz.png', '92de0287656f82d17e870020247eec0e332f3c0ca0a89599d4c1f418752e8e6f', $V_USE,
            ['de' => 'Gestaltungsbeispiel des Schaufenster-Pakets an einer Eingangstür: Logo-Schriftzug, Öffnungszeiten und Angebotstext aus Folie. Illustrative Darstellung.', 'en' => 'Design example of the Shop Window Bundle on an entrance door: vinyl logo lettering, opening hours and offer text. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, im Einsatz: drei Folien-Beschriftungen an einer Glastür. Tür, Möbel und Pflanzen sind nicht enthalten; Lieferung ohne Montage.', 'en' => 'Illustrative image, in use: three vinyl decals on a glass door. The door, furniture and plants are not included; supplied without installation.']),
        kka('03-detail', 'fenster/03-detail.png', '731487cfbb5f6f223cde354b80fc0d443e66b63b588035604c59460b468fb663', $V_DETAIL,
            ['de' => 'Detailansicht des Schaufenster-Pakets: Logo-Schriftzug, Öffnungszeiten und Angebotstext aus Folie auf Glas. Illustrative Darstellung.', 'en' => 'Detail view of the Shop Window Bundle: vinyl logo lettering, opening hours and offer text on glass. Illustrative image.'],
            ['de' => 'Illustrative Darstellung, Detailansicht: die drei Folien auf Glas. Schriftarten, Texte und Zeiten sind Beispiele; Glasflächen sind nicht enthalten.', 'en' => 'Illustrative image, detail view: the three decals on glass. Fonts, texts and times are examples; the glass surfaces are not included.']),
        kka('04-alternative-ansicht', 'fenster/04-alternative-ansicht.png', 'dc295bc92c3d62b54dcf499d5bd3e44a38eecd6d1f69a02b1c28875f664ee0b8', $V_ALT,
            ['de' => 'Alternative Ansicht des Schaufenster-Pakets an einer Glasfront: Logo-Schriftzug, Öffnungszeiten und Angebotstext aus Folie. Illustrative Darstellung.', 'en' => 'Alternative view of the Shop Window Bundle on a glass front: vinyl logo lettering, opening hours and offer text. Illustrative image.'],
            ['de' => 'Illustrative Darstellung: Logo-Schriftzug, Öffnungszeiten und Angebotstext als drei getrennte Folien. Das Logo ist ein Beispiel, kein Kundenprojekt.', 'en' => 'Illustrative image: logo lettering, opening hours and offer text as three separate decals. The logo is an example, not a customer project.']),
    ],
];
