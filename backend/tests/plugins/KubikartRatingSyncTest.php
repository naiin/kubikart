<?php

use PHPUnit\Framework\TestCase;

/**
 * Tests for kubikart-rating-sync.php (mu-plugin)
 *
 * Covers:
 * - kubikart_recalculate_product_rating: zero reviews, single review, multiple reviews
 * - Correct average calculation
 * - Correct count storage
 * - Hooks are registered
 */
class KubikartRatingSyncTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        $GLOBALS['_wp_post_meta'] = [];

        // Load plugin (registers hooks)
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-rating-sync.php';
    }

    // ── Rating calculation ────────────────────────────────────────────────────

    public function test_zero_reviews_sets_zero_average_and_count(): void
    {
        $this->mockWpdbGetCol([]);
        kubikart_recalculate_product_rating(1);

        $this->assertSame(0.0, (float) get_post_meta(1, '_wc_average_rating', true));
        $this->assertSame(0, (int) get_post_meta(1, '_wc_rating_count', true));
        $this->assertSame(0, (int) get_post_meta(1, '_wc_review_count', true));
    }

    public function test_single_review_sets_correct_average(): void
    {
        $this->mockWpdbGetCol(['5']);
        kubikart_recalculate_product_rating(2);

        $this->assertSame(5.0, (float) get_post_meta(2, '_wc_average_rating', true));
        $this->assertSame(1, (int) get_post_meta(2, '_wc_rating_count', true));
    }

    public function test_multiple_reviews_calculates_correct_average(): void
    {
        $this->mockWpdbGetCol(['5', '4', '3', '5', '3']); // sum=20, count=5, avg=4.0
        kubikart_recalculate_product_rating(3);

        $this->assertSame(4.0, (float) get_post_meta(3, '_wc_average_rating', true));
        $this->assertSame(5, (int) get_post_meta(3, '_wc_rating_count', true));
    }

    public function test_average_is_rounded_to_2_decimal_places(): void
    {
        $this->mockWpdbGetCol(['5', '4', '4']); // sum=13, count=3, avg=4.333...
        kubikart_recalculate_product_rating(4);

        $avg = (float) get_post_meta(4, '_wc_average_rating', true);
        $this->assertSame(4.33, $avg);
    }

    public function test_review_count_matches_rating_count(): void
    {
        $this->mockWpdbGetCol(['5', '4', '3']);
        kubikart_recalculate_product_rating(5);

        $ratingCount = (int) get_post_meta(5, '_wc_rating_count', true);
        $reviewCount = (int) get_post_meta(5, '_wc_review_count', true);
        $this->assertSame($ratingCount, $reviewCount);
    }

    // ── Hooks registration ────────────────────────────────────────────────────

    public function test_hooks_are_registered_for_review_changes(): void
    {
        // Should hook into comment status/edit/delete/unspam actions
        $this->assertTrue(has_action('transition_comment_status'), 'transition_comment_status hook should be registered');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function mockWpdbGetCol(array $ratings): void
    {
        $wpdb = new class($ratings) {
            private array $ratings;
            public function __construct(array $r) { $this->ratings = $r; }
            public function get_col(string $query): array { return $this->ratings; }
            public function prepare(string $query, mixed ...$args): string { return $query; }
            public string $comments     = 'wp_comments';
            public string $commentmeta  = 'wp_commentmeta';
        };
        $GLOBALS['wpdb'] = $wpdb;
    }
}
