<?php
/**
 * wp --path=wordpress eval-file scripts/import-etsy-listings.php [dry-run|apply] <csv> <reviewed-images-dir>
 * Create-only bilingual DRAFT import. Never updates existing products or publishes listings.
 * Sources/row hashes retained as provenance; existing import pairs are skipped, not overwritten.
 */
if (!defined('ABSPATH')) exit;
require_once __DIR__ . '/lib/etsy-csv.php';
require_once __DIR__ . '/lib/catalogue-engine.php';

function ke_field(string $id, string $type, array $labels, string $lang, array $extra = []): array {
    return array_merge(['id'=>$id,'type'=>$type,'label'=>$labels[$lang],'required'=>true,'price'=>0], $extra);
}
function ke_fields(string $kind, string $lang): array {
    $text = fn($id,$de,$en,$extra=[]) => ke_field($id,'text',['de'=>$de,'en'=>$en],$lang,$extra);
    $select = fn($id,$de,$en,$choices,$extra=[]) => ke_field($id,'select',['de'=>$de,'en'=>$en],$lang,array_merge(['options'=>array_map(fn($key,$names)=>['value'=>$key,'label'=>$names[$lang]],array_keys($choices),$choices)],$extra));
    $font = fn() => $select('font','Schriftart nach Bildvorlage','Font from image chart',array_combine(range(1,6),array_map(fn($n)=>['de'=>"Schriftart {$n}",'en'=>"Font {$n}"],range(1,6))));
    $fields = [];
    if ($kind === 'school') $fields = [$text('child_name','Name des Kindes','Child’s name'),$text('school_year','Einschulungsjahr','School-start year',['maxLength'=>4])];
    if ($kind === 'wedding') $fields = [$text('first_name','Erster Name','First name'),$text('second_name','Zweiter Name','Second name'),$text('wedding_date','Wunschdatum (wie es graviert werden soll)','Date (exactly as it should be engraved)')];
    if ($kind === 'beaded') {
        $charms = ['unicorn'=>['de'=>'Einhorn','en'=>'Unicorn'],'heart'=>['de'=>'Herz','en'=>'Heart'],'butterfly'=>['de'=>'Schmetterling','en'=>'Butterfly'],'bow'=>['de'=>'Schleife','en'=>'Bow'],'rainbow'=>['de'=>'Regenbogen','en'=>'Rainbow'],'cat'=>['de'=>'Katze','en'=>'Cat'],'football'=>['de'=>'Fußball','en'=>'Football'],'controller'=>['de'=>'Gamecontroller','en'=>'Game Controller'],'dinosaur'=>['de'=>'Dinosaurier','en'=>'Dinosaur'],'race-car'=>['de'=>'Rennwagen','en'=>'Race Car'],'rocket'=>['de'=>'Rakete','en'=>'Rocket'],'basketball'=>['de'=>'Basketball','en'=>'Basketball']];
        $fields = [$text('name','Wunschname (bis 8 Buchstaben)','Name (up to 8 letters)',['maxLength'=>8,'helperText'=>$lang==='de'?'Buchstaben werden in Großschreibung zusammengesetzt. Sonderzeichen bitte vorher anfragen.':'Letters are assembled in uppercase. Please enquire first about special characters.']),$select('colour','Farbthema','Colour theme',['purple'=>['de'=>'Lila','en'=>'Purple'],'pink'=>['de'=>'Rosa','en'=>'Pink'],'blue'=>['de'=>'Blau','en'=>'Blue'],'apple-green'=>['de'=>'Apfelgrün','en'=>'Apple Green']]),$select('charm_1','Erster Charm','First charm',$charms),$select('charm_2','Zweiter Charm','Second charm',$charms)];
    }
    if ($kind === 'wood-name') {
        $fields = [$text('front_text','Name oder Text vorne','Front name or text',['maxLength'=>18]),$select('heart','Herzmotiv','Heart design',['without'=>['de'=>'Ohne Herz','en'=>'Without heart'],'with'=>['de'=>'Mit Herz','en'=>'With heart']]),$font(),ke_field('back_engraving','checkbox',['de'=>'Zusätzliche Rückseitengravur (+1 €)','en'=>'Additional back engraving (+€1)'],$lang,['required'=>false,'price'=>1]),$text('back_text','Wunschtext hinten','Back message',['maxLength'=>50,'showWhen'=>['field'=>'back_engraving','equals'=>'true']])];
    }
    if ($kind === 'profession') $fields = [$text('profession','Berufsbezeichnung vorne','Profession on front'),$text('back_text','Name oder Botschaft hinten','Name or message on back',['maxLength'=>50]),$font()];
    return ['schema_version'=>3,'fields'=>$fields];
}
function ke_snapshot_product(int $id): array {
    return ['post'=>get_post($id,ARRAY_A),'meta'=>get_post_meta($id),'terms'=>wp_get_object_terms($id,['product_cat','product_tag'],['fields'=>'all'])];
}

