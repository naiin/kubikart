import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("mailtrap", () => ({
  MailtrapClient: class {
    send = send;
  },
}));

const record = {
  reference: "ANF-261015-K7QX2M",
  receivedAt: "2026-10-15T12:00:00.000Z",
  locale: "en" as const,
  kind: "product" as const,
  name: "Max Mustermann",
  email: "max@example.com",
  phone: "+49 731 123",
  company: "Salon Müller",
  message: "Bitte ein Angebot <script>alert(1)</script>",
  product: { id: 160, name: "Business-Starterpaket", slug: "starter-visibility-kit-de", url: "https://kubikart.de/en/shop/starter-visibility-kit", mode: "enquiry" },
};

beforeEach(() => {
  vi.resetModules();
  send.mockReset();
  vi.unstubAllEnvs();
  vi.stubEnv("MAILTRAP_TOKEN", "secret-provider-token");
  vi.stubEnv("MAILTRAP_TEMPLATE_OWNER_ENQUIRY", "");
  vi.stubEnv("ENQUIRY_OWNER_EMAIL", "");
});

describe("owner enquiry notification", () => {
  it("sends to the default owner address with the customer as Reply-To and every enquiry detail", async () => {
    send.mockResolvedValue({ success: true, message_ids: ["msg-1"] });
    const { sendOwnerEnquiryNotification } = await import("@/lib/email");

    const result = await sendOwnerEnquiryNotification(record);

    const mail = send.mock.calls[0][0];
    expect(result).toEqual({ messageId: "msg-1", mode: "inline" });
    expect(mail.to).toEqual([{ email: "info@kubikart.de" }]);
    expect(mail.reply_to).toEqual({ email: "max@example.com", name: "Max Mustermann" });
    expect(mail.from.email).toBe("noreply@kubikart.de");
    expect(mail.subject).toContain("ANF-261015-K7QX2M");
    for (const value of ["Business-Starterpaket (ID 160, starter-visibility-kit-de)", "https://kubikart.de/en/shop/starter-visibility-kit", "Sprache: en", "Max Mustermann", "max@example.com", "+49 731 123", "Salon Müller", "Bitte ein Angebot"]) {
      expect(mail.text).toContain(value);
    }
    // The HTML body escapes customer input.
    expect(mail.html).not.toContain("<script>");
  });

  it("uses a configured owner address and, when set, the provider template with documented variables", async () => {
    vi.stubEnv("ENQUIRY_OWNER_EMAIL", "owner@example.com");
    vi.stubEnv("MAILTRAP_TEMPLATE_OWNER_ENQUIRY", "tpl-123");
    send.mockResolvedValue({ success: true, message_ids: [] });
    const { sendOwnerEnquiryNotification } = await import("@/lib/email");

    const result = await sendOwnerEnquiryNotification(record);

    const mail = send.mock.calls[0][0];
    expect(result.mode).toBe("template");
    expect(mail.to).toEqual([{ email: "owner@example.com" }]);
    expect(mail.template_uuid).toBe("tpl-123");
    expect(Object.keys(mail.template_variables).sort()).toEqual(
      ["admin_url", "business_name", "customer_email", "customer_name", "customer_phone", "enquiry_type", "language", "message", "page_url", "product_id", "product_name", "product_slug", "received_at", "reference"],
    );
    expect(mail.template_variables.product_id).toBe("160");
    // The product is also part of the message text, so a template that prints only `message` still names it.
    expect(mail.template_variables.message).toContain("Produkt: Business-Starterpaket (ID 160");
    expect(mail.template_variables.message).toContain("Seite: https://kubikart.de/en/shop/starter-visibility-kit");
    expect(mail.template_variables.message).toContain("Bitte ein Angebot");
  });

  it("records 'accepted' (provider acceptance, not inbox delivery) with the provider message id", async () => {
    send.mockResolvedValue({ success: true, message_ids: ["msg-9"] });
    const { notifyOwner } = await import("@/lib/enquiry-notification");

    const state = await notifyOwner(record, 515, 0);

    expect(state).toMatchObject({ status: "accepted", attempts: 1, messageId: "msg-9" });
  });

  it("never throws on provider failure, counts attempts and never records the credential", async () => {
    send.mockRejectedValue(new Error("401 Unauthorized for token secret-provider-token"));
    const { notifyOwner } = await import("@/lib/enquiry-notification");

    const state = await notifyOwner(record, 515, 2);

    expect(state.status).toBe("failed");
    expect(state.attempts).toBe(3);
    expect(state.error).toContain("[redacted]");
    expect(state.error).not.toContain("secret-provider-token");
  });

  it("fails cleanly without a provider token", async () => {
    vi.stubEnv("MAILTRAP_TOKEN", "");
    const { notifyOwner } = await import("@/lib/enquiry-notification");

    const state = await notifyOwner(record, 515);

    expect(state.status).toBe("failed");
    expect(send).not.toHaveBeenCalled();
  });

  it("creates customer-quotable, distinct references", async () => {
    const { newEnquiryReference } = await import("@/lib/enquiry-notification");

    const refs = new Set(Array.from({ length: 50 }, () => newEnquiryReference(new Date("2026-10-15T10:00:00Z"))));

    expect(refs.size).toBe(50);
    for (const ref of refs) expect(ref).toMatch(/^ANF-261015-[A-Z2-9]{6}$/);
  });
});
