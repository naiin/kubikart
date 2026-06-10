/**
 * DHL Shipping Configuration & Rate Calculation
 *
 * DHL Business Customer Shipping API (Geschäftskundenversand)
 * Docs: https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2
 */

export interface ShippingPackage {
  weight: number; // kg
  length: number; // cm
  width: number; // cm
  height: number; // cm
}

export interface ShippingRate {
  id: string;
  name: string;
  price: number; // EUR
  estimatedDays: string;
  carrier: string;
  dhlProduct: string; // DHL product code
}

// DHL product codes
export const DHL_PRODUCTS = {
  PAKET_NATIONAL: "V01PAK", // DHL Paket (up to 31.5kg)
  KLEINPAKET: "V62WP", // Warenpost (small items up to 1kg)
  RETOURE_NATIONAL: "V07PAK", // DHL Retoure
  WARENPOST_INTERNATIONAL: "V66WPI", // Warenpost International
} as const;

// DHL package constraints
export const DHL_CONSTRAINTS = {
  KLEINPAKET: {
    maxWeight: 1, // kg
    maxLength: 35.3, // cm
    maxWidth: 25, // cm
    maxHeight: 8, // cm
    maxLiability: 20, // EUR
  },
  PAKET_NATIONAL: {
    maxWeight: 31.5, // kg
    maxLength: 120, // cm
    maxWidth: 60, // cm
    maxHeight: 60, // cm
    maxLiability: 500, // EUR
  },
} as const;

// Business account shipping prices (configure these with your actual negotiated rates)
const SHIPPING_PRICES = {
  KLEINPAKET: parseFloat(process.env.DHL_PRICE_KLEINPAKET || "3.99"),
  PAKET_NATIONAL: parseFloat(process.env.DHL_PRICE_PAKET || "5.49"),
  FREE_SHIPPING_THRESHOLD: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "50"),
};

/**
 * Determines which DHL product fits the given package
 */
export function getDHLProductForPackage(pkg: ShippingPackage): "KLEINPAKET" | "PAKET_NATIONAL" | null {
  // Check if it fits Kleinpaket
  if (
    pkg.weight <= DHL_CONSTRAINTS.KLEINPAKET.maxWeight &&
    pkg.length <= DHL_CONSTRAINTS.KLEINPAKET.maxLength &&
    pkg.width <= DHL_CONSTRAINTS.KLEINPAKET.maxWidth &&
    pkg.height <= DHL_CONSTRAINTS.KLEINPAKET.maxHeight
  ) {
    return "KLEINPAKET";
  }

  // Check if it fits Paket National
  if (
    pkg.weight <= DHL_CONSTRAINTS.PAKET_NATIONAL.maxWeight &&
    pkg.length <= DHL_CONSTRAINTS.PAKET_NATIONAL.maxLength &&
    pkg.width <= DHL_CONSTRAINTS.PAKET_NATIONAL.maxWidth &&
    pkg.height <= DHL_CONSTRAINTS.PAKET_NATIONAL.maxHeight
  ) {
    return "PAKET_NATIONAL";
  }

  return null; // Too large for standard DHL
}

/**
 * Calculate shipping rates for a given package and destination
 */
