<?php
use PHPUnit\Framework\TestCase;

class KubikartMailtrapTest extends TestCase
{
    protected function setUp(): void
    {
        wp_reset_mocks();
        require_once __DIR__ . '/../../wordpress/wp-content/mu-plugins/kubikart-mailtrap.php';
    }

    public function test_unconfigured_transport_preserves_native_mail(): void
    {
        $this->assertNull(apply_filters('pre_wp_mail', null, $this->mail()));
        $this->assertTrue(apply_filters('pre_wp_mail', true, $this->mail()));
    }

    public function test_accepted_html_mail_is_routed_through_mailtrap(): void
    {
        $GLOBALS['_wp_options']['kubikart_mailtrap_transport'] = ['token' => 'private-test-token', 'from' => 'noreply@test.de', 'name' => 'Kubikart', 'owner' => 'info@test.de'];
        $GLOBALS['_wp_remote_post_response'] = ['response' => ['code' => 200], 'body' => '{"success":true,"message_ids":["test-id"]}'];
        $this->assertTrue(apply_filters('pre_wp_mail', null, $this->mail()));
        $request = $GLOBALS['_wp_remote_posts'][0];
        $this->assertSame('https://send.api.mailtrap.io/api/send', $request['url']);
        $payload = json_decode($request['args']['body'], true);
        $this->assertSame('<p>Technical test</p>', $payload['html']);
        $this->assertSame('info@test.de', $payload['to'][0]['email']);
        $this->assertSame(['test-id'], get_option('kubikart_mailtrap_last_accepted')['message_ids']);
    }

    public function test_provider_failure_never_falls_back_to_untracked_native_mail(): void
    {
        $GLOBALS['_wp_options']['kubikart_mailtrap_transport'] = ['token' => 'test', 'from' => 'noreply@test.de', 'name' => 'Kubikart'];
        $GLOBALS['_wp_remote_post_response'] = new WP_Error('network', 'Unavailable');
        $this->assertFalse(apply_filters('pre_wp_mail', null, $this->mail()));
        $this->assertFalse(get_option('kubikart_mailtrap_last_accepted'));
    }

    public function test_owner_order_notifications_use_configured_recipient(): void
    {
        $GLOBALS['_wp_options']['kubikart_mailtrap_transport'] = ['owner' => 'info@test.de'];
        foreach (['new_order', 'cancelled_order', 'failed_order'] as $type) {
            $this->assertSame('info@test.de', apply_filters('woocommerce_email_recipient_' . $type, 'old@test.de'));
        }
    }

    private function mail(): array
    {
        return ['to' => 'Audit <info@test.de>', 'subject' => 'Audit', 'message' => '<p>Technical test</p>', 'headers' => ['Content-Type: text/html; charset=UTF-8'], 'attachments' => []];
    }

    public function test_only_the_authenticated_storefront_registration_suppresses_duplicate_welcome(): void
    {
        $this->assertTrue(kubikart_mailtrap_storefront_owns_account_mail(true, true, '/wc/v3/customers', 'mailtrap'));
        $this->assertFalse(kubikart_mailtrap_storefront_owns_account_mail(false, true, '/wc/v3/customers', 'mailtrap'));
        $this->assertFalse(kubikart_mailtrap_storefront_owns_account_mail(true, false, '/wc/v3/customers', 'mailtrap'));
        $this->assertFalse(kubikart_mailtrap_storefront_owns_account_mail(true, true, '/wc/v3/orders', 'mailtrap'));
        $this->assertFalse(kubikart_mailtrap_storefront_owns_account_mail(true, true, '/wc/v3/customers', ''));
    }
}
