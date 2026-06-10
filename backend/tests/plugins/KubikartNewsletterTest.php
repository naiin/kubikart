<?php

use PHPUnit\Framework\TestCase;

/**
 * Tests for kubikart-newsletter/kubikart-newsletter.php
 *
 * Covers:
 * - Custom post type is registered on 'init'
 * - Admin column hooks are registered
 */
class KubikartNewsletterTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        require_once __DIR__ . '/../../wordpress/wp-content/plugins/kubikart-newsletter/kubikart-newsletter.php';
    }

    public function test_init_action_is_registered(): void
    {
        $this->assertTrue(has_action('init'), "'init' action should be registered for newsletter CPT');");
    }

    public function test_manage_newsletter_posts_columns_filter_is_registered(): void
    {
        $this->assertTrue(
            has_filter('manage_newsletter_sub_posts_columns'),
            'Column filter should be registered'
        );
    }

    public function test_custom_columns_include_status_and_dates(): void
    {
        $columns = apply_filters('manage_newsletter_sub_posts_columns', ['cb' => '<input>', 'title' => 'Title']);
        $this->assertArrayHasKey('nl_status', $columns, 'Status column should exist');
        $this->assertArrayHasKey('nl_subscribed', $columns, 'Subscribed date column should exist');
        $this->assertArrayHasKey('nl_confirmed', $columns, 'Confirmed date column should exist');
    }

    public function test_columns_preserve_cb_and_replace_title(): void
    {
        $columns = apply_filters('manage_newsletter_sub_posts_columns', ['cb' => '<input>', 'title' => 'Title', 'other' => 'Other']);
        $this->assertArrayHasKey('cb', $columns);
        // Title renamed to E-Mail
        $this->assertSame('E-Mail', $columns['title']);
        // Unrelated columns removed
        $this->assertArrayNotHasKey('other', $columns);
    }
}
