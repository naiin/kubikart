<?php
/** Pure CSV parser; handles quoted multiline Etsy descriptions without splitting records. */
function ke_read_csv(string $path): array {
    $handle = fopen($path, 'rb');
    if (!$handle) throw new RuntimeException('Cannot open Etsy CSV.');
    try {
        $headers = fgetcsv($handle, 0, ',', '"', '');
        if (!$headers) throw new RuntimeException('Empty Etsy CSV.');
        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);
        foreach (['TITLE', 'DESCRIPTION', 'PRICE', 'CURRENCY_CODE', 'QUANTITY', 'IMAGE1', 'SKU'] as $required) {
            if (!in_array($required, $headers, true)) throw new RuntimeException('Missing CSV column: ' . $required);
        }
        $rows = [];
        while (($values = fgetcsv($handle, 0, ',', '"', '')) !== false) {
            if ($values === [null]) continue;
            if (count($values) !== count($headers)) throw new RuntimeException('Malformed CSV row.');
            $row = array_combine($headers, $values);
            if ($row['CURRENCY_CODE'] !== 'EUR' || !is_numeric($row['PRICE']) || (float) $row['PRICE'] <= 0) throw new RuntimeException('Unsupported currency or price.');
            if (!preg_match('#^https://i\.etsystatic\.com/#', $row['IMAGE1'])) throw new RuntimeException('Unexpected source image host.');
            $rows[] = $row;
        }
        return $rows;
    } finally { fclose($handle); }
}

/** Explicit owner confirmations on 18 October 2026, not prices inferred from CSV order. */
const KE_JAR_PRICES = ['LID'=>'7.05','S'=>'13.50','L'=>'16.88'];
function ke_reviewed_description(string $key, string $source): string {
    if ($key==='bamboo-mum') {
        $start=strpos($source,'Sometimes a small gesture');
        if ($start!==false) $source=substr($source,$start);
        $source=preg_replace('/🛒 HOW TO ORDER.*?📦 WHAT YOU RECEIVE/s',"🛒 HOW TO ORDER\nChoose the fixed Danke Mama design shown. No name, date or school year is required.\n\n📦 WHAT YOU RECEIVE",$source);
        $source=str_replace('Personalised with a name and year by Kubikart – for a school start full of good wishes. 💛','Engraved by Kubikart as a thank-you for Mum.',$source);
    }
    if ($key==='jar-new-parents') {
        $source=preg_replace('/🛒 HOW TO ORDER.*?📦 WHAT YOU RECEIVE/s',"🛒 HOW TO ORDER\nChoose the small jar, large jar or replacement lid only. The quote is a fixed design; no names or date are required.\n\n📦 WHAT YOU RECEIVE",$source);
        $source=str_replace(['a personalised engraved wooden lid.','Personalised with names and a date by Kubikart.'],['a wooden lid engraved with the fixed German quote.','Engraved with the fixed German quote by Kubikart.'],$source);
    }
    if (str_starts_with($key,'jar-')) {
        $source=str_replace('One empty glass jar in your chosen size','For the small or large option: one empty glass jar in your chosen size',$source);
        $source.="\n\nREPLACEMENT LID OPTION\nThe replacement-lid-only option includes one engraved wooden lid, not a glass jar. Filling and decorations are not included.";
    }
    if (str_starts_with($key,'keychain-wood-')) {
        $source=str_replace(['the 12 fonts shown','one of the 12 fonts shown'],['the numbered fonts shown','one of the numbered fonts shown'],$source);
    }
    return $source;
}
