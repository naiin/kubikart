<?php

use PHPUnit\Framework\TestCase;

class KubikartEnquiriesTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        if (!defined('KUBIKART_FRONTEND_URL')) {
            define('KUBIKART_FRONTEND_URL', 'https://frontend.test');
        }
        if (!defined('KUBIKART_ENQUIRY_RETRY_SECRET')) {
            define('KUBIKART_ENQUIRY_RETRY_SECRET', 'retry-test-secret');
        }
        if (!defined('KUBIKART_REVALIDATE_SECRET')) {
            define('KUBIKART_REVALIDATE_SECRET', 'test-secret');
        }
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-enquiries.php';
    }

    public function test_enquiry_and_notification_meta_is_registered_for_rest(): void
    {
        do_action('init');

        $meta = $GLOBALS['_wp_post_meta_registrations']['post'];
        foreach (['_kubikart_enquiry', '_kubikart_notification_status', '_kubikart_notification_attempts', '_kubikart_notification_error'] as $key) {
            $this->assertTrue($meta[$key]['show_in_rest'], $key);
        }
        $this->assertSame('integer', $meta['_kubikart_notification_attempts']['type']);
    }

    public function test_unsent_filter_selects_only_pending_and_failed_enquiries(): void
    {
        $request = new class {
            public function get_param(string $name) { return $name === 'kubikart_notification' ? 'unsent' : null; }
        };

        $args = apply_filters('rest_post_query', ['post_status' => 'private'], $request);

        $this->assertSame('_kubikart_notification_status', $args['meta_query'][0]['key']);
        $this->assertSame(['pending', 'failed'], $args['meta_query'][0]['value']);
    }

    public function test_other_requests_are_left_untouched(): void
    {
        $request = new class {
            public function get_param(string $name) { return null; }
        };

        $this->assertSame(['post_status' => 'private'], apply_filters('rest_post_query', ['post_status' => 'private'], $request));
    }

    public function test_status_labels_never_claim_inbox_delivery(): void
    {
        $this->assertSame('Vom Mail-Anbieter angenommen (1 Versuch)', kubikart_enquiry_status_label('accepted', 1));
        $this->assertSame('Fehlgeschlagen (2 Versuche)', kubikart_enquiry_status_label('failed', 2));
        $this->assertSame('Ausstehend', kubikart_enquiry_status_label('pending'));
        $this->assertStringNotContainsString('zugestellt', kubikart_enquiry_status_label('accepted'));
    }

    public function test_retry_request_is_signed_over_timestamp_and_body_with_its_own_secret(): void
    {
        $request = kubikart_enquiry_retry_request(515);

        $this->assertSame('https://frontend.test/api/enquiries/retry', $request['url']);
        $this->assertSame('{"post_id":515}', $request['args']['body']);
        $this->assertSame(
            base64_encode(hash_hmac('sha256', $request['args']['headers']['X-Kubikart-Timestamp'] . '.{"post_id":515}', KUBIKART_ENQUIRY_RETRY_SECRET, true)),
            $request['args']['headers']['X-Kubikart-Signature']
        );
        $this->assertEqualsWithDelta(time(), (int) $request['args']['headers']['X-Kubikart-Timestamp'], 5);
        $this->assertNotSame(
            base64_encode(hash_hmac('sha256', $request['args']['headers']['X-Kubikart-Timestamp'] . '.{"post_id":515}', KUBIKART_REVALIDATE_SECRET, true)),
            $request['args']['headers']['X-Kubikart-Signature'],
            'the revalidation secret must not sign retry requests'
        );
    }
}
