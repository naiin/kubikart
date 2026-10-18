<?php
/** wp eval-file scripts/publish-etsy-products.php [dry-run|apply]
 * Owner-authorized publication of nine imported bilingual families, with packing estimates.
 * Existing manually entered packing values are preserved. No price/stock/personalisation edits.
 */
if (!defined('ABSPATH')) exit;
$mode=$args[0] ?? 'dry-run';
if (!in_array($mode,['dry-run','apply'],true)) WP_CLI::error('Expected dry-run or apply.');
if (get_option('woocommerce_dimension_unit')!=='cm' || get_option('woocommerce_weight_unit')!=='kg') WP_CLI::error('Expected cm and kg store units.');
$defs=require __DIR__.'/data/etsy-gifts.php';
$packing=require __DIR__.'/data/etsy-packing.php';
$dimension_marker='_kubikart_shipping_dimensions_estimate';
$weight_marker='_kubikart_shipping_weight_estimate';
$targets=[]; $snapshot=[]; $untouched=[];
$protected=static function ($product) use ($dimension_marker,$weight_marker) {
    $data=$product->get_data();
    foreach (['date_created','date_modified','status','catalog_visibility','weight','length','width','height','meta_data'] as $key) unset($data[$key]);
    $meta=[];
    foreach ($product->get_meta_data() as $entry) {
        $entry=$entry->get_data();
        if (in_array($entry['key'],[$dimension_marker,$weight_marker,'_product_version','_edit_lock','_edit_last'],true)) continue;
        $meta[$entry['key']]=$entry['value'];
    }
    ksort($meta); $data['preserved_meta']=$meta;
    return wp_json_encode($data);
};
$add=static function ($p,$estimate,$scope,$publish=false) use (&$targets,&$snapshot,$protected) {
    $id=$p->get_id();
    $dimensions=[$p->get_length('edit'),$p->get_width('edit'),$p->get_height('edit')];
    $nonempty=count(array_filter($dimensions,fn($value)=>$value!==''));
    if ($nonempty!==0 && $nonempty!==3) WP_CLI::error('Partial existing dimensions require review: '.$id);
    if ($nonempty===3 && min(array_map('floatval',$dimensions))<=0) WP_CLI::error('Invalid existing dimensions: '.$id);
    if ($p->get_weight('edit')!=='' && (float)$p->get_weight('edit')<=0) WP_CLI::error('Invalid existing weight: '.$id);
    $targets[$id]=['id'=>$id,'estimate'=>$estimate,'scope'=>$scope,'publish'=>$publish,'set_dimensions'=>$nonempty===0,'set_weight'=>$p->get_weight('edit')==='','protected'=>$protected($p)];
    $snapshot[$id]=['post'=>get_post($id,ARRAY_A),'meta'=>get_post_meta($id),'data'=>$p->get_data()];
    WP_CLI::line(wp_json_encode(['id'=>$id,'sku'=>$p->get_sku(),'dimensions_cm'=>$nonempty ? $dimensions : $estimate['dimensions'],'weight_kg'=>$p->get_weight('edit')!=='' ? $p->get_weight('edit') : $estimate['weight'],'publish'=>$publish]));
};
foreach ($defs as $def) {
    $ids=[];
    foreach ($def['slugs'] as $lang=>$slug) {
        $post=get_page_by_path($slug,OBJECT,'product'); $p=$post ? wc_get_product($post->ID) : false;
        if (!$p || !get_post_meta($p->get_id(),'_kubikart_etsy_source_key',true) || pll_get_post_language($p->get_id())!==$lang) WP_CLI::error('Imported-product guard failed: '.$slug);
        if (!in_array($p->get_status(),['draft','publish'],true) || !$p->get_sku() || !$p->get_image_id()) WP_CLI::error('Publication preflight failed: '.$slug);
        if (count(kubikart_product_videos($p->get_id()))!==($def['key']==='keychain-3d-name' ? 2 : 1)) WP_CLI::error('Missing product videos: '.$slug);
        $fields=get_post_meta($p->get_id(),'_kubikart_custom_fields',true);
        if (!is_array($fields) || !isset($fields['fields']) || !is_array($fields['fields'])) WP_CLI::error('Missing personalization schema: '.$slug);
        $ids[$lang]=$p->get_id();
        if ($def['kind']==='jar') {
            if (count($p->get_children())!==3) WP_CLI::error('Expected three jar variations: '.$slug);
            foreach ($p->get_children() as $variation_id) {
                $v=wc_get_product($variation_id); $code=substr($v->get_sku(),strrpos($v->get_sku(),'-')+1);
                if (!isset($packing['jar'][$code]) || (float)$v->get_price()<=0 || $v->get_status()!=='publish') WP_CLI::error('Invalid jar variation: '.$variation_id);
                $add($v,$packing['jar'][$code],'selected-variation');
            }
            $estimate=$packing['jar']['L'];
        } else {
            if ((float)$p->get_price()<=0) WP_CLI::error('Missing product price: '.$slug);
            $estimate=$packing[$def['kind']==='board' ? 'board' : ($def['key']==='keychain-3d-name' ? $def['key'] : 'wood-keychain')];
        }
        $add($p,$estimate,'maximum-standard-pack',true);
    }
    if ((int)pll_get_post($ids['de'],'en')!==$ids['en']) WP_CLI::error('Translation link mismatch.');
}
if (count($targets)!==42) WP_CLI::error('Expected 18 parents and 24 variations.');
foreach (get_posts(['post_type'=>['product','product_variation'],'post_status'=>'any','posts_per_page'=>-1,'fields'=>'ids','suppress_filters'=>true]) as $id) {
    if (!isset($targets[$id])) $untouched[$id]=wp_json_encode(wc_get_product($id)->get_data());
}
if ($mode!=='apply') { WP_CLI::success('Dry run: 18 translated products to publish; 42 packing records checked. No writes.'); return; }
$backup=dirname(__DIR__).'/backups/etsy-publication-'.gmdate('Ymd-His').'.json';
if (file_put_contents($backup,wp_json_encode(['records'=>$snapshot,'plan'=>$targets],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE))===false) WP_CLI::error('Cannot save snapshot.');
chmod($backup,0600); WP_CLI::line('Backup: '.$backup);
// Packing first, then publication: no newly public listing is left without packing data.
foreach ($targets as $id=>$target) {
    $p=wc_get_product($id); $estimate=$target['estimate'];
    $provenance=['version'=>1,'basis'=>'owner-approved-estimate','scope'=>$target['scope'],'note'=>$estimate['note']];
    if ($target['set_dimensions']) {
        [$length,$width,$height]=$estimate['dimensions'];
        $p->set_length((string)$length); $p->set_width((string)$width); $p->set_height((string)$height);
        $p->update_meta_data($dimension_marker,array_merge($provenance,['unit'=>'cm']));
    }
    if ($target['set_weight']) {
        $p->set_weight($estimate['weight']);
        $p->update_meta_data($weight_marker,array_merge($provenance,['unit'=>'kg']));
    }
    $p->save(); wc_delete_product_transients($id);
}
foreach ($targets as $id=>$target) if ($target['publish']) {
    $p=wc_get_product($id); $p->set_status('publish'); $p->set_catalog_visibility('visible'); $p->save();
    if ($p->is_type('variable')) WC_Product_Variable::sync($id);
    wc_delete_product_transients($id);
}
foreach ($targets as $id=>$target) {
    clean_post_cache($id); $p=wc_get_product($id);
    if ($target['publish'] && ($p->get_status()!=='publish' || $p->get_catalog_visibility()!=='visible' || !$p->is_purchasable())) WP_CLI::error('Publication verification failed: '.$id);
    if ((float)$p->get_weight()<=0 || min((float)$p->get_length(),(float)$p->get_width(),(float)$p->get_height())<=0) WP_CLI::error('Packing values missing: '.$id);
    if ($protected($p)!==$target['protected']) WP_CLI::error('Unrelated commercial data changed: '.$id);
}
foreach ($untouched as $id=>$before) {
    clean_post_cache($id);
    if (wp_json_encode(wc_get_product($id)->get_data())!==$before) WP_CLI::error('Out-of-scope product changed: '.$id);
}
WP_CLI::success('Published all 18 translated products; 42 packing records verified; other commercial data and catalog records unchanged.');
