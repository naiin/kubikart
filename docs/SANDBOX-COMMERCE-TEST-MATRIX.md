# Kubikart sandbox commerce test matrix

Automated rows use mocks/fixtures and do not prove provider connectivity. A local Stripe sandbox payment was executed on 2026-08-04, but the provider-to-webhook portion remains untested until evidence from a publicly reachable staging deployment is attached.

| Test case | Prerequisites | Exact action | Expected WooCommerce status | Expected email | Expected logs | Result | Evidence | Remaining issue |
|---|---|---|---|---|---|---|---|---|
| Stripe successful payment | Staging, Stripe sandbox keys/webhook, pending order | Complete a sandbox card payment | `processing`, paid once | One Mailtrap processing email | Verified `payment_intent.succeeded`; no secret/body dump | Partial: provider payment succeeded; webhook not run | 2026-08-04: Woo order `388`, Stripe test PaymentIntent `pi_3U0hYsA4DWQ0hkfE0yrcTyMP`, €80.39 EUR, provider status `succeeded`; Woo remained `pending`, email marker remained `pending` | Deploy current build and register the public webhook with `STRIPE_WEBHOOK_SECRET` before completing this row |
| Stripe webhook replay | Successful Stripe row | Replay same event from Stripe CLI/dashboard | unchanged `processing` | No duplicate after `sent` marker | Accepted replay/payment no-op | Not run | — | Observe concurrency |
| Stripe invalid signature | Public staging route | POST fixture with invalid signature | unchanged | None | Signature rejection only | Not run | — | Automated mock passes |
| Stripe wrong amount | Signed controlled fixture/provider test setup | Deliver succeeded event whose amount differs from order | unchanged `pending` | None | Generic processing failure; mismatch retained server-side | Not run | — | Automated gate passes |
| Stripe wrong currency | Signed controlled fixture/provider test setup | Deliver succeeded event with different currency | unchanged `pending` | None | Generic processing failure | Not run | — | Automated gate passes |
| Stripe failed payment | Stripe sandbox failure payment method | Complete failing payment | `failed` | WooCommerce failed-order email according to its settings | Verified `payment_intent.payment_failed` | Not run | — | Confirm desired customer copy |
| Stripe customer cancellation | Pending Stripe checkout | Cancel/abandon payment | remains `pending` | None | No handled cancellation event | Not run | — | Manual expiry/cancellation policy required |
| Stripe full refund | Paid sandbox order | Refund full charge in Stripe | `refunded` | WooCommerce refund email according to its settings | Verified `charge.refunded` | Not run | — | Confirm Woo totals |
| Stripe partial refund | Paid sandbox order | Refund part of charge | unchanged automatically | None from webhook | Event accepted, no full-refund transition | Not run | — | Reconcile manually in WooCommerce |
| Stripe dispute | Sandbox dispute fixture | Trigger `charge.dispute.created` | `on-hold` | Status email if current handler sends one | Internal dispute note | Not run | — | Resolution events manual |
| PayPal successful capture | PayPal sandbox buyer/seller and webhook | Approve and capture checkout | `processing`, paid once | One Mailtrap processing email | Verified capture/webhook | Not run | — | Requires staging/provider access |
| PayPal webhook replay | Successful PayPal row | Resend same event | unchanged `processing` | No duplicate after `sent` marker | Accepted replay/payment no-op | Not run | — | Observe concurrency |
| PayPal invalid verification | Public staging route | Send invalid transmission headers | unchanged | None | Verification rejection | Not run | — | Automated missing-ID gate passes |
| PayPal wrong amount/currency | Signed controlled fixture | Deliver mismatched completed capture | unchanged `pending` | None | Payment mismatch | Not run | — | Automated shared transition gate passes |
| PayPal denied/declined | PayPal sandbox failure scenario | Trigger denied/declined capture | `failed` | WooCommerce failed-order email according to its settings | Verified denied/declined event | Not run | — | Provider scenario availability |
| PayPal customer cancellation | Approve screen | Cancel/abandon PayPal checkout | remains `pending` | None | No handled event | Not run | — | Manual expiry/cancellation policy required |
| PayPal full refund | Paid sandbox order | Refund full stored total | `refunded` | WooCommerce refund email according to its settings | Full amount/currency match | Not run | — | Confirm transaction lookup |
| PayPal partial refund | Paid sandbox order | Refund less than order total | unchanged automatically | None | Internal manual-reconciliation note | Not run | — | Allocate refund manually in WooCommerce |
| PayPal dispute | Sandbox dispute fixture | Trigger `CUSTOMER.DISPUTE.CREATED` | `on-hold` | Status email if current handler sends one | Internal dispute note | Not run | — | Resolution events manual |
| Mailtrap German | German paid staging order | Complete payment with locale `de` | `processing` | German processing template, correct customer/total | Submission success | Not run | — | Inspect inbox/rendering |
| Mailtrap English | English paid staging order | Complete payment with locale `en` | `processing` | English processing template, correct customer/total | Submission success | Not run | — | Inspect inbox/rendering |
| Mailtrap failure retry | Controlled Mailtrap failure or mocked test | Fail first send, replay verified event | stays `processing` | Second attempt sends once | `failed` then `sent` metadata | Mocked pass | `order-status-email.test.ts` | Real provider failure not run |
| Woo/Mailtrap duplication | Frontend-created staging order | Complete payment and inspect both mail systems | `processing` | Exactly one customer payment email | Woo suppression for marked order | Not run | — | Must deploy WordPress plugin change |
| Legal attachments | Configured staging Mailtrap | Send applicable order confirmation/status template | unchanged | PDFs readable | No attachment error | Files verified locally | `public/legal/agb.pdf`, `widerruf.pdf` | Inspect received email |
| Unknown order | Signed controlled fixture | Use nonexistent WooCommerce order ID | no order | None | Webhook returns retryable processing failure without secrets | Not run | — | Automated WC failure fixture recommended |

## Automated evidence currently available

- Server-authoritative order totals and payment creation fixtures.
- Duplicate WooCommerce payment transition tests.
- Amount mismatch transition test.
- Stripe invalid-signature and email-gating tests.
- Missing Stripe/PayPal webhook verification configuration tests.
- Durable paid-email success, failure, retry, and already-sent replay tests.
- DHL missing, incorrect, and correct authorization tests with mocked downstream services.
- Signed revalidation tests.
- Production Redis fail-closed test.

## Manual viewport matrix

For each width (360, 768, 1024, 1440 px), check German and English homepage, shop, product, populated cart, checkout, payment success/failure, account, and orders. Additionally test populated `/cart` at 320 px. Record screenshots, console errors, network failures, horizontal overflow, keyboard focus, and long German text. No row is considered passed without retained evidence.

Local automated-browser measurement: populated German `/de/cart` at 320 px passed with 0 px document overflow. This does not replace the remaining staging viewport matrix.
