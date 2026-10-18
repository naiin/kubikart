<?php
/** Pure fixture checks: php backend/tests/etsy-packing.test.php */
$packing=require __DIR__.'/../scripts/data/etsy-packing.php';
$check=static function ($condition,$message) { if (!$condition) throw new RuntimeException($message); };
foreach ([$packing['board'],$packing['keychain-3d-name'],$packing['wood-keychain'],...array_values($packing['jar'])] as $entry) {
    $check(count($entry['dimensions'])===3 && min($entry['dimensions'])>0,'Positive dimensions required.');
    $check((float)$entry['weight']>0 && str_contains($entry['note'],'unmeasured'),'Positive weight and uncertainty note required.');
}
$check($packing['jar']['S']['dimensions'][2]>10.6,'Small jar needs packing allowance.');
$check($packing['jar']['L']['dimensions'][2]>16,'Large jar needs packing allowance.');
$check($packing['jar']['LID']['weight']!==$packing['jar']['L']['weight'],'Lid must not inherit full-jar weight.');
$check($packing['board']['dimensions'][0]>21 && $packing['board']['dimensions'][1]>14,'Board needs packing allowance.');
echo "Etsy packing estimate checks passed.\n";
