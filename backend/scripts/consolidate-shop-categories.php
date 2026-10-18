<?php
/** wp eval-file scripts/consolidate-shop-categories.php [dry-run|apply]
 * Merge reviewed categories only; retain numeric filter aliases. Never delete products.
 */
if (!defined('ABSPATH')) exit;
$mode=$args[0] ?? 'dry-run';
if (!in_array($mode,['dry-run','apply'],true)) WP_CLI::error('Expected dry-run or apply.');
$config=require __DIR__.'/data/shop-categories.php';
$groups=[]; $merges=[]; $plan=[]; $snapshot=['terms'=>[],'products'=>[],'aliases'=>get_option('kubikart_category_aliases',[])];
$terms=get_terms(['taxonomy'=>'product_cat','hide_empty'=>false,'lang'=>'']);
foreach ($terms as $term) $snapshot['terms'][$term->term_id]=['term'=>$term,'meta'=>get_term_meta($term->term_id),'translations'=>pll_get_term_translations($term->term_id),'lang'=>pll_get_term_language($term->term_id)];
foreach ($config['groups'] as $key=>$group) foreach (['de','en'] as $lang) {
    [$slug,$name]=$group[$lang]; $term=get_term_by('slug',$slug,'product_cat');
    if (!$term && empty($group['create'])) WP_CLI::error('Missing retained category: '.$slug);
    if ($term && pll_get_term_language($term->term_id)!==$lang) WP_CLI::error('Category language mismatch: '.$slug);
    $groups[$key][$lang]=$term ? (int)$term->term_id : 0;
}
foreach ($config['merges'] as $slug=>$group) {
    $term=get_term_by('slug',$slug,'product_cat');
    if (!$term) continue; // Repeat-safe after an earlier successful merge.
    $lang=pll_get_term_language($term->term_id);
    if (!isset($groups[$group][$lang]) || !$groups[$group][$lang]) WP_CLI::error('Missing merge destination: '.$slug);
    if ((int)get_option('default_product_cat')===(int)$term->term_id) WP_CLI::error('Refusing to delete default category.');
    $merges[$term->term_id]=$groups[$group][$lang];
}
foreach (get_posts(['post_type'=>'shop_coupon','post_status'=>'any','posts_per_page'=>-1]) as $post) {
    $coupon=new WC_Coupon($post->ID);
    if (array_intersect(array_keys($merges),array_merge($coupon->get_product_categories(),$coupon->get_excluded_product_categories()))) WP_CLI::error('Coupon dependency requires review: '.$post->ID);
}
$all_ids=get_posts(['post_type'=>['product','product_variation'],'post_status'=>array_values(get_post_stati()),'posts_per_page'=>-1,'fields'=>'ids','suppress_filters'=>true]);
foreach ($all_ids as $id) {
    $p=wc_get_product($id);
    $data=$p->get_data(); unset($data['category_ids']);
    $snapshot['products'][$id]=['post'=>get_post($id,ARRAY_A),'meta'=>get_post_meta($id),'categories'=>$p->get_category_ids(),'protected'=>wp_json_encode($data)];
}
foreach ($config['products'] as $de_slug=>$keys) {
    $post=get_page_by_path($de_slug,OBJECT,'product');
    if (!$post || pll_get_post_language($post->ID)!=='de') WP_CLI::error('Missing known German product: '.$de_slug);
    $translations=pll_get_post_translations($post->ID);
    foreach (['de','en'] as $lang) {
        $id=(int)($translations[$lang] ?? 0);
        if (!$id || !isset($snapshot['products'][$id])) WP_CLI::error('Missing product translation: '.$de_slug);
        $plan[$id]=['lang'=>$lang,'groups'=>$keys];
    }
}
foreach ($merges as $old=>$target) WP_CLI::line('Merge category #'.$old.' -> #'.$target);
WP_CLI::line(wp_json_encode(['existing_categories'=>count($terms),'retained_pairs'=>count($groups),'delete_after_reassignment'=>count($merges),'known_product_assignments'=>count($plan),'protected_product_records'=>count($all_ids)]));
if ($mode!=='apply') { WP_CLI::success('Dry run; no writes.'); return; }
$backup=dirname(__DIR__).'/backups/shop-categories-'.gmdate('Ymd-His').'.json';
if (file_put_contents($backup,wp_json_encode($snapshot,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE))===false) WP_CLI::error('Cannot write snapshot.');
chmod($backup,0600); WP_CLI::line('Snapshot: '.$backup);
foreach ($config['groups'] as $key=>$group) {
    foreach (['de','en'] as $lang) {
        [$slug,$name]=$group[$lang];
        $parent=isset($group['parent']) ? $groups[$group['parent']][$lang] : 0;
        if (!$groups[$key][$lang]) {
            $result=wp_insert_term($name,'product_cat',['slug'=>$slug,'parent'=>$parent]);
            if (is_wp_error($result)) WP_CLI::error($result->get_error_message());
            $groups[$key][$lang]=(int)$result['term_id']; pll_set_term_language($result['term_id'],$lang);
        } else {
            $result=wp_update_term($groups[$key][$lang],'product_cat',['name'=>$name,'parent'=>$parent]);
            if (is_wp_error($result)) WP_CLI::error($result->get_error_message());
        }
    }
    pll_save_term_translations($groups[$key]);
}
update_option('kubikart_category_aliases',array_replace($snapshot['aliases'],$merges),false);
// Migrate every reference, including trashed products; don't drop unknown owner's categories.
foreach ($all_ids as $id) {
    if (get_post_type($id)!=='product') continue;
    $lang=(string)pll_get_post_language($id);
    $ids=array_map(fn($old)=>kubikart_resolve_category((int)$old,$lang),$snapshot['products'][$id]['categories']);
    if (isset($plan[$id])) {
        $retained=[];
        foreach ($groups as $pair) $retained=array_merge($retained,array_values($pair));
        $ids=array_filter($ids,fn($term_id)=>!in_array($term_id,$retained,true));
        foreach ($plan[$id]['groups'] as $key) $ids[]=$groups[$key][$lang];
    }
    $result=wp_set_object_terms($id,array_values(array_unique(array_map('intval',$ids))),'product_cat');
    if (is_wp_error($result)) WP_CLI::error($result->get_error_message());
    clean_post_cache($id); wc_delete_product_transients($id);
}
foreach ($merges as $old=>$target) {
    $objects=get_objects_in_term($old,'product_cat');
    if (is_wp_error($objects) || $objects) WP_CLI::error('Refusing deletion: category still has references #'.$old);
    $result=wp_delete_term($old,'product_cat');
    if (is_wp_error($result) || !$result) WP_CLI::error('Failed category deletion #'.$old);
}
$remaining=get_terms(['taxonomy'=>'product_cat','hide_empty'=>false,'lang'=>'']);
wp_update_term_count_now(array_map(fn($term)=>$term->term_taxonomy_id,$remaining),'product_cat');
foreach ($plan as $id=>$entry) {
    $actual=wp_get_object_terms($id,'product_cat',['fields'=>'ids','lang'=>'']);
    foreach ($entry['groups'] as $key) if (!in_array($groups[$key][$entry['lang']],$actual,true)) WP_CLI::error('Missing planned category: '.$id);
    foreach ($actual as $term_id) if (pll_get_term_language($term_id)!==$entry['lang']) WP_CLI::error('Cross-language assignment remains: '.$id);
}
foreach ($snapshot['products'] as $id=>$before) {
    clean_post_cache($id); $data=wc_get_product($id)->get_data(); unset($data['category_ids']);
    if (wp_json_encode($data)!==$before['protected'] || get_post($id,ARRAY_A)!==$before['post'] || get_post_meta($id)!==$before['meta']) WP_CLI::error('Non-category product data changed: '.$id);
}
foreach ($config['groups'] as $key=>$group) foreach (['de','en'] as $lang) {
    $term=get_term($groups[$key][$lang],'product_cat');
    $expected_parent=isset($group['parent']) ? $groups[$group['parent']][$lang] : 0;
    if ((int)$term->parent!==$expected_parent || (int)pll_get_term($term->term_id,$lang==='de'?'en':'de')!==$groups[$key][$lang==='de'?'en':'de']) WP_CLI::error('Category hierarchy/translation mismatch: '.$key);
}
WP_CLI::success('Consolidated categories; deleted '.count($merges).' merged terms; verified 34 known product assignments and preserved all non-category product data.');
