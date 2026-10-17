<?php
/**
 * Creates the custom laminated menus and price lists (German + English): a variable product with the attributes format,
 * quantity, printed sides and design (18 priced pack combinations plus request-only variations for a custom format, a larger
 * quantity and the layout service, which show the quotation form instead of add-to-cart), a few personalisation fields, tags,
 * categories and images. The existing placeholder drafts (speisekarten-menuedruck / printed-menus) are converted so the links
 * from the industry pages stay.
 *
 * Usage (from the backend folder; `lando wp` or, in the container, `wp --allow-root`):
 *   wp eval-file scripts/create-laminated-menus.php                       # dry run (default), writes nothing
 *   wp eval-file scripts/create-laminated-menus.php apply <images-dir>    # create or convert what is needed
 *   wp eval-file scripts/create-laminated-menus.php rollback <snapshot>   # undo what an apply did
 *
 * <images-dir> is the folder with the seven PNG originals (never modified; WebP copies are imported). Products that already
 * carry personalisation fields or variations are left alone (create-only). The product stays a draft until you publish it.
 * Take a database backup before `apply` outside local development.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/lib/catalogue-width-product.php';

kc_run_width_product(require __DIR__ . '/data/laminated-menus.php', $args ?? [], 'create-laminated-menus.php');
