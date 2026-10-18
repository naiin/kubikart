<?php
/** wp eval-file scripts/configure-shipping-classes.php [dry-run|apply] [etsy]
 * Owner scope: imported Etsy products only. Never reclassifies the original catalog.
 * Assign customer-charge classes, not invented parcel measurements. Drafts remain drafts.
 */
if (!defined('ABSPATH')) exit;
$mode=$args[0] ?? 'dry-run'; $scope=$args[1] ?? 'etsy';
if (!in_array($mode,['dry-run','apply'],true) || $scope!=='etsy') WP_CLI::error('Expected dry-run/apply; scope must remain etsy.');
$defs=require __DIR__.'/data/etsy-gifts.php';
$jar_slugs=[];
foreach ($defs as $def) if ($def['kind']==='jar') $jar_slugs=array_merge($jar_slugs,array_values($def['slugs']));
$classes=['kubikart-parcel'=>'Kubikart Paket – Gläser','kubikart-small-packet'=>'Kubikart Kleinversand'];
$class_ids=[];
foreach ($classes as $slug=>$name) { $term=get_term_by('slug',$slug,'product_shipping_class'); $class_ids[$slug]=$term?(int)$term->term_id:0; }
$targets=[]; $before=[];
$ids=get_posts(['post_type'=>'product','post_status'=>'any','posts_per_page'=>-1,'fields'=>'ids','suppress_filters'=>true]);
foreach ($ids as $id) {
    $p=wc_get_product($id);
    if (!$p || $p->is_virtual() || get_post_meta($id,'_kubikart_purchase_mode',true)==='enquiry' || get_post_meta($id,'_kubikart_kit_order_mode',true)==='enquiry') continue;
    if (!get_post_meta($id,'_kubikart_etsy_source_key',true)) continue;
    $slug=in_array($p->get_slug(),$jar_slugs,true)?'kubikart-parcel':'kubikart-small-packet';
    $existing=(int)$p->get_shipping_class_id();
    if ($existing && !in_array($existing,array_values($class_ids),true)) WP_CLI::error('Existing unrelated shipping class; review product '.$id.' before replacing.');
    foreach ($p->get_children() as $variation_id) {
        if (wp_get_object_terms($variation_id,'product_shipping_class',['fields'=>'ids'])) WP_CLI::error('Explicit variation shipping override requires review: '.$variation_id);
    }
    $targets[$id]=$slug;
    $before[$id]=['post'=>get_post($id,ARRAY_A),'meta'=>get_post_meta($id),'shipping_terms'=>wp_get_object_terms($id,'product_shipping_class',['fields'=>'ids'])];
}
WP_CLI::line(wp_json_encode(['scope'=>$scope,'products'=>count($targets),'parcel'=>count(array_filter($targets,fn($slug)=>$slug==='kubikart-parcel')),'small_packet'=>count(array_filter($targets,fn($slug)=>$slug==='kubikart-small-packet'))]));
if ($mode!=='apply') { WP_CLI::success('Dry run; no writes.'); return; }
$backup=dirname(__DIR__).'/backups/shipping-classes-'.gmdate('Ymd-His').'.json';
$snapshot=['scope'=>$scope,'products'=>$before,'classes_before'=>$class_ids,'assignments'=>$targets];
if (file_put_contents($backup,wp_json_encode($snapshot,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE))===false) WP_CLI::error('Cannot save backup.');
chmod($backup,0600); WP_CLI::line('Backup: '.$backup);
foreach ($classes as $slug=>$name) if (!$class_ids[$slug]) {
    $term=wp_insert_term($name,'product_shipping_class',['slug'=>$slug]);
    if (is_wp_error($term)) WP_CLI::error($term->get_error_message());
    $class_ids[$slug]=(int)$term['term_id'];
}
foreach ($targets as $id=>$slug) {
    $p=wc_get_product($id);
    if ((int)$p->get_shipping_class_id()!==$class_ids[$slug]) { $p->set_shipping_class_id($class_ids[$slug]); $p->save(); }
    wc_delete_product_transients($id);
}
foreach ($targets as $id=>$slug) {
    clean_post_cache($id); $p=wc_get_product($id);
    if ($p->get_shipping_class()!==$slug) WP_CLI::error('Shipping class mismatch: '.$id);
    $post=get_post($id,ARRAY_A); $original=$before[$id]['post'];
    foreach (['post_modified','post_modified_gmt'] as $key) { unset($post[$key],$original[$key]); }
    if ($post!==$original || get_post_meta($id)!==$before[$id]['meta']) WP_CLI::error('Non-shipping product data changed: '.$id);
    foreach ($p->get_children() as $variation_id) if (wc_get_product($variation_id)->get_shipping_class()!==$slug) WP_CLI::error('Variation did not inherit class: '.$variation_id);
}
WP_CLI::success('Shipping classes saved and inherited variations verified; all other product data unchanged.');
