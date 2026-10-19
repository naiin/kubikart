import { beforeEach, describe, expect, it, vi } from "vitest";
const send = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true }));
vi.mock("mailtrap", () => ({ MailtrapClient: class { send = send; } }));
import { sendContactConfirmation, sendNewsletterWelcome } from "@/lib/email";

beforeEach(() => send.mockClear());
describe("customer enquiry receipts", () => {
  it.each(["de", "en"] as const)("includes the full enquiry in %s without private tokens or HTML injection", async locale => {
    await sendContactConfirmation("qa@example.com", {
      reference: "ANF-QA-FIXTURE", receivedAt: "2026-10-19T00:00:00Z", locale, kind: "product",
      name: "QA <script>", email: "qa@example.com", phone: "QA-PHONE", company: "QA Studio",
      message: 'Width: 55 cm\nHeight: 30 cm\nLogo: fixture.png\nNotes: <img src="x">\nkubikart-file:PRIVATE-TOKEN',
      product: { id: 1, name: "QA product fixture", slug: "fixture", mode: "enquiry", url: "https://kubikart.de/en/shop/fixture", sku: "QA-SKU" },
    }, locale);
    const mail = send.mock.calls[0][0];
    expect(mail.subject).toContain("ANF-QA-FIXTURE");
    for (const value of ["QA Studio", "QA-PHONE", "QA product fixture", "QA-SKU", "55 cm", "30 cm", "fixture.png"]) expect(mail.text).toContain(value);
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain('<img src="x">');
    expect(mail.html).not.toContain("PRIVATE-TOKEN");
    expect(mail.template_uuid).toBeUndefined();
    expect(mail.text).toContain(locale === "en" ? "Your request and selected options" : "Deine Anfrage und Auswahl");
  });
  it("adds unsubscribe text/link/header to the newsletter welcome", async () => {
    await sendNewsletterWelcome("qa@example.com", "en", "WILLKOMMEN-FIXTURE", "https://kubikart.de/api/newsletter/unsubscribe?id=1&token=fixture");
    const mail = send.mock.calls[0][0];
    expect(mail.text).toContain("Unsubscribe:");
    expect(mail.html).toContain("Unsubscribe</a>");
    expect(mail.headers["List-Unsubscribe"]).toContain("/api/newsletter/unsubscribe");
  });
});
