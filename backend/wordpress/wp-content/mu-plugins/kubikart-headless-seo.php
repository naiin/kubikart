<?php
/**
 * Plugin Name: Kubikart Headless SEO
 * Description: Keeps the backend's HTML and discovery feeds out of search without blocking REST or public product media.
 */

if (!defined('ABSPATH')) {
    exit;
}

// This WordPress installation is the content/commerce backend, not a second
// public storefront. Do not use robots Disallow: / (it also hides media and
// prevents crawlers seeing existing HTML pages' noindex directives).
add_filter('wp_sitemaps_enabled', '__return_false');

add_filter('wp_robots', function (array $robots): array {
    unset($robots['index']);
    $robots['noindex'] = true;
    $robots['follow'] = true;
    return $robots;
});

add_filter('wp_headers', function (array $headers): array {
    // wp_headers runs for theme/content responses. Static uploads are served
    // by Apache, and authenticated REST/admin integration remains unchanged.
    $headers['X-Robots-Tag'] = 'noindex, follow';
    return $headers;
});
