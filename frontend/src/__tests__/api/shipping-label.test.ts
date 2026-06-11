import { beforeEach, describe, expect, it, vi } from "vitest";

const wcApiMock = vi.fn();
const createDHLShipmentMock = vi.fn();
const createDHLReturnLabelMock = vi.fn();
const getDHLProductForPackageMock = vi.fn();

vi.mock("@/lib/woocommerce", () => ({
  wcApi: wcApiMock,
}));

vi.mock("@/lib/shipping", () => ({
  createDHLShipment: createDHLShipmentMock,
  createDHLReturnLabel: createDHLReturnLabelMock,
  getDHLProductForPackage: getDHLProductForPackageMock,
  DHL_PRODUCTS: {
    KLEINPAKET: "V62WP",
    PAKET_NATIONAL: "V01PAK",
    RETOURE_NATIONAL: "V07PAK",
  },
  SENDER_ADDRESS: {
    name1: "Kubikart",
    streetName: "Musterstrasse",
    streetNumber: "1",
    postalCode: "12345",
    city: "Berlin",
    country: "DE",
  },
}));

function makeRequest(body: object) {
  return new Request("http://localhost:3000/api/shipping/label", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  wcApiMock.mockReset();
  createDHLShipmentMock.mockReset();
  createDHLReturnLabelMock.mockReset();
  getDHLProductForPackageMock.mockReset();
});

describe("POST /api/shipping/label", () => {
  it("returns 400 when orderId is missing", async () => {
    const { POST } = await import("@/app/api/shipping/label/route");
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
    expect(wcApiMock).not.toHaveBeenCalled();
  });

  it("creates a shipment label and stores tracking data on the order", async () => {
    wcApiMock
      .mockResolvedValueOnce({
        id: 55,
        status: "processing",
        shipping: {
          first_name: "Max",
          last_name: "Mustermann",
          address_1: "Musterstrasse 12a",
          city: "Berlin",
          postcode: "10115",
          country: "DE",
        },
        line_items: [{ product_id: 9, quantity: 2 }],
        meta_data: [{ key: "_existing", value: "keep" }],
      })
      .mockResolvedValueOnce({
        weight: "0.4",
        dimensions: { length: "20", width: "10", height: "3" },
      })
      .mockResolvedValueOnce({ id: 55 });

    getDHLProductForPackageMock.mockReturnValue("KLEINPAKET");
    createDHLShipmentMock.mockResolvedValue({
      shipmentNo: "JVGL1234567890",
      labelUrl: "https://labels.example/shipment.pdf",
    });

    const { POST } = await import("@/app/api/shipping/label/route");
    const res = await POST(makeRequest({ orderId: 55 }) as never);

    expect(res.status).toBe(200);
    expect(createDHLShipmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "55",
        productCode: "V62WP",
        reference: "KB-55",
      }),
    );

    const [, updateOptions] = wcApiMock.mock.calls[2];
    expect(updateOptions).toMatchObject({
      method: "PUT",
      body: {
        meta_data: [
          { key: "_existing", value: "keep" },
          { key: "_dhl_tracking_number", value: "JVGL1234567890" },
          { key: "_dhl_label_url", value: "https://labels.example/shipment.pdf" },
          { key: "_dhl_product", value: "V62WP" },
        ],
      },
    });

    const data = await res.json();
    expect(data).toMatchObject({
      success: true,
      type: "shipment",
      shipmentNo: "JVGL1234567890",
      product: "KLEINPAKET",
    });
  });
});
