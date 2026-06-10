"use client";

import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js";

interface PayPalExpressButtonProps {
  amount: number; // product subtotal e.g. 29.99
  shippingAmount?: number; // shipping cost e.g. 5.49
  itemName: string;
  onSuccess: (details: {
    id: string;
    payer?: { email?: string; firstName?: string; lastName?: string };
    shipping?: { name?: string; address?: { line1?: string; city?: string; postalCode?: string; country?: string } };
  }) => void;
  onError: (msg: string) => void;
}

export default function PayPalExpressButton({ amount, shippingAmount = 0, itemName, onSuccess, onError }: PayPalExpressButtonProps) {
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) return null;

  const totalAmount = amount + shippingAmount;

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        currency: "EUR",
        intent: "capture",
      }}
    >
      <PayPalButtons
        fundingSource={FUNDING.PAYPAL}
        style={{
          layout: "horizontal",
          shape: "rect",
          label: "buynow",
          height: 48,
          tagline: false,
        }}
        createOrder={(_data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: "EUR",
                  value: totalAmount.toFixed(2),
                  breakdown: {
                    item_total: { currency_code: "EUR", value: amount.toFixed(2) },
                    shipping: { currency_code: "EUR", value: shippingAmount.toFixed(2) },
                  },
                },
                description: itemName.slice(0, 127),
              },
            ],
          });
        }}
        onApprove={async (_data, actions) => {
          const details = await actions.order!.capture();
          if (details.status === "COMPLETED") {
            const payer = details.payer;
            const shippingInfo = details.purchase_units?.[0]?.shipping;
            onSuccess({
              id: details.id!,
              payer: payer
                ? {
                    email: payer.email_address,
                    firstName: payer.name?.given_name,
                    lastName: payer.name?.surname,
                  }
                : undefined,
              shipping: shippingInfo
                ? {
                    name: shippingInfo.name?.full_name,
                    address: shippingInfo.address
                      ? {
                          line1: shippingInfo.address.address_line_1,
                          city: shippingInfo.address.admin_area_2,
                          postalCode: shippingInfo.address.postal_code,
                          country: shippingInfo.address.country_code,
                        }
                      : undefined,
                  }
                : undefined,
            });
          } else {
            onError("PayPal payment was not completed");
          }
        }}
        onError={(err) => {
          onError(String(err));
        }}
      />
    </PayPalScriptProvider>
  );
}