export function calculateShippingRates(pkg: ShippingPackage, subtotal: number, countryCode: string = "DE"): ShippingRate[] {
  const rates: ShippingRate[] = [];

  if (countryCode !== "DE") {
    // International shipping via Warenpost International
    rates.push({
      id: "dhl_international",
      name: "DHL Warenpost International",
      price: parseFloat(process.env.DHL_PRICE_INTERNATIONAL || "8.99"),
      estimatedDays: "5–10",
      carrier: "DHL",
      dhlProduct: DHL_PRODUCTS.WARENPOST_INTERNATIONAL,
    });
    return rates;
  }

  const productType = getDHLProductForPackage(pkg);

  if (productType === "KLEINPAKET") {
    const price = subtotal >= SHIPPING_PRICES.FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICES.KLEINPAKET;
    rates.push({
      id: "dhl_kleinpaket",
      name: "DHL Kleinpaket",
      price,
      estimatedDays: "3–5",
      carrier: "DHL",
      dhlProduct: DHL_PRODUCTS.KLEINPAKET,
    });
  } else if (productType === "PAKET_NATIONAL") {
    const price = subtotal >= SHIPPING_PRICES.FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICES.PAKET_NATIONAL;
    rates.push({
      id: "dhl_paket",
      name: "DHL Paket",
      price,
      estimatedDays: "3–5",
      carrier: "DHL",
      dhlProduct: DHL_PRODUCTS.PAKET_NATIONAL,
    });
  }

  // If no product matches (shouldn't happen often), fallback to Paket
  if (rates.length === 0) {
    const price = subtotal >= SHIPPING_PRICES.FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICES.PAKET_NATIONAL;
    rates.push({
      id: "dhl_paket",
      name: "DHL Paket",
      price,
      estimatedDays: "3–5",
      carrier: "DHL",
      dhlProduct: DHL_PRODUCTS.PAKET_NATIONAL,
    });
  }

  return rates;
}

/**
 * DHL Business API client for label creation
 */
export interface DHLShipmentRequest {
  orderId: string;
  senderAddress: DHLAddress;
  recipientAddress: DHLAddress;
  package: ShippingPackage;
  productCode: string;
  reference?: string;
}

export interface DHLAddress {
  name1: string;
  streetName: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  country: string; // ISO2
}

export interface DHLLabelResponse {
  shipmentNo: string;
  labelUrl: string;
  returnLabelUrl?: string;
}

const DHL_API_BASE = process.env.DHL_API_URL || "https://api-eu.dhl.com/parcel/de/shipping/v2";
const DHL_API_KEY = process.env.DHL_API_KEY || "";
const DHL_USERNAME = process.env.DHL_USERNAME || ""; // GKP user
const DHL_PASSWORD = process.env.DHL_PASSWORD || ""; // GKP password

// Billing numbers per product (EKP + product code + participation)
const DHL_BILLING_NUMBERS = {
  PAKET: process.env.DHL_BILLING_NUMBER_PAKET || "",
  KLEINPAKET: process.env.DHL_BILLING_NUMBER_KLEINPAKET || "",
  INTERNATIONAL: process.env.DHL_BILLING_NUMBER_INTERNATIONAL || "",
  RETURN: process.env.DHL_BILLING_NUMBER_RETURN || "",
};

function getBillingNumber(productCode: string): string {
  switch (productCode) {
    case DHL_PRODUCTS.KLEINPAKET:
      return DHL_BILLING_NUMBERS.KLEINPAKET;
    case DHL_PRODUCTS.WARENPOST_INTERNATIONAL:
      return DHL_BILLING_NUMBERS.INTERNATIONAL;
    case DHL_PRODUCTS.RETOURE_NATIONAL:
      return DHL_BILLING_NUMBERS.RETURN;
    default:
      return DHL_BILLING_NUMBERS.PAKET;
  }
}

// Default sender (your business address)
export const SENDER_ADDRESS: DHLAddress = {
  name1: process.env.DHL_SENDER_NAME || "Kubikart",
  streetName: process.env.DHL_SENDER_STREET || "",
  streetNumber: process.env.DHL_SENDER_STREET_NUMBER || "",
  postalCode: process.env.DHL_SENDER_POSTAL_CODE || "",
  city: process.env.DHL_SENDER_CITY || "",
  country: "DE",
};

/**
 * Create a DHL shipment and get a label
 */
