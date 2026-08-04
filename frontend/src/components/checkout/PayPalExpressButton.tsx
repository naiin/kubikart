"use client";

import { useRef } from "react";
import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js";

interface PayPalExpressButtonProps {
  pendingOrderRequest: Record<string, unknown>;
  onSuccess: (details: {
    id: string;
    payer?: { email?: string; firstName?: string; lastName?: string };
    shipping?: { name?: string; address?: { line1?: string; city?: string; postalCode?: string; country?: string } };
  }) => void;
  onError: (msg: string) => void;
}

export default function PayPalExpressButton({ pendingOrderRequest, onSuccess, onError }: PayPalExpressButtonProps) {
  const pendingOrder = useRef<{ id: number; orderKey: string } | null>(null);
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) return null;
  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, currency: "EUR", intent: "capture" }}>
      <PayPalButtons
        fundingSource={FUNDING.PAYPAL}
        style={{ layout: "horizontal", shape: "rect", label: "buynow", height: 48, tagline: false }}
        createOrder={async () => {
          if (!pendingOrder.current) {
            const orderResponse = await fetch("/api/orders/create", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pendingOrderRequest),
            });
            const order = await orderResponse.json();
            if (!orderResponse.ok || !order.id || !order.orderKey) throw new Error(order.error || "Failed to create pending order");
            pendingOrder.current = { id: order.id, orderKey: order.orderKey };
          }
          const response = await fetch("/api/paypal/create-order", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pendingOrder.current),
          });
          const order = await response.json();
          if (!response.ok || !order.id) throw new Error(order.error || "Failed to create PayPal order");
          return order.id;
        }}
        onApprove={async (data) => {
          const response = await fetch("/api/paypal/capture-order", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderID: data.orderID }),
          });
          const details = await response.json();
          if (!response.ok || details.status !== "COMPLETED") return onError(details.error || "PayPal payment was not completed");
          onSuccess({ id: details.id, payer: details.payer ? { email: details.payer.email_address, firstName: details.payer.name?.given_name, lastName: details.payer.name?.surname } : undefined });
        }}
        onError={(error) => onError(String(error))}
      />
    </PayPalScriptProvider>
  );
}
