<?php
/** Plugin Name: Kubikart Product Categories
 * Preserve merged numeric shop filters and keep product categories in the product language.
 */
if (!defined('ABSPATH')) exit;

function kubikart_resolve_category(int $id, string $lang=''): int {
    $aliases=get_option('kubikart_category_aliases',[]);
    for ($i=0;$i<10 && isset($aliases[$id]);$i++) $id=(int)$aliases[$id];
    if ($lang && function_exists('pll_get_term')) $id=(int)(pll_get_term($id,$lang) ?: $id);
    return $id;
}

// Normalize before WooCommerce constructs its tax_query; leave all other query fields intact.
add_filter('rest_request_before_callbacks', function ($response,$handler,$request) {
    if ($request->get_method()!=='GET' || $request->get_route()!=='/wc/v3/products') return $response;
    $raw=$request->get_param('category');
    if (is_array($raw)) {
        $values=$raw; // WooCommerce sanitizes category CSV into an integer array before this hook.
    } elseif (is_scalar($raw) && preg_match('/^\d+(,\d+)*$/',(string)$raw)) {
        $values=explode(',',(string)$raw);
    } else return $response;
    foreach ($values as $value) if (!is_scalar($value) || !ctype_digit((string)$value)) return $response;
    $lang=is_string($request->get_param('lang')) ? $request->get_param('lang') : '';
    if ($lang==='all') $lang='';
    $ids=array_map(fn($id)=>kubikart_resolve_category((int)$id,$lang),$values);
    $request->set_param('category',array_values(array_unique($ids)));
    return $response;
},10,3);

add_filter('woocommerce_rest_prepare_product_cat', function ($response,$term) {
    $lang=function_exists('pll_get_term_language') ? (string)pll_get_term_language($term->term_id) : '';
    $legacy=[];
    foreach (get_option('kubikart_category_aliases',[]) as $old=>$target) {
        if (kubikart_resolve_category((int)$target,$lang)===(int)$term->term_id) $legacy[]=(int)$old;
    }
    if (function_exists('pll_get_term_translations')) $legacy=array_merge($legacy,array_values(pll_get_term_translations($term->term_id)));
    $data=$response->get_data();
    $data['kubikart_legacy_ids']=array_values(array_unique(array_filter(array_map('intval',$legacy),fn($id)=>$id!==(int)$term->term_id)));
    $response->set_data($data);
    return $response;
},20,2);

function kubikart_normalize_product_categories(int $id, string $assigned_lang=''): void {
    static $busy=[];
    if (isset($busy[$id]) || get_post_type($id)!=='product' || !function_exists('pll_get_post_language')) return;
    $lang=$assigned_lang ?: (string)pll_get_post_language($id);
    if (!$lang) return;
    $ids=wp_get_object_terms($id,'product_cat',['fields'=>'ids','lang'=>'']);
    if (is_wp_error($ids)) return;
    $mapped=array_values(array_unique(array_map(fn($term_id)=>kubikart_resolve_category((int)$term_id,$lang),$ids)));
    $before=array_map('intval',$ids); sort($before); $after=$mapped; sort($after);
    if ($before===$after) return;
    $busy[$id]=true;
    wp_set_object_terms($id,$mapped,'product_cat');
    unset($busy[$id]);
    clean_post_cache($id);
    if (function_exists('wc_delete_product_transients')) wc_delete_product_transients($id);
}

add_action('set_object_terms', function ($id,$terms,$tt_ids,$taxonomy) {
    if ($taxonomy==='product_cat') kubikart_normalize_product_categories((int)$id);
    if ($taxonomy==='language' && !empty($tt_ids[0])) {
        // Language assignment can follow product creation; Polylang's language cache updates later.
        $language=get_term_by('term_taxonomy_id',(int)$tt_ids[0],'language');
        if ($language) kubikart_normalize_product_categories((int)$id,(string)$language->slug);
    }
},100,4);
