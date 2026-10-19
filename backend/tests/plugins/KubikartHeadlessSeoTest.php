<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-headless-seo.php';

class KubikartHeadlessSeoTest extends TestCase {
    public function test_backend_html_is_noindex_without_blocking_media_crawls(): void {
        $robots = apply_filters('wp_robots', ['index' => true, 'max-image-preview' => 'large']);
        $this->assertTrue($robots['noindex']);
        $this->assertArrayNotHasKey('index', $robots);
        $this->assertSame('large', $robots['max-image-preview']);
        $headers = apply_filters('wp_headers', ['Content-Type' => 'text/html']);
        $this->assertSame('noindex, follow', $headers['X-Robots-Tag']);
        $this->assertFalse(apply_filters('wp_sitemaps_enabled', true));
        // No catch-all redirect, request authentication or robots disallow hook.
        $this->assertStringNotContainsString("wp_redirect", file_get_contents(__DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-headless-seo.php'));
    }
}
