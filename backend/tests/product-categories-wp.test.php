<?php
/** wp eval-file tests/product-categories-wp.test.php
 * Native integration test. One taxonomy assignment intentionally uses the other language;
 * the normalization hook must immediately preserve the existing correct assignment.
 */
if (!defined('ABSPATH')) exit;
$check=static function($ok,$message){if(!$ok)WP_CLI::error($message);};
$aliases=get_option('kubikart_category_aliases',[]);
$check(count($aliases)===22,'Expected 22 legacy aliases.');
foreach ($aliases as $old=>$target) {
    $check(!term_exists((int)$old,'product_cat'),'Merged category still exists.');
    $check((bool)term_exists((int)$target,'product_cat'),'Alias destination missing.');
    foreach(['de','en'] as $lang) $check(pll_get_term_language(kubikart_resolve_category((int)$old,$lang))===$lang,'Alias language mismatch.');
}
$de=get_page_by_path('personalisierter-acryl-aufsteller-qr-code-nfc',OBJECT,'product');
$en=(int)pll_get_post($de->ID,'en');
$expected=wc_get_product($en)->get_category_ids(); sort($expected);
$before_post=get_post($en,ARRAY_A); $before_meta=get_post_meta($en);
$result=wp_set_object_terms($en,wc_get_product($de->ID)->get_category_ids(),'product_cat');
$check(!is_wp_error($result),'Could not exercise normalization.');
clean_post_cache($en);
$after=wc_get_product($en)->get_category_ids(); sort($after);
$check($after===$expected,'Language normalization did not retain correct English categories.');
$check(get_post($en,ARRAY_A)===$before_post && get_post_meta($en)===$before_meta,'Non-category data changed.');
$check(kubikart_resolve_category(999999,'en')===999999,'Unknown ID was broadened.');
$check((bool)term_exists((int)get_option('default_product_cat'),'product_cat'),'Default category removed.');
$previous_user=get_current_user_id();
wp_set_current_user(get_users(['role'=>'administrator','number'=>1])[0]->ID);
$old=(int)array_key_first($aliases); $target=kubikart_resolve_category($old,'en');
$request=new WP_REST_Request('GET','/wc/v3/products');
$request->set_query_params(['lang'=>'en','category'=>(string)$old,'status'=>'publish','per_page'=>100]);
$response=rest_do_request($request);
$check($response->get_status()===200 && $request->get_param('category')===[$target],'Sanitized category-array alias was not normalized: '.wp_json_encode(['status'=>$response->get_status(),'category'=>$request->get_param('category'),'expected'=>$target]));
$check(count($response->get_data())===(int)get_term($target,'product_cat')->count,'Legacy REST filter products mismatch.');
wp_set_current_user($previous_user);
WP_CLI::success('22 alias pairs resolve in both languages; native assignment hook corrects wrong-language categories; non-category data unchanged.');
