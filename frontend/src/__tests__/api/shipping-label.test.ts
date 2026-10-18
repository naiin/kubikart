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
    headers: { "Content-Type": "application/json", Authorization: "Bearer test-label-secret" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.DHL_LABEL_SECRET = "test-label-secret";
  vi.resetModules();
  wcApiMock.mockReset();
  createDHLShipmentMock.mockReset();
  createDHLReturnLabelMock.mockReset();
  getDHLProductForPackageMock.mockReset();
});

describe("POST /api/shipping/label", () => {
  it("rejects requests without the internal label secret", async () => {
    const { POST } = await import("@/app/api/shipping/label/route");
    const request = new Request("http://localhost:3000/api/shipping/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: 55 }),
    });
    const res = await POST(request as never);
    expect(res.status).toBe(401);
    expect(wcApiMock).not.toHaveBeenCalled();
  });

  it("rejects an incorrect internal label secret", async () => {
    const { POST } = await import("@/app/api/shipping/label/route");
    const request = new Request("http://localhost:3000/api/shipping/label", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer wrong-secret" },
      body: JSON.stringify({ orderId: 55 }),
    });
    const res = await POST(request as never);
    expect(res.status).toBe(401);
    expect(wcApiMock).not.toHaveBeenCalled();
  });

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

  it("uses Paket for jar classes despite small fallback dimensions", async () => {
    wcApiMock.mockResolvedValueOnce({
      id: 56, status: "processing", shipping: { first_name: "QA", last_name: "Owner", address_1: "Teststrasse 1", city: "Ulm", postcode: "89073", country: "DE" },
      line_items: [{ product_id: 1372, quantity: 1 }], meta_data: [],
    }).mockResolvedValueOnce({ shipping_class: "kubikart-parcel", weight: "", dimensions: { length: "", width: "", height: "" } })
      .mockResolvedValueOnce({ id: 56 });
    createDHLShipmentMock.mockResolvedValue({ shipmentNo: "QA-JAR", labelUrl: "https://labels.example/qa.pdf" });
    const { POST } = await import("@/app/api/shipping/label/route");
    const res = await POST(makeRequest({ orderId: 56 }) as never);
    expect(res.status).toBe(200);
    expect(createDHLShipmentMock).toHaveBeenCalledWith(expect.objectContaining({ productCode: "V01PAK" }));
    expect(getDHLProductForPackageMock).not.toHaveBeenCalled();
  });

  it("uses chosen variation measurements when creating the label", async () => {
    wcApiMock.mockResolvedValueOnce({
      id: 57, status: "processing", shipping: { first_name: "QA", last_name: "Owner", address_1: "Teststrasse 1", city: "Ulm", postcode: "89073", country: "DE" },
      line_items: [{ product_id: 1372, variation_id: 1375, quantity: 1 }], meta_data: [],
    }).mockResolvedValueOnce({ shipping_class: "kubikart-parcel", weight: "0.5", dimensions: { length: "20", width: "15", height: "5" } })
      .mockResolvedValueOnce({ shipping_class: "kubikart-parcel", weight: "0.8", dimensions: { length: "18", width: "18", height: "22" } })
      .mockResolvedValueOnce({ id: 57 });
    createDHLShipmentMock.mockResolvedValue({ shipmentNo: "QA-VAR", labelUrl: "https://labels.example/qa.pdf" });
    const { POST } = await import("@/app/api/shipping/label/route");
    const res = await POST(makeRequest({ orderId: 57 }) as never);
    expect(res.status).toBe(200);
    expect(createDHLShipmentMock).toHaveBeenCalledWith(expect.objectContaining({ productCode: "V01PAK", package: { weight: 0.8, length: 18, width: 18, height: 22 } }));
  });
});
