export type PaymentReturnState = "loading" | "succeeded" | "processing" | "failed" | "unknown";

/**
 * Maps the PaymentIntent status Stripe reports after a redirect-based payment to
 * the state the checkout success page may show. Only `succeeded` is shown as paid.
 */
export function paymentReturnStateFromIntentStatus(status: string | undefined): PaymentReturnState {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "processing":
    case "requires_capture":
      return "processing";
    case "requires_payment_method":
    case "requires_action":
    case "requires_confirmation":
    case "canceled":
      return "failed";
    default:
      return "unknown";
  }
}

/** The cart is only emptied once the payment has been accepted or is being processed. */
export function shouldClearCartAfterPayment(state: PaymentReturnState): boolean {
  return state === "succeeded" || state === "processing";
}
