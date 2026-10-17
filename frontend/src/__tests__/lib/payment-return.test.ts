import { describe, expect, it } from "vitest";
import { paymentReturnStateFromIntentStatus, shouldClearCartAfterPayment } from "@/lib/payment-return";

describe("checkout return state", () => {
  it.each([
    ["succeeded", "succeeded"],
    ["processing", "processing"],
    ["requires_payment_method", "failed"],
    ["requires_action", "failed"],
    ["canceled", "failed"],
    [undefined, "unknown"],
    ["something_new", "unknown"],
  ])("maps PaymentIntent status %s to %s", (status, expected) => {
    expect(paymentReturnStateFromIntentStatus(status)).toBe(expected);
  });

  it("only empties the cart once the payment is accepted or processing", () => {
    expect(shouldClearCartAfterPayment("succeeded")).toBe(true);
    expect(shouldClearCartAfterPayment("processing")).toBe(true);
    expect(shouldClearCartAfterPayment("failed")).toBe(false);
    expect(shouldClearCartAfterPayment("unknown")).toBe(false);
    expect(shouldClearCartAfterPayment("loading")).toBe(false);
  });
});
