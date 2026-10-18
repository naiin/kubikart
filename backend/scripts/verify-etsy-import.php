<?php
/** Read-only verification of the real imported catalog and the pre-import product snapshot. */
if (!defined('ABSPATH')) exit;
require_once __DIR__.'/lib/etsy-csv.php';
$defs=require __DIR__.'/data/etsy-gifts.php';
$snapshot_path=$args[0] ?? '';
$snapshot=json_decode(file_get_contents($snapshot_path),true);
if (!$snapshot || count($snapshot['pairs'] ?? [])!==9) WP_CLI::error('Expected completed nine-pair import snapshot.');
$check=static function($ok,$message) { if (!$ok) WP_CLI::error($message); };
foreach ($snapshot['existing'] as $before) {
    $id=(int)$before['post']['ID'];
    $check(get_post($id,ARRAY_A)===$before['post'],'Existing product post changed: '.$id);
    $check(get_post_meta($id)===$before['meta'],'Existing product metadata changed: '.$id);
}
$products=0; $variations=0; $images=[]; $summary=[];
foreach ($snapshot['pairs'] as $pair) {
    $def=current(array_filter($defs,fn($d)=>$d['key']===$pair['key']));
    $de=$pair['ids']['de']; $en=$pair['ids']['en'];
    $check((int)pll_get_post($de,'en')===$en,'Missing product translation link.');
    foreach ($pair['ids'] as $lang=>$id) {
        $p=wc_get_product($id);
        $check($p->get_status()==='draft' && $p->get_catalog_visibility()==='hidden','Draft visibility mismatch: '.$id);
        $check($p->get_sku()===$pair['sku'],'Product SKU mismatch: '.$id);
        $check((int)$p->get_image_id()===(int)$pair['images'][0],'Featured image mismatch.');
        $check($p->get_gallery_image_ids()===array_slice($pair['images'],1),'Gallery ordering mismatch.');
        $check(count($pair['images'])===count($def['views']),'Image count mismatch.');
        $check($p->get_weight()==='' && $p->get_length()==='' && $p->get_width()==='' && $p->get_height()==='','Unexpected invented shipping measurements.');
        $source=get_post_meta($id,'_kubikart_etsy_source_row',true);
        $check(!empty($source['DESCRIPTION']) && !empty($source['IMAGE1']),'Source provenance missing.');
        if ($def['kind']!=='jar') $check((float)$p->get_regular_price()===(float)$source['PRICE'],'CSV price mismatch.');
        $fields=get_post_meta($id,'_kubikart_custom_fields',true)['fields'];
        $expected=['bamboo-mum'=>0,'bamboo-school'=>2,'jar-new-parents'=>0,'jar-wedding-hearts'=>3,'jar-wedding-rings'=>3,'jar-wedding-us'=>3,'keychain-3d-name'=>4,'keychain-wood-name'=>5,'keychain-wood-profession'=>3][$def['key']];
        $check(count($fields)===$expected,'Personalization count mismatch: '.$id);
        if ($def['key']==='keychain-3d-name') {
            $check(count($fields[1]['options'])===4 && count($fields[2]['options'])===12 && count($fields[3]['options'])===12,'Colour/charm choices mismatch.');
            $check($fields[0]['maxLength']===8,'Name limit mismatch.');
        }
        if ($def['key']==='keychain-wood-name') {
            $check((float)$fields[3]['price']===1.0 && $fields[3]['required']===false,'Optional back price mismatch.');
            $check($fields[4]['showWhen']===['field'=>'back_engraving','equals'=>'true'] && $fields[4]['maxLength']===50,'Conditional back field mismatch.');
        }
        if ($def['kind']==='jar') {
            $check(count($p->get_children())===3,'Expected three jar variations.');
            foreach ($p->get_children() as $variation_id) {
                $v=wc_get_product($variation_id); $code=substr($v->get_sku(),strrpos($v->get_sku(),'-')+1);
                $check(isset(KE_JAR_PRICES[$code]) && (float)$v->get_regular_price()===(float)KE_JAR_PRICES[$code],'Jar variation price mismatch.');
                $check(!$v->get_manage_stock(),'Invented per-variation stock.');
                $translated=(int)pll_get_post($variation_id,$lang==='de'?'en':'de');
                $check($translated && wc_get_product($translated)->get_sku()===$v->get_sku(),'Variation translation/SKU mismatch.');
                $variations++;
            }
        }
        $products++;
    }
    foreach ($pair['images'] as $position=>$image_id) {
        $check(get_post_mime_type($image_id)==='image/webp','Image not optimized WebP.');
        $check(get_post_meta($image_id,'_wp_attachment_image_alt',true)===$def['views'][$position][0],'German alt mismatch.');
        $check(get_post_meta($image_id,'_kubikart_text_en_alt',true)===$def['views'][$position][1],'English alt mismatch.');
        $meta=wp_get_attachment_metadata($image_id);
        $check(!empty($meta['width']) && !empty($meta['height']) && is_file(get_attached_file($image_id)),'Missing image metadata or physical media.');
        $images[$image_id]=true;
    }
    $summary[]=['key'=>$pair['key'],'de'=>$de,'en'=>$en,'sku'=>$pair['sku'],'images'=>count($pair['images'])];
}
$check($products===18 && $variations===24 && count($images)===48,'Import total mismatch.');
WP_CLI::line(wp_json_encode(['verified_products'=>$products,'verified_variations'=>$variations,'verified_images'=>count($images),'existing_products_unchanged'=>count($snapshot['existing']),'pairs'=>$summary],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
WP_CLI::success('Native catalog, translations, fields, prices and media verification passed.');