export async function createDHLShipment(request: DHLShipmentRequest): Promise<DHLLabelResponse> {
  const billingNumber = getBillingNumber(request.productCode);
  if (!DHL_API_KEY || !DHL_USERNAME || !DHL_PASSWORD || !billingNumber) {
    throw new Error("DHL API credentials not configured. Set DHL_API_KEY, DHL_USERNAME, DHL_PASSWORD, and DHL_BILLING_NUMBER_* in .env.local");
  }

  const basicAuth = Buffer.from(`${DHL_USERNAME}:${DHL_PASSWORD}`).toString("base64");

  const shipmentPayload = {
    profile: "STANDARD_GRUPPENPROFIL",
    shipments: [
      {
        product: request.productCode,
        billingNumber: billingNumber,
        refNo: request.reference || request.orderId,
        shipper: {
          name1: request.senderAddress.name1,
          addressStreet: request.senderAddress.streetName,
          addressHouse: request.senderAddress.streetNumber,
          postalCode: request.senderAddress.postalCode,
          city: request.senderAddress.city,
          country: request.senderAddress.country,
        },
        consignee: {
          name1: request.recipientAddress.name1,
          addressStreet: request.recipientAddress.streetName,
          addressHouse: request.recipientAddress.streetNumber,
          postalCode: request.recipientAddress.postalCode,
          city: request.recipientAddress.city,
          country: request.recipientAddress.country,
        },
        details: {
          dim: {
            uom: "cm",
            length: Math.ceil(request.package.length),
            width: Math.ceil(request.package.width),
            height: Math.ceil(request.package.height),
          },
          weight: {
            uom: "kg",
            value: request.package.weight,
          },
        },
      },
    ],
  };

  const response = await fetch(`${DHL_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "dhl-api-key": DHL_API_KEY,
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
    },
    body: JSON.stringify(shipmentPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const shipment = result.items?.[0];

  if (!shipment || shipment.sstatus?.statusCode !== 200) {
    throw new Error(`DHL shipment creation failed: ${JSON.stringify(shipment?.validationMessages || shipment)}`);
  }

  return {
    shipmentNo: shipment.shipmentNo,
    labelUrl: shipment.label?.url || shipment.label?.b64 || "",
    returnLabelUrl: shipment.returnLabel?.url,
  };
}

/**
 * Create a DHL return label
 */
export async function createDHLReturnLabel(request: {
  orderId: string;
  receiverAddress: DHLAddress; // your business address (where the return goes)
  senderAddress: DHLAddress; // the customer returning the item
  package: ShippingPackage;
}): Promise<DHLLabelResponse> {
  const returnBillingNumber = DHL_BILLING_NUMBERS.RETURN;
  if (!DHL_API_KEY || !DHL_USERNAME || !DHL_PASSWORD || !returnBillingNumber) {
    throw new Error("DHL API credentials not configured");
  }

  const basicAuth = Buffer.from(`${DHL_USERNAME}:${DHL_PASSWORD}`).toString("base64");

  const payload = {
    profile: "STANDARD_GRUPPENPROFIL",
    shipments: [
      {
        product: DHL_PRODUCTS.RETOURE_NATIONAL,
        billingNumber: returnBillingNumber,
        refNo: `RET-${request.orderId}`,
        shipper: {
          name1: request.senderAddress.name1,
          addressStreet: request.senderAddress.streetName,
          addressHouse: request.senderAddress.streetNumber,
          postalCode: request.senderAddress.postalCode,
          city: request.senderAddress.city,
          country: request.senderAddress.country,
        },
        consignee: {
          name1: request.receiverAddress.name1,
          addressStreet: request.receiverAddress.streetName,
          addressHouse: request.receiverAddress.streetNumber,
          postalCode: request.receiverAddress.postalCode,
          city: request.receiverAddress.city,
          country: request.receiverAddress.country,
        },
        details: {
          weight: {
            uom: "kg",
            value: request.package.weight,
          },
        },
      },
    ],
  };

  const response = await fetch(`${DHL_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "dhl-api-key": DHL_API_KEY,
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL Return API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const shipment = result.items?.[0];

  if (!shipment || shipment.sstatus?.statusCode !== 200) {
    throw new Error(`DHL return label creation failed: ${JSON.stringify(shipment?.validationMessages || shipment)}`);
  }

  return {
    shipmentNo: shipment.shipmentNo,
    labelUrl: shipment.label?.url || shipment.label?.b64 || "",
  };
}
