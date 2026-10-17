<?php
/**
 * Creates the custom business-logo window decal (German + English): a variable product with three overall widths plus the
 * request-only size "Wunschmaß anfragen", personalisation fields (with conditional fields and priced extras), an optional
 * on-site installation package, tags, categories and images.
 *
 * Usage (from the backend folder; `lando wp` or, in the container, `wp --allow-root`):
 *   wp eval-file scripts/create-business-logo-decals.php                       # dry run (default), writes nothing
 *   wp eval-file scripts/create-business-logo-decals.php apply <images-dir>    # create or convert what is needed
 *   wp eval-file scripts/create-business-logo-decals.php rollback <snapshot>   # undo what an apply did
 *
 * <images-dir> is the vinyl images folder (subfolder 02-Business-Logo with four PNG originals,
 * never modified; WebP copies are imported). KUBIKART_VINYL_IMAGES_DIR works as well.
 *
 * Products that already carry personalisation fields or
 * variations are left alone (create-only), so edits made in WordPress survive reruns. The product stays a draft
 * until you publish it. Attributes, terms, tags and media are found by slug / asset key + checksum, never by ID.
 * Take a database backup before `apply` on any environment other than local development.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/lib/catalogue-width-product.php';

kc_run_width_product(require __DIR__ . '/data/business-logo-decals.php', $args ?? [], 'create-business-logo-decals.php');
