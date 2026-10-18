<?php
require_once __DIR__.'/../scripts/lib/etsy-csv.php';
$path=tempnam(sys_get_temp_dir(),'etsy-csv-test-');
try {
    $valid="\xEF\xBB\xBFTITLE,DESCRIPTION,PRICE,CURRENCY_CODE,QUANTITY,IMAGE1,SKU\n\"A title\",\"A multiline\ndescription with \"\"quotes\"\"\",8.50,EUR,100,https://i.etsystatic.com/example.jpg,TEST-SKU\n";
    file_put_contents($path,$valid);
    $rows=ke_read_csv($path);
    if (count($rows)!==1 || $rows[0]['DESCRIPTION']!=="A multiline\ndescription with \"quotes\"" || $rows[0]['SKU']!=='TEST-SKU') throw new RuntimeException('Multiline CSV/BOM parsing failed.');
    foreach ([str_replace(',EUR,',',USD,',$valid),str_replace('https://i.etsystatic.com/','https://unexpected.example/',$valid),"TITLE,PRICE\na,2\n"] as $invalid) {
        file_put_contents($path,$invalid);
        $rejected=false;
        try { ke_read_csv($path); } catch (RuntimeException $e) { $rejected=true; }
        if (!$rejected) throw new RuntimeException('Invalid CSV was accepted.');
    }
    $fixed=ke_reviewed_description('bamboo-mum',"School intro Sometimes a small gesture says thanks.\n🛒 HOW TO ORDER\nEnter school year.\n📦 WHAT YOU RECEIVE\nA board.\nPersonalised with a name and year by Kubikart – for a school start full of good wishes. 💛");
    if (str_contains($fixed,'School intro') || str_contains($fixed,'Enter school year') || str_contains($fixed,'Personalised with a name')) throw new RuntimeException('Fixed-design cleanup failed.');
    if (KE_JAR_PRICES!==['LID'=>'7.05','S'=>'13.50','L'=>'16.88']) throw new RuntimeException('Owner-confirmed prices changed.');
    echo "Etsy CSV parser checks passed.\n";
} finally { unlink($path); }
