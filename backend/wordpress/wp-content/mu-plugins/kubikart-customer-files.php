<?php
/**
 * Plugin Name: Kubikart Customer Files
 * Description: Private storage for customer logos/artwork uploaded through the headless frontend. Files are referenced from order line items by token and downloaded only by shop managers.
 * Version: 1.0.0
 * Author: Kubikart
 */

if (!defined('ABSPATH')) exit;

if (!defined('KUBIKART_CUSTOMER_FILE_MAX_BYTES')) {
    define('KUBIKART_CUSTOMER_FILE_MAX_BYTES', 4 * 1024 * 1024);
}
if (!defined('KUBIKART_CUSTOMER_FILE_PENDING_TTL')) {
    define('KUBIKART_CUSTOMER_FILE_PENDING_TTL', 7 * 86400);
}
const KUBIKART_CUSTOMER_FILES_ORDER_META_KEY = '_kubikart_customer_files';
const KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY = '_kubikart_enquiry_files';
const KUBIKART_CUSTOMER_FILES_CRON_HOOK = 'kubikart_customer_files_cleanup';
const KUBIKART_CUSTOMER_FILES_DOWNLOAD_ACTION = 'kubikart_download_customer_file';

/**
 * The only content types accepted, keyed by the DETECTED mime type. The stored
 * extension always comes from here, never from the client filename.
 */
function kubikart_cf_allowed_types() {
    return [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
    ];
}

function kubikart_cf_is_valid_token($token) {
    return is_string($token) && preg_match('/\A[a-f0-9]{32}\z/', $token) === 1;
}

function kubikart_cf_generate_token() {
    return bin2hex(random_bytes(16));
}

function kubikart_cf_log($message) {
    if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
        error_log('[kubikart-customer-files] ' . $message);
    }
}

/**
 * Explicitly configured private storage directory: the constant
 * KUBIKART_CUSTOMER_FILES_DIR (wp-config.php) or the environment variable of
 * the same name. It must be an absolute path outside the web root.
 */
function kubikart_cf_configured_dir() {
    if (defined('KUBIKART_CUSTOMER_FILES_DIR') && KUBIKART_CUSTOMER_FILES_DIR) {
        return rtrim((string) KUBIKART_CUSTOMER_FILES_DIR, '/\\');
    }
    $from_env = getenv('KUBIKART_CUSTOMER_FILES_DIR');
    if (is_string($from_env) && $from_env !== '') {
        return rtrim($from_env, '/\\');
    }
    return '';
}

/**
 * Storage root. Without an explicit private directory the legacy location
 * inside the uploads folder is used, which is only allowed outside production
 * (see kubikart_cf_storage_allowed()).
 */
function kubikart_cf_base_dir() {
    $configured = kubikart_cf_configured_dir();
    if ($configured !== '') {
        return $configured;
    }

    $uploads = wp_upload_dir(null, false);
    return rtrim($uploads['basedir'], '/\\') . '/kubikart-customer-files';
}

/**
 * Fail closed: in a production environment uploads are refused until a private
 * directory is configured, so files can never end up under the public uploads
 * folder by accident.
 */
function kubikart_cf_storage_allowed() {
    if (kubikart_cf_configured_dir() !== '') {
        return true;
    }
    $environment = function_exists('wp_get_environment_type') ? wp_get_environment_type() : 'local';
    return $environment !== 'production';
}

/**
 * Keep any legacy public customer-files directory unreadable for Apache even if
 * a private directory is configured now (Nginx needs the deny rule from
 * backend/deploy/nginx-customer-files.conf.example).
 */
function kubikart_cf_harden_legacy_dir() {
    if (!function_exists('wp_upload_dir')) {
        return;
    }
    $uploads = wp_upload_dir(null, false);
    $legacy = rtrim($uploads['basedir'] ?? '', '/\\') . '/kubikart-customer-files';
    if ($legacy !== '/kubikart-customer-files' && is_dir($legacy) && $legacy !== kubikart_cf_configured_dir()) {
        kubikart_cf_ensure_dir($legacy);
    }
}
add_action('init', 'kubikart_cf_harden_legacy_dir');

