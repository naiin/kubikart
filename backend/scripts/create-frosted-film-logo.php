<?php
/**
 * Creates the custom frosted window film with business logo (German + English): a variable product with four film
 * formats (supply prices) plus the request-only size "Wunschmaß anfragen" (enquiry form), personalisation fields (with
 * conditional fields and priced extras for an extra text line and local installation), tags, categories and images.
 *
 * Usage (from the backend folder; `lando wp` or, in the container, `wp --allow-root`):
 *   wp eval-file scripts/create-frosted-film-logo.php                       # dry run (default), writes nothing
 *   wp eval-file scripts/create-frosted-film-logo.php apply <images-dir>    # create what is needed
 *   wp eval-file scripts/create-frosted-film-logo.php rollback <snapshot>   # undo what an apply did
 *
 * <images-dir> is the vinyl images folder (subfolder 03-Frosted-Film with the PNG originals, never modified; WebP copies
 * are imported). KUBIKART_VINYL_IMAGES_DIR works as well. Products that already exist are left alone (create-only).
 * The product stays a draft until you publish it. Take a database backup before `apply` outside local development.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/lib/catalogue-width-product.php';

kc_run_width_product(require __DIR__ . '/data/frosted-film-logo.php', $args ?? [], 'create-frosted-film-logo.php');
