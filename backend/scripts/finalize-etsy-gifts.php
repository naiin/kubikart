<?php
/** Applies the owner's 18 October confirmations ONLY to the nine imported draft pairs. Dry run default. */
if (!defined('ABSPATH')) exit;
require_once __DIR__.'/lib/etsy-csv.php';
$defs=require __DIR__.'/data/etsy-gifts.php';
$mode=$args[0] ?? 'dry-run';
if (!in_array($mode,['dry-run','apply'],true)) WP_CLI::error('Expected dry-run or apply.');
$targets=[];
foreach ($defs as $def) {
    $ids=[];
    foreach (['de','en'] as $lang) {
        $posts=get_posts(['post_type'=>'product','post_status'=>'any','name'=>$def['slugs'][$lang],'posts_per_page'=>1,'fields'=>'ids','suppress_filters'=>true]);
        $id=(int)($posts[0] ?? 0); $p=$id?wc_get_product($id):false;
        if (!$p || $p->get_status()!=='draft' || !get_post_meta($id,'_kubikart_etsy_source_key',true) || pll_get_post_language($id)!==$lang) WP_CLI::error('Imported draft guard failed: '.$def['slugs'][$lang]);
        if (!empty($def['sku']) && $p->get_sku()!==$def['sku']) WP_CLI::error('Unexpected SKU: '.$id);
        $ids[$lang]=$id;
        $targets[]=['id'=>$id,'lang'=>$lang,'def'=>$def];
        if ($def['kind']==='jar' && count($p->get_children())!==3) WP_CLI::error('Expected three jar variations: '.$id);
    }
    if ((int)pll_get_post($ids['de'],'en')!==$ids['en']) WP_CLI::error('Translation link mismatch.');
}
WP_CLI::line('Confirm fixed designs, clean copied text, and set jar prices LID 7.05 / S 13.50 / L 16.88 on 18 imported drafts only.');
if ($mode!=='apply') { WP_CLI::success('Dry run; no writes.'); return; }
$backup=['captured_at'=>gmdate('c'),'products'=>[]];
foreach ($targets as $target) {
    $id=$target['id']; $p=wc_get_product($id);
    $backup['products'][]=['post'=>get_post($id,ARRAY_A),'meta'=>get_post_meta($id)];
    foreach ($p->get_children() as $v) $backup['products'][]=['post'=>get_post($v,ARRAY_A),'meta'=>get_post_meta($v)];
}
$path=dirname(__DIR__).'/backups/etsy-confirmations-'.gmdate('Ymd-His').'.json';
if (file_put_contents($path,wp_json_encode($backup,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE))===false) WP_CLI::error('Cannot back up drafts.');
chmod($path,0600); WP_CLI::line('Confirmation backup: '.$path);
foreach ($targets as $target) {
    ['id'=>$id,'lang'=>$lang,'def'=>$def]=$target;
    $p=wc_get_product($id); $row=get_post_meta($id,'_kubikart_etsy_source_row',true);
    $description=ke_reviewed_description($def['key'],$row['DESCRIPTION']);
    $p->set_description($lang==='en'?wpautop(esc_html($description)):implode('',array_map(fn($paragraph)=>'<p>'.esc_html($paragraph).'</p>',$def['de_paragraphs'])));
    $p->set_short_description($lang==='de'?$def['de_short']:esc_html(explode("\n\n",$description)[0]));
    $p->save();
    if ($def['kind']==='jar') {
        foreach ($p->get_children() as $variation_id) {
            $v=wc_get_product($variation_id); $code=substr($v->get_sku(),strrpos($v->get_sku(),'-')+1);
            if (!isset(KE_JAR_PRICES[$code])) WP_CLI::error('Unexpected jar variant SKU: '.$v->get_sku());
            $v->set_regular_price(KE_JAR_PRICES[$code]); $v->set_sale_price(''); $v->save();
            delete_post_meta($variation_id,'_kubikart_etsy_price_review_required');
            update_post_meta($variation_id,'_kubikart_etsy_owner_confirmed_price',KE_JAR_PRICES[$code]);
        }
        WC_Product_Variable::sync($id);
    }
    $review=array_merge($def['review'] ?? [],['Videos unavailable in CSV; not imported.','Packed weight/dimensions not supplied; left unset.']);
    if ($def['kind']==='jar') $review=array_merge($review,['Repeated Etsy SKUs across four designs replaced with unique website codes; source SKU list retained.','CSV quantity is listing-level only; variation stock quantities not inferred.']);
    update_post_meta($id,'_kubikart_etsy_review_notes',$review);
    update_post_meta($id,'_kubikart_etsy_owner_confirmation',['date'=>'2026-10-18','fixed_mum_and_nervennahrung'=>true,'jar_prices'=>KE_JAR_PRICES]);
    wc_delete_product_transients($id);
    WP_CLI::line('Confirmed imported draft #'.$id);
}
WP_CLI::success('Owner confirmations applied; all products remain drafts.');