/**
 * Create a directory and drop the "never serve directly" guard files into it.
 */
function kubikart_cf_ensure_dir($dir) {
    if (!is_dir($dir) && !wp_mkdir_p($dir)) {
        return false;
    }

    $guards = [
        'index.php' => "<?php\n// Silence is golden.\n",
        '.htaccess' => "# Kubikart customer files: never serve directly.\n"
            . "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n"
            . "<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n",
    ];
    foreach ($guards as $name => $contents) {
        $path = $dir . '/' . $name;
        if (!file_exists($path)) {
            file_put_contents($path, $contents);
        }
    }

    return true;
}

/**
 * Create base/YYYY/MM (with guard files on every level) and return its path.
 */
function kubikart_cf_ensure_storage_dir($timestamp = null) {
    $timestamp = $timestamp ?: time();
    $base = kubikart_cf_base_dir();
    $year = $base . '/' . gmdate('Y', $timestamp);
    $month = $year . '/' . gmdate('m', $timestamp);

    foreach ([$base, $year, $month] as $dir) {
        if (!kubikart_cf_ensure_dir($dir)) {
            return false;
        }
    }

    return $month;
}

/**
 * Detect the real content type from the file bytes (never from the client).
 *
 * @return string|false One of the allowed mime types, otherwise false.
 */