$mode = $args[0] ?? 'dry-run';
if (!in_array($mode,['dry-run','apply'],true)) WP_CLI::error('Expected dry-run or apply.');
$csv = $args[1] ?? '';
$images_dir = rtrim($args[2] ?? '', '/');
try { $rows = ke_read_csv($csv); } catch (Throwable $e) { WP_CLI::error($e->getMessage()); }
$defs = require __DIR__ . '/data/etsy-gifts.php';
if (count($rows)!==9 || count($defs)!==9) WP_CLI::error('This reviewed mapping expects exactly nine source rows.');
if (!function_exists('pll_save_post_translations') || !function_exists('PLLWC')) WP_CLI::error('Polylang for WooCommerce is required.');
if (get_woocommerce_currency()!=='EUR') WP_CLI::error('Store currency differs from source.');
$pending = [];
foreach ($defs as $index=>$def) {
    $row = $rows[$index];
    // Bind reviewed mapping to distinctive source text, not silently to CSV order alone.
    $checks = ['Thank You Mum','Personalized School Start','New Parent Gift','Alles Liebe zur Hochzeit','Engraved Rings and Date','Unser Glück beginnt mit Wir','3D Printed Letters','With or Without Heart','Profession and Custom Message'];
    if (!str_contains($row['TITLE'],$checks[$index])) WP_CLI::error('CSV order/content changed at row '.($index+1).'; review mapping first.');
    $source_key = 'etsy-image:' . hash('sha256',$row['IMAGE1']);
    $found = get_posts(['post_type'=>'product','post_status'=>'any','posts_per_page'=>-1,'fields'=>'ids','suppress_filters'=>true,'meta_key'=>'_kubikart_etsy_source_key','meta_value'=>$source_key]);
    if ($found) {
        if (count($found)!==2) WP_CLI::error('Partial previous import for '.$def['key'].'; inspect before resuming.');
        WP_CLI::line('Already imported; preserved: '.$def['key']);
        continue;
    }
    $sku = $def['sku'] ?? $row['SKU'];
    if (!$sku || str_contains($sku,',')) WP_CLI::error('Missing/ambiguous parent SKU: '.$def['key']);
    if (wc_get_product_id_by_sku($sku)) WP_CLI::error('Existing SKU matches '.$def['key'].'; refusing to overwrite.');
    foreach ($def['slugs'] as $slug) if (kc_find_product($slug)) WP_CLI::error('Existing slug matches '.$slug.'; refusing duplicate/overwrite.');
    foreach ($def['views'] as $position=>$view) {
        $file = $images_dir.'/'.sprintf('%02d-%02d.jpg',$index+1,$position+1);
        if (!is_readable($file) || !wp_getimagesize($file)) WP_CLI::error('Missing/invalid reviewed image: '.$file);
        if (!preg_match('#^https://i\.etsystatic\.com/#',$row['IMAGE'.($position+1)] ?? '')) WP_CLI::error('Unexpected image source.');
    }
    $pending[] = ['def'=>$def,'row'=>$row,'source_key'=>$source_key,'index'=>$index,'sku'=>$sku];
    WP_CLI::line(sprintf('Create DRAFT pair: %s; %d images; %s; SKU %s',$def['key'],count($def['views']),$def['kind']==='jar'?'3 owner-priced size variants':'price EUR '.$row['PRICE'],$sku));
}
if ($mode==='dry-run' || !$pending) { WP_CLI::success('Preflight complete. No writes. Pending pairs: '.count($pending)); return; }
$backup_dir = dirname(__DIR__).'/backups';
if (!wp_mkdir_p($backup_dir)) WP_CLI::error('Cannot create backup directory.');
$existing_ids = get_posts(['post_type'=>'product','post_status'=>'any','posts_per_page'=>-1,'fields'=>'ids','suppress_filters'=>true]);
$snapshot = ['source_sha256'=>hash_file('sha256',$csv),'existing'=>array_map('ke_snapshot_product',$existing_ids),'created'=>[],'media'=>[]];
$snapshot_path = $backup_dir.'/etsy-import-'.gmdate('Ymd-His').'.json';
$save_snapshot = static function() use (&$snapshot,$snapshot_path) {
    if (file_put_contents($snapshot_path,wp_json_encode($snapshot,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE))===false) WP_CLI::error('Cannot save import snapshot.');
    chmod($snapshot_path,0600);
};
$save_snapshot();
WP_CLI::line('Snapshot: '.$snapshot_path);
$jar_data = ['attributes'=>['pa_glasvariante'=>['de'=>'Glasvariante','en'=>'Jar option']]];
$jar_terms = [];
if (array_filter($pending,fn($p)=>$p['def']['kind']==='jar')) {
    kc_ensure_attributes($jar_data);
    $created_terms = [];
    $jar_terms = kc_ensure_terms('pa_glasvariante',['S'=>['de'=>'Klein – 530 ml','en'=>'Small – 530 ml'],'L'=>['de'=>'Groß – 880 ml','en'=>'Large – 880 ml'],'LID'=>['de'=>'Nur Ersatzdeckel','en'=>'Replacement lid only']],$created_terms);
    $snapshot['created_terms']=$created_terms;
    $save_snapshot();
}
foreach ($pending as $entry) {
    ['def'=>$def,'row'=>$row,'source_key'=>$source_key,'index'=>$index,'sku'=>$sku] = $entry;
    $media=[];
    foreach ($def['views'] as $position=>$view) {
        $role=sprintf('bild-%02d',$position+1);
        $asset_key='etsy/'.$def['key'].'/'.$role;
        $id=kk_find_asset($asset_key);
        $source=$images_dir.'/'.sprintf('%02d-%02d.jpg',$index+1,$position+1);
        $hash=hash_file('sha256',$source);
        if ($id && get_post_meta($id,KK_ASSET_SHA_META,true)!==$hash) WP_CLI::error('Existing imported image differs: '.$asset_key);
        if (!$id) {
            $id=kk_import_asset(['asset_key'=>$asset_key,'kit'=>['de_slug'=>$def['slugs']['de']],'asset'=>['role'=>$role,'file'=>basename($source),'sha256'=>$hash],'source_file'=>$source,'texts'=>['title'=>['de'=>$view[0],'en'=>$view[1]],'alt'=>['de'=>$view[0],'en'=>$view[1]],'caption'=>['de'=>'Produktbeispiel. Lieferumfang siehe Beschreibung; Dekoration und Befüllung nicht enthalten.','en'=>'Product example. See description for included items; props and filling are not included.']]]);
            update_post_meta($id,'_kubikart_etsy_image_url',$row['IMAGE'.($position+1)]);
            $snapshot['media'][]=$id;
            $save_snapshot();
        }
        $media[]=$id;
    }
    $review=array_merge($def['review'] ?? [],['Videos unavailable in CSV; not imported.','Packed weight/dimensions not supplied; left unset.']);
    if ($def['kind']==='jar') $review=array_merge($review,['Repeated Etsy SKUs across four designs replaced with unique website codes; source SKU list retained.','CSV quantity is listing-level only; variation stock quantities not inferred.']);
    $ids=[];
    foreach (['de','en'] as $lang) {
        $product=$def['kind']==='jar'?new WC_Product_Variable():new WC_Product_Simple();
        $product->set_name($lang==='de'?$def['de_title']:$row['TITLE']);
        $product->set_slug($def['slugs'][$lang]);
        $product->set_status('draft');
        $product->set_catalog_visibility('hidden');
        $reviewed_description=ke_reviewed_description($def['key'],$row['DESCRIPTION']);
        $product->set_description($lang==='en'?wpautop(esc_html($reviewed_description)):implode('',array_map(fn($p)=>'<p>'.esc_html($p).'</p>',$def['de_paragraphs'])));
        $product->set_short_description($lang==='de'?$def['de_short']:esc_html(explode("\n\n",$reviewed_description)[0]));
        $product->set_manage_stock($def['kind']!=='jar');
        if ($def['kind']!=='jar') { $product->set_regular_price(wc_format_decimal($row['PRICE'])); $product->set_stock_quantity((int)$row['QUANTITY']); }
        $product->set_stock_status('instock');
        // Reuse the owner-configured charge classes when importing into an environment that has them.
        $shipping_slug=$def['kind']==='jar'?'kubikart-parcel':'kubikart-small-packet';
        $shipping_term=get_term_by('slug',$shipping_slug,'product_shipping_class');
        if ($shipping_term) $product->set_shipping_class_id((int)$shipping_term->term_id);
        $product->set_image_id($media[0]);
        $product->set_gallery_image_ids(array_slice($media,1));
        $category_slugs=$lang==='de'?['personalisierte-geschenke']:['personalized-gifts'];
        if ($def['kind']==='keychain') $category_slugs[]=$lang==='de'?'schluesselanhaenger':'keychains';
        if ($def['kind']==='board') $category_slugs[]=$lang==='de'?'holzprodukte':'wood-products';
        if ($def['kind']==='jar') $category_slugs[]=$lang==='de'?'geschenkglaeser':'gift-jars';
        $product->set_category_ids(kc_term_ids($category_slugs));
        $id=(int)$product->save();
        $snapshot['created'][]=$id;
        $save_snapshot();
        pll_set_post_language($id,$lang);
        update_post_meta($id,'_kubikart_etsy_source_key',$source_key);
        update_post_meta($id,'_kubikart_etsy_source_row',$row);
        update_post_meta($id,'_kubikart_etsy_source_csv_sha256',$snapshot['source_sha256']);
        update_post_meta($id,'_kubikart_etsy_review_notes',$review);
        update_post_meta($id,'_kubikart_purchase_mode','purchase');
        update_post_meta($id,'_kubikart_custom_fields',ke_fields($def['fields'] ?? '',$lang));
        $tag_names=$lang==='en'?array_map(fn($tag)=>str_replace('_',' ',$tag),explode(',',$row['TAGS'])):array_merge([$def['kind']==='keychain'?'Schlüsselanhänger':($def['kind']==='jar'?'Geschenkglas':'Bambusbrett'),'Geschenkidee'],!empty($def['fields'])?['Personalisiert','Wunschgravur']:['Gravur']);
        $created_tags=[];
        wp_set_object_terms($id,kc_tag_ids($tag_names,$lang,$created_tags),'product_tag');
        $ids[$lang]=$id;
    }
    pll_save_post_translations($ids);
    // Set SKU only after linking translations so native WooCommerce/Polylang validates the shared code.
    $german=wc_get_product($ids['de']);
    $german->set_sku($sku);
    if ($def['kind']==='jar') {
        $attribute=new WC_Product_Attribute();
        $attribute->set_id(wc_attribute_taxonomy_id_by_name('glasvariante'));
        $attribute->set_name('pa_glasvariante');
        $attribute->set_visible(true); $attribute->set_variation(true);
        $attribute->set_options(array_map(fn($term)=>(int)get_term_by('slug',$term['de'],'pa_glasvariante')->term_id,$jar_terms));
        $german->set_attributes(['pa_glasvariante'=>$attribute]);
    }
    $german->save();
    if ($def['kind']==='jar') {
        foreach ($jar_terms as $code=>$terms) {
            $v=new WC_Product_Variation(); $v->set_parent_id($ids['de']); $v->set_status('publish');
            $v->set_attributes(['pa_glasvariante'=>$terms['de']]); $v->set_sku($sku.'-'.$code);
            $v->set_regular_price(KE_JAR_PRICES[$code]);
            $v->set_manage_stock(false); $v->set_stock_status('instock');
            $variation_id=$v->save();
            $snapshot['created'][]=$variation_id; $save_snapshot();
            update_post_meta($variation_id,'_kubikart_etsy_owner_confirmed_price',KE_JAR_PRICES[$code]);
        }
        WC_Product_Variable::sync($ids['de']);
        PLLWC()->products->copy_product_props(wc_get_product($ids['de']),wc_get_product($ids['en']),'en');
        PLLWC()->products->copy_variations($ids['de'],$ids['en'],'en');
        WC_Product_Variable::sync($ids['en']);
        foreach (wc_get_product($ids['en'])->get_children() as $variation_id) {
            $snapshot['created'][]=$variation_id;
            update_post_meta($variation_id,'_kubikart_etsy_owner_confirmed_price',wc_get_product($variation_id)->get_regular_price());
        }
    }
    $english=wc_get_product($ids['en']); $english->set_sku($sku); $english->save();
    foreach ($ids as $lang=>$id) {
        // Explicit final guard: neither native translation copying nor synchronization may publish the pair.
        $p=wc_get_product($id); $p->set_status('draft'); $p->set_catalog_visibility('hidden'); $p->save();
        wc_delete_product_transients($id);
    }
    $snapshot['pairs'][]=['key'=>$def['key'],'ids'=>$ids,'sku'=>$sku,'images'=>$media,'review'=>$review];
    $save_snapshot();
    WP_CLI::line('Imported draft pair '.$def['key'].' '.wp_json_encode($ids));
}
WP_CLI::success('Draft import complete. Review notes and created IDs: '.$snapshot_path);
