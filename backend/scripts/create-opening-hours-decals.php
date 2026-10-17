<?php
/**
 * Creates the custom opening-hours window decal (German + English): a variable product with three overall widths,
 * personalisation fields (with conditional fields), an optional on-site installation package, tags, categories and
 * images.
 *
 * Usage (from the backend folder; `lando wp` or, in the container, `wp --allow-root`):
 *   wp eval-file scripts/create-opening-hours-decals.php                       # dry run (default), writes nothing
 *   wp eval-file scripts/create-opening-hours-decals.php apply <images-dir>    # create or convert what is needed
 *   wp eval-file scripts/create-opening-hours-decals.php rollback <snapshot>   # undo what an apply did
 *
 * <images-dir> is the "Kubikart-Vinyl-12-Listing-Images" folder (subfolder 01-Opening-Hours with four PNG originals,
 * never modified; WebP copies are imported). KUBIKART_VINYL_IMAGES_DIR works as well.
 *
 * The unpublished placeholder drafts created by configure-business-kits.php ("Öffnungszeiten-Folie" /
 * "Opening-hours vinyl decal", already linked from the industry pages) are CONVERTED into this product, so no
 * duplicate is created and the industry relations are kept. Products that already carry personalisation fields or
 * variations are left alone (create-only), so edits made in WordPress survive reruns. The product stays a draft
 * until you publish it. Attributes, terms, tags and media are found by slug / asset key + checksum, never by ID.
 * Take a database backup before `apply` on any environment other than local development.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/lib/catalogue-width-product.php';

kc_run_width_product(require __DIR__ . '/data/opening-hours-decals.php', $args ?? [], 'create-opening-hours-decals.php');