function kubikart_cf_detect_mime($path) {
    if (!is_file($path) || !class_exists('finfo')) {
        return false;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($path);

    return is_string($mime) && isset(kubikart_cf_allowed_types()[$mime]) ? $mime : false;
}

/**
 * Display-only filename: sanitized and capped at 120 characters.
 */
function kubikart_cf_clean_filename($name) {
    $name = sanitize_file_name(basename(str_replace('\\', '/', (string) $name)));
    if ($name === '') {
        return 'datei';
    }
    if (strlen($name) > 120) {
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $ext = strlen($ext) <= 10 ? $ext : '';
        $base = substr(pathinfo($name, PATHINFO_FILENAME), 0, 120 - ($ext !== '' ? strlen($ext) + 1 : 0));
        $name = $ext !== '' ? $base . '.' . $ext : $base;
    }

    return $name;
}

function kubikart_cf_error($code, $message, $status) {
    return new WP_Error($code, $message, ['status' => $status]);
}

/**
 * Validate and persist one PHP upload entry ($_FILES['file'] shape).
 *
 * @return array|WP_Error Public metadata {token, filename, mime, size}.
 */
function kubikart_cf_store_upload($file, $field_id = '') {
    if (!is_array($file) || !isset($file['tmp_name'], $file['error'])) {
        return kubikart_cf_error('kubikart_file_missing', 'No file was uploaded.', 400);
    }

    $upload_error = (int) $file['error'];
    if ($upload_error === UPLOAD_ERR_NO_FILE) {
        return kubikart_cf_error('kubikart_file_missing', 'No file was uploaded.', 400);
    }
    if (in_array($upload_error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        return kubikart_cf_error('kubikart_file_too_large', 'The file is too large.', 413);
    }
    if ($upload_error !== UPLOAD_ERR_OK) {
        return kubikart_cf_error('kubikart_file_upload_error', 'The upload failed.', 400);
    }

    $tmp = (string) $file['tmp_name'];
    $size = is_file($tmp) ? filesize($tmp) : false;
    if ($size === false) {
        return kubikart_cf_error('kubikart_file_upload_error', 'The upload could not be read.', 400);
    }
    if ($size === 0) {
        return kubikart_cf_error('kubikart_file_empty', 'The file is empty.', 422);
    }
    if ($size > KUBIKART_CUSTOMER_FILE_MAX_BYTES) {
        return kubikart_cf_error('kubikart_file_too_large', 'The file is too large.', 413);
    }

    $mime = kubikart_cf_detect_mime($tmp);
    if ($mime === false) {
        return kubikart_cf_error('kubikart_file_type_not_allowed', 'Only PNG, JPEG, WebP and PDF files are allowed.', 422);
    }

    $now = time();
    $dir = kubikart_cf_ensure_storage_dir($now);
    if (!$dir) {
        return kubikart_cf_error('kubikart_file_storage_failed', 'The file could not be stored.', 500);
    }

    $token = kubikart_cf_generate_token();
    $dest = $dir . '/' . $token . '.' . kubikart_cf_allowed_types()[$mime];

    if (!kubikart_cf_move_upload($tmp, $dest)) {
        return kubikart_cf_error('kubikart_file_storage_failed', 'The file could not be stored.', 500);
    }
    @chmod($dest, 0640);

    $meta = [
        'token' => $token,
        'original_name' => kubikart_cf_clean_filename($file['name'] ?? ''),
        'mime' => $mime,
        'size' => $size,
        'created_at' => gmdate('Y-m-d H:i:s', $now),
        'created_ts' => $now,
        'status' => 'pending',
        'order_id' => 0,
        'field_id' => substr(sanitize_key((string) $field_id), 0, 64),
    ];

    $written = file_put_contents($dir . '/' . $token . '.json', wp_json_encode($meta), LOCK_EX);
    if ($written === false) {
        @unlink($dest);
        return kubikart_cf_error('kubikart_file_storage_failed', 'The file could not be stored.', 500);
    }

    return kubikart_cf_public_meta($meta);
}

/**
 * Only genuine HTTP uploads are moved; tests can short-circuit this filter.
 */
function kubikart_cf_move_upload($tmp, $dest) {
    $moved = apply_filters('kubikart_customer_files_move_upload', null, $tmp, $dest);
    if ($moved !== null) {
        return (bool) $moved;
    }

    return is_uploaded_file($tmp) && move_uploaded_file($tmp, $dest);
}

function kubikart_cf_public_meta($meta) {
    return [
        'token' => $meta['token'],
        'filename' => $meta['original_name'],
        'mime' => $meta['mime'],
        'size' => (int) $meta['size'],
    ];
}

/**
 * Resolve a token to its sidecar/file paths. The path is derived from the
 * validated token and the whitelisted extension only.
 *
 * @return array|null {meta, meta_path, path}
 */
function kubikart_cf_get($token) {
    if (!kubikart_cf_is_valid_token($token)) {
        return null;
    }

    $base = kubikart_cf_base_dir();
    foreach (kubikart_cf_list_dirs($base) as $year_dir) {
        foreach (kubikart_cf_list_dirs($year_dir) as $month_dir) {
            $meta_path = $month_dir . '/' . $token . '.json';
            if (!is_file($meta_path)) {
                continue;
            }

            $meta = json_decode((string) file_get_contents($meta_path), true);
            if (!is_array($meta) || ($meta['token'] ?? '') !== $token) {
                return null;
            }

            $ext = kubikart_cf_allowed_types()[$meta['mime'] ?? ''] ?? null;
            $path = $ext ? $month_dir . '/' . $token . '.' . $ext : '';
            if (!$ext || !is_file($path)) {
                return null;
            }

            return ['meta' => $meta, 'meta_path' => $meta_path, 'path' => $path];
        }
    }

    return null;
}

/**
 * Immediate sub-directories (numeric names only: years and months).
 */
function kubikart_cf_list_dirs($dir) {
    if (!is_dir($dir)) {
        return [];
    }

    $dirs = [];
    foreach (scandir($dir) ?: [] as $entry) {
        if (preg_match('/\A\d{2,4}\z/', $entry) && is_dir($dir . '/' . $entry)) {
            $dirs[] = $dir . '/' . $entry;
        }
    }

    return $dirs;
}

/**
 * Read-modify-write one sidecar under an exclusive lock.
 *
 * @param callable $mutator Receives the meta array and returns the new one.
 * @return array|null The stored meta, or null when the token is unknown.
 */
function kubikart_cf_update_meta($token, $mutator) {
    $record = kubikart_cf_get($token);
    if (!$record) {
        return null;
    }

    $handle = fopen($record['meta_path'], 'c+');
    if (!$handle) {
        return null;
    }

    $result = null;
    if (flock($handle, LOCK_EX)) {
        $current = json_decode((string) stream_get_contents($handle), true);
        if (is_array($current)) {
            $result = $mutator($current);
            if ($result !== $current) {
                ftruncate($handle, 0);
                rewind($handle);
                fwrite($handle, wp_json_encode($result));
                fflush($handle);
            }
        }
        flock($handle, LOCK_UN);
    }
    fclose($handle);

    return is_array($result) ? $result : null;
}

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

function kubikart_cf_rest_permission() {
    if (!is_user_logged_in()) {
        return kubikart_cf_error('kubikart_files_unauthorized', 'Authentication is required.', 401);
    }
    if (!current_user_can('manage_woocommerce')) {
        return kubikart_cf_error('kubikart_files_forbidden', 'You are not allowed to manage customer files.', 403);
    }

    return true;
}

function kubikart_cf_rest_upload($request) {
    if (!kubikart_cf_storage_allowed()) {
        error_log('[kubikart-customer-files] Upload refused: define KUBIKART_CUSTOMER_FILES_DIR (private directory outside the web root).');
        return kubikart_cf_error('kubikart_file_storage_failed', 'Customer file storage is not configured.', 500);
    }

    $files = $request->get_file_params();
    $stored = kubikart_cf_store_upload($files['file'] ?? null, (string) $request->get_param('field_id'));
    if (is_wp_error($stored)) {
        return $stored;
    }

    return new WP_REST_Response($stored, 201);
}

function kubikart_cf_rest_get($request) {
    $record = kubikart_cf_get((string) $request->get_param('token'));
    if (!$record) {
        return kubikart_cf_error('kubikart_file_not_found', 'File not found.', 404);
    }

    $meta = $record['meta'];
    return new WP_REST_Response([
        'token' => $meta['token'],
        'filename' => $meta['original_name'],
        'mime' => $meta['mime'],
        'size' => (int) $meta['size'],
        'status' => $meta['status'],
        'order_id' => (int) $meta['order_id'],
    ], 200);
}

add_action('rest_api_init', function () {
    register_rest_route('wc/v3', '/kubikart/customer-files', [
        'methods' => 'POST',
        'callback' => 'kubikart_cf_rest_upload',
        'permission_callback' => 'kubikart_cf_rest_permission',
    ]);
    register_rest_route('wc/v3', '/kubikart/customer-files/(?P<token>[a-f0-9]{32})', [
        'methods' => 'GET',
        'callback' => 'kubikart_cf_rest_get',
        'permission_callback' => 'kubikart_cf_rest_permission',
    ]);
});

// ---------------------------------------------------------------------------
// Order attachment
// ---------------------------------------------------------------------------

/**
 * Tokens referenced by a line-item meta value such as
 * "logo.png [kubikart-file:0123abcd...]".
 */
function kubikart_cf_parse_marker($value) {
    if (!is_string($value) || strpos($value, 'kubikart-file:') === false) {
        return [];
    }

    preg_match_all('/kubikart-file:([a-f0-9]{32})(?![a-f0-9])/', $value, $matches);
    return array_values(array_unique($matches[1]));
}

/**
 * Remove marker (and its optional brackets) leaving the visible filename.
 */
function kubikart_cf_strip_marker($value) {
    $stripped = preg_replace('/\s*\[?kubikart-file:[a-f0-9]{32}\]?/', '', (string) $value);
    return trim((string) $stripped);
}

function kubikart_cf_item_meta_values($item) {
    $values = [];
    if (!is_object($item) || !method_exists($item, 'get_meta_data')) {
        return $values;
    }

    foreach ($item->get_meta_data() as $meta) {
        if (is_object($meta) && method_exists($meta, 'get_data')) {
            $data = $meta->get_data();
            $value = $data['value'] ?? '';
        } else {
            $value = is_object($meta) ? ($meta->value ?? '') : ($meta['value'] ?? '');
        }
        if (is_string($value)) {
            $values[] = $value;
        }
    }

    return $values;
}

function kubikart_cf_order_item_tokens($order) {
    $tokens = [];
    foreach ($order->get_items() as $item) {
        foreach (kubikart_cf_item_meta_values($item) as $value) {
            $tokens = array_merge($tokens, kubikart_cf_parse_marker($value));
        }
    }

    return array_values(array_unique($tokens));
}

/**
 * Link referenced files to an order. Idempotent; never steals a file that
 * already belongs to a different order.
 *
 * @return string[] Tokens linked to this order.
 */
function kubikart_cf_attach_order($order) {
    static $running = false;
    if ($running || !is_object($order) || !method_exists($order, 'get_items')) {
        return [];
    }

    $order_id = (int) $order->get_id();
    if ($order_id <= 0) {
        return [];
    }

    $running = true;
    try {
        $linked = [];
        foreach (kubikart_cf_order_item_tokens($order) as $token) {
            $conflict = false;
            $updated = kubikart_cf_update_meta($token, function ($meta) use ($order_id, &$conflict) {
                if (($meta['status'] ?? '') === 'attached') {
                    $conflict = (int) ($meta['order_id'] ?? 0) !== $order_id;
                    return $meta;
                }
                $meta['status'] = 'attached';
                $meta['order_id'] = $order_id;
                $meta['attached_at'] = gmdate('Y-m-d H:i:s');
                return $meta;
            });

            if ($updated === null) {
                kubikart_cf_log(sprintf('Order %d references unknown file token.', $order_id));
            } elseif ($conflict) {
                kubikart_cf_log(sprintf('File %s already belongs to another order; ignored for order %d.', $token, $order_id));
            } else {
                $linked[] = $token;
            }
        }

        $existing = $order->get_meta(KUBIKART_CUSTOMER_FILES_ORDER_META_KEY);
        $existing = is_array($existing) ? $existing : [];
        $all = array_values(array_unique(array_merge($existing, $linked)));
        if ($all !== $existing) {
            $order->update_meta_data(KUBIKART_CUSTOMER_FILES_ORDER_META_KEY, $all);
            if (method_exists($order, 'save_meta_data')) {
                $order->save_meta_data();
            }
        }

        return $linked;
    } finally {
        $running = false;
    }
}

function kubikart_cf_resolve_order($order_or_id, $order = null) {
    if (is_object($order_or_id)) {
        return $order_or_id;
    }
    if (is_object($order)) {
        return $order;
    }

    return function_exists('wc_get_order') ? wc_get_order((int) $order_or_id) : null;
}

add_action('woocommerce_new_order', function ($order_id, $order = null) {
    $order = kubikart_cf_resolve_order($order_id, $order);
    if ($order) kubikart_cf_attach_order($order);
}, 20, 2);
add_action('woocommerce_update_order', function ($order_id, $order = null) {
    $order = kubikart_cf_resolve_order($order_id, $order);
    if ($order) kubikart_cf_attach_order($order);
}, 20, 2);
// Fires after the REST controller saved line items, so it is the reliable hook
// for orders created through the headless frontend.
add_action('woocommerce_rest_insert_shop_order_object', function ($order) {
    kubikart_cf_attach_order($order);
}, 20, 1);

// ---------------------------------------------------------------------------
// Enquiry attachment (files uploaded on an enquiry-only product page)
// ---------------------------------------------------------------------------

/** Tokens the storefront recorded for an enquiry (a JSON list in post meta). */
function kubikart_cf_enquiry_tokens($post_id) {
    $raw = get_post_meta((int) $post_id, KUBIKART_CUSTOMER_FILES_ENQUIRY_META_KEY, true);
    $tokens = is_string($raw) ? json_decode($raw, true) : [];

    return is_array($tokens) ? array_values(array_unique(array_filter($tokens, 'kubikart_cf_is_valid_token'))) : [];
}

/**
 * Keep the uploaded files of a new enquiry. Idempotent; never takes a file that already belongs to an order or to
 * another enquiry.
 *
 * @return string[] Tokens linked to this enquiry.
 */
function kubikart_cf_attach_enquiry($post_id) {
    $post_id = (int) $post_id;
    $linked = [];
    foreach (kubikart_cf_enquiry_tokens($post_id) as $token) {
        $conflict = false;
        $updated = kubikart_cf_update_meta($token, function ($meta) use ($post_id, &$conflict) {
            if (($meta['status'] ?? '') === 'attached') {
                $conflict = (int) ($meta['enquiry_id'] ?? 0) !== $post_id;
                return $meta;
            }
            $meta['status'] = 'attached';
            $meta['enquiry_id'] = $post_id;
            $meta['attached_at'] = gmdate('Y-m-d H:i:s');
            return $meta;
        });

        if ($updated === null) {
            kubikart_cf_log(sprintf('Enquiry %d references unknown file token.', $post_id));
        } elseif ($conflict) {
            kubikart_cf_log(sprintf('File %s already belongs to something else; ignored for enquiry %d.', $token, $post_id));
        } else {
            $linked[] = $token;
        }
    }

    return $linked;
}

// The storefront creates the enquiry as a private post through the REST API; its meta is saved before this fires.
add_action('rest_after_insert_post', function ($post, $request, $creating) {
    if ($creating && $post instanceof WP_Post && $post->post_status === 'private') {
        kubikart_cf_attach_enquiry($post->ID);
    }
}, 20, 3);

add_action('add_meta_boxes_post', function ($post) {
    if (!kubikart_cf_can_manage() || !kubikart_cf_enquiry_tokens($post->ID)) {
        return;
    }
    add_meta_box('kubikart_enquiry_files', 'Kubikart: Kundendateien', 'kubikart_cf_render_enquiry_metabox', 'post', 'side', 'default');
});

function kubikart_cf_render_enquiry_metabox($post) {
    if (!kubikart_cf_can_manage()) {
        return;
    }

    $items = '';
    foreach (kubikart_cf_enquiry_tokens($post->ID) as $token) {
        $record = kubikart_cf_get($token);
        if ($record && (int) ($record['meta']['enquiry_id'] ?? 0) === (int) $post->ID) {
            $items .= sprintf(
                '<li><strong>%s</strong> (%s)<br /><a href="%s">Datei herunterladen</a></li>',
                esc_html($record['meta']['original_name']),
                esc_html(size_format((int) $record['meta']['size'])),
                esc_url(kubikart_cf_download_url($token))
            );
        }
    }

    echo $items !== '' ? '<ul>' . $items . '</ul>' : '<p>Keine Kundendateien vorhanden.</p>';
}

// ---------------------------------------------------------------------------
// Admin display + download
// ---------------------------------------------------------------------------

function kubikart_cf_can_manage() {
    return (bool) current_user_can('manage_woocommerce');
}

function kubikart_cf_download_url($token) {
    return add_query_arg([
        'action' => KUBIKART_CUSTOMER_FILES_DOWNLOAD_ACTION,
        'token' => $token,
        '_wpnonce' => wp_create_nonce(KUBIKART_CUSTOMER_FILES_DOWNLOAD_ACTION . '_' . $token),
    ], admin_url('admin-post.php'));
}

// Mark the email rendering window so admin-triggered (re)sends never get links.
add_action('woocommerce_email_header', function () {
    $GLOBALS['_kubikart_cf_in_email'] = true;
}, 1);
add_action('woocommerce_email_footer', function () {
    $GLOBALS['_kubikart_cf_in_email'] = false;
}, 99);

/**
 * Admins see a download link; every other context (emails, customer pages)
 * gets the bare filename so tokens never leak.
 */
function kubikart_cf_filter_display_meta_value($display_value, $meta = null, $item = null) {
    if (!is_string($display_value) || strpos($display_value, 'kubikart-file:') === false) {
        return $display_value;
    }

    $show_link = is_admin() && kubikart_cf_can_manage() && empty($GLOBALS['_kubikart_cf_in_email']);

    $result = preg_replace_callback(
        '/\s*\[?kubikart-file:([a-f0-9]{32})\]?/',
        function ($match) use ($show_link) {
            if (!$show_link || !kubikart_cf_get($match[1])) {
                return '';
            }

            return ' <a class="kubikart-customer-file-link" href="' . esc_url(kubikart_cf_download_url($match[1])) . '">Datei herunterladen</a>';
        },
        $display_value
    );

    return trim((string) $result);
}
add_filter('woocommerce_order_item_display_meta_value', 'kubikart_cf_filter_display_meta_value', 10, 3);

function kubikart_cf_download_filename($meta) {
    $ext = kubikart_cf_allowed_types()[$meta['mime'] ?? ''] ?? 'bin';
    $stem = pathinfo(kubikart_cf_clean_filename($meta['original_name'] ?? ''), PATHINFO_FILENAME);
    $stem = preg_replace('/[^A-Za-z0-9._-]/', '_', $stem);

    return ($stem !== '' ? $stem : 'datei') . '.' . $ext;
}

/**
 * Authorise a download and compute headers. No output happens here.
 *
 * @return array|WP_Error {path, headers}
 */
function kubikart_cf_prepare_download($token, $nonce) {
    if (!kubikart_cf_can_manage()) {
        return kubikart_cf_error('kubikart_files_forbidden', 'You are not allowed to download this file.', 403);
    }
    if (!kubikart_cf_is_valid_token($token)) {
        return kubikart_cf_error('kubikart_file_not_found', 'File not found.', 404);
    }
    if (!wp_verify_nonce($nonce, KUBIKART_CUSTOMER_FILES_DOWNLOAD_ACTION . '_' . $token)) {
        return kubikart_cf_error('kubikart_files_bad_nonce', 'The link has expired. Please reload the order and try again.', 403);
    }

    $record = kubikart_cf_get($token);
    if (!$record || !in_array($record['meta']['status'] ?? '', ['pending', 'attached'], true)) {
        return kubikart_cf_error('kubikart_file_not_found', 'File not found.', 404);
    }

    $filename = kubikart_cf_download_filename($record['meta']);
    return [
        'path' => $record['path'],
        'headers' => [
            'Content-Type' => $record['meta']['mime'],
            'Content-Length' => (string) filesize($record['path']),
            'Content-Disposition' => 'attachment; filename="' . $filename . '"; filename*=UTF-8\'\'' . rawurlencode($filename),
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
            'X-Robots-Tag' => 'noindex',
        ],
    ];
}

function kubikart_cf_handle_download() {
    $token = isset($_GET['token']) ? sanitize_text_field(wp_unslash($_GET['token'])) : '';
    $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field(wp_unslash($_GET['_wpnonce'])) : '';

    $prepared = kubikart_cf_prepare_download($token, $nonce);
    if (is_wp_error($prepared)) {
        $data = $prepared->get_error_data();
        wp_die(esc_html($prepared->get_error_message()), '', ['response' => (int) ($data['status'] ?? 403)]);
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    foreach ($prepared['headers'] as $name => $value) {
        header($name . ': ' . $value);
    }
    readfile($prepared['path']);
    exit;
}
add_action('admin_post_' . KUBIKART_CUSTOMER_FILES_DOWNLOAD_ACTION, 'kubikart_cf_handle_download');

/**
 * Read-only order metabox (legacy post orders and HPOS).
 */
add_action('add_meta_boxes', function () {
    $screens = ['shop_order'];
    if (function_exists('wc_get_page_screen_id')) {
        $screens[] = wc_get_page_screen_id('shop-order');
    }

    foreach (array_unique(array_filter($screens)) as $screen) {
        add_meta_box(
            'kubikart_customer_files',
            'Kubikart: Kundendateien',
            'kubikart_cf_render_order_metabox',
            $screen,
            'side',
            'default'
        );
    }
});

function kubikart_cf_render_order_metabox($post_or_order) {
    if (!kubikart_cf_can_manage()) {
        return;
    }

    $order = $post_or_order;
    if ($post_or_order instanceof WP_Post && function_exists('wc_get_order')) {
        $order = wc_get_order($post_or_order->ID);
    }
    if (!is_object($order) || !method_exists($order, 'get_items')) {
        echo '<p>Keine Bestellung gefunden.</p>';
        return;
    }

    $stored = $order->get_meta(KUBIKART_CUSTOMER_FILES_ORDER_META_KEY);
    $tokens = array_values(array_unique(array_merge(
        is_array($stored) ? $stored : [],
        kubikart_cf_order_item_tokens($order)
    )));

    $rows = [];
    foreach ($tokens as $token) {
        $record = kubikart_cf_get($token);
        if ($record) {
            $rows[] = $record['meta'];
        }
    }

    if (!$rows) {
        echo '<p>Keine Kundendateien vorhanden.</p>';
        return;
    }

    echo '<ul>';
    foreach ($rows as $meta) {
        printf(
            '<li><strong>%s</strong> (%s)<br /><a href="%s">Datei herunterladen</a></li>',
            esc_html($meta['original_name']),
            esc_html(size_format((int) $meta['size'])),
            esc_url(kubikart_cf_download_url($meta['token']))
        );
    }
    echo '</ul>';
}

// ---------------------------------------------------------------------------
// Cleanup of abandoned uploads
// ---------------------------------------------------------------------------

/**
 * Delete pending files older than the TTL.
 *
 * @return array {scanned: int, deleted: string[]}
 */
function kubikart_cf_cleanup($dry_run = false, $now = null) {
    $now = $now ?? time();
    $cutoff = $now - KUBIKART_CUSTOMER_FILE_PENDING_TTL;
    $scanned = 0;
    $deleted = [];

    foreach (kubikart_cf_list_dirs(kubikart_cf_base_dir()) as $year_dir) {
        foreach (kubikart_cf_list_dirs($year_dir) as $month_dir) {
            foreach (scandir($month_dir) ?: [] as $entry) {
                $token = basename($entry, '.json');
                if ($entry !== $token . '.json' || !kubikart_cf_is_valid_token($token)) {
                    continue;
                }
                $meta_path = $month_dir . '/' . $entry;
                $scanned++;

                $meta = json_decode((string) file_get_contents($meta_path), true);
                if (!is_array($meta) || ($meta['status'] ?? '') !== 'pending') {
                    continue;
                }
                $created = (int) ($meta['created_ts'] ?? 0);
                if ($created <= 0 || $created > $cutoff) {
                    continue;
                }

                $deleted[] = $token;
                if ($dry_run) {
                    continue;
                }
                $ext = kubikart_cf_allowed_types()[$meta['mime'] ?? ''] ?? null;
                if ($ext) {
                    @unlink($month_dir . '/' . $token . '.' . $ext);
                }
                @unlink($meta_path);
            }
        }
    }

    return ['scanned' => $scanned, 'deleted' => $deleted];
}

add_action('init', function () {
    if (!wp_next_scheduled(KUBIKART_CUSTOMER_FILES_CRON_HOOK)) {
        wp_schedule_event(time() + 300, 'daily', KUBIKART_CUSTOMER_FILES_CRON_HOOK);
    }
});
add_action(KUBIKART_CUSTOMER_FILES_CRON_HOOK, function () {
    kubikart_cf_cleanup(false);
});

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('kubikart customer-files cleanup', function ($args, $assoc_args) {
        $dry_run = isset($assoc_args['dry-run']);
        $result = kubikart_cf_cleanup($dry_run);

        WP_CLI::success(sprintf(
            '%s %d stale pending file(s) (%d sidecar(s) scanned).',
            $dry_run ? 'Would delete' : 'Deleted',
            count($result['deleted']),
            $result['scanned']
        ));
    });
}
