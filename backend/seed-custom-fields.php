<?php
require '/app/wordpress/wp-load.php';

$fields = [
    ['id' => 'gravur', 'label' => 'Gravur', 'type' => 'text', 'required' => true, 'placeholder' => 'z.B. M & T', 'maxLength' => 20, 'helperText' => 'Pflichtfeld. Maximal 20 Zeichen.'],
    ['id' => 'zusatztext', 'label' => 'Zusatztext', 'type' => 'text', 'required' => false, 'placeholder' => 'z.B. 12.08.2024', 'maxLength' => 20, 'helperText' => 'Optional. Maximal 20 Zeichen.'],
];

update_post_meta(83, '_kubikart_custom_fields', $fields);

$check = get_post_meta(83, '_kubikart_custom_fields', true);
echo json_encode($check, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
echo "Done.\n";
