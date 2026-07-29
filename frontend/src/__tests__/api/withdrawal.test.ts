import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendWithdrawalConfirmation } = vi.hoisted(() => ({
  sendWithdrawalConfirmation: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendWithdrawalConfirmation,
}));

function request(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/withdrawal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      name: "Max Mustermann",
      email: "max@example.com",
      contractReference: "Order 123",
      scope: "Entire order",
      locale: "en",
      _hp: "",
      _t: Date.now() - 4000,
      ...body,
    }),
  });
}

describe("POST /api/withdrawal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_WORDPRESS_URL", "https://wordpress.example");
    vi.stubEnv("WP_APP_USER", "api-user");
    vi.stubEnv("WP_APP_PASSWORD", "api-password");
    sendWithdrawalConfirmation.mockResolvedValue(true);
  });

  it("rejects incomplete identifying information", async () => {
    const { POST } = await import("@/app/api/withdrawal/route");
    const response = await POST(request({ contractReference: "" }));

    expect(response.status).toBe(400);
  });

  it("rejects spam without storing a withdrawal", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/withdrawal/route");
    const response = await POST(request({ _hp: "filled" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores the declaration before returning a dated acknowledgement", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/withdrawal/route");
    const response = await POST(request({}));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.receiptId).toEqual(expect.any(String));
    expect(new Date(result.receivedAt).toString()).not.toBe("Invalid Date");
    expect(result.contractReference).toBe("Order 123");
    expect(sendWithdrawalConfirmation).toHaveBeenCalledWith(
      "max@example.com",
      expect.objectContaining({
        contractReference: "Order 123",
        locale: "en",
      }),
    );

    const [, options] = fetchMock.mock.calls[0];
    const stored = JSON.parse(options.body);
    expect(stored.status).toBe("private");
    expect(stored.content).toContain("Order 123");
  });

  it("does not report success when durable server-side storage fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const { POST } = await import("@/app/api/withdrawal/route");
    const response = await POST(request({}));

    expect(response.status).toBe(503);
    expect(sendWithdrawalConfirmation).not.toHaveBeenCalled();
  });

  it("keeps the stored withdrawal available when email is not configured", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    sendWithdrawalConfirmation.mockResolvedValue(false);
    const { POST } = await import("@/app/api/withdrawal/route");
    const response = await POST(request({}));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.emailSent).toBe(false);
  });
});
