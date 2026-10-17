import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("mailtrap", () => ({
  MailtrapClient: class {
    send = send;
  },
}));
vi.mock("@/lib/enquiry-context", () => ({
  resolveEnquiryProduct: vi.fn(async (slug: string) =>
    slug === "starter-visibility-kit-de"
      ? { id: 160, slug, name: "Business-Starterpaket", mode: "enquiry", url: "https://kubikart.de/de/shop/starter-visibility-kit-de" }
      : null,
  ),
}));

const WP = "https://wp.test";

function contactRequest() {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4", origin: "http://localhost:3000" },
    body: JSON.stringify({
      name: "Max Mustermann",
      email: "max@test.de",
      message: "Angebot bitte",
      privacy: true,
      locale: "de",
      context: { kind: "product", slug: "starter-visibility-kit-de" },
      _t: Date.now() - 6000,
      _hp: "",
    }),
  });
}

function wpFetch(storedMeta: Record<string, unknown> = {}) {
  const calls: { url: string; method: string; body?: Record<string, unknown> }[] = [];
  const mock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url: String(url), method, body });
    if (method === "POST" && String(url).endsWith("/wp/v2/posts")) return { ok: true, json: async () => ({ id: 515 }) };
    if (method === "POST") return { ok: true, json: async () => ({ id: 515 }) };
    return { ok: true, json: async () => ({ id: 515, meta: storedMeta }) };
  });
  vi.stubGlobal("fetch", mock);
  return calls;
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  send.mockReset();
  vi.stubEnv("NEXT_PUBLIC_WORDPRESS_URL", WP);
  vi.stubEnv("WP_APP_USER", "integration");
  vi.stubEnv("WP_APP_PASSWORD", "app-password");
  vi.stubEnv("MAILTRAP_TOKEN", "provider-token");
  vi.stubEnv("MAILTRAP_TEMPLATE_CONTACT", "tpl-contact");
  vi.stubEnv("ENQUIRY_RETRY_SECRET", "retry-secret");
});

describe("enquiry survives notification failure", () => {
  it("stores the enquiry once with its reference, then records a failed notification", async () => {
    const calls = wpFetch();
    send.mockRejectedValue(new Error("provider down"));
    const { POST } = await import("@/app/api/contact/route");

    const response = await POST(contactRequest() as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reference).toMatch(/^ANF-/);
    const creations = calls.filter((call) => call.method === "POST" && call.url.endsWith("/wp/v2/posts"));
    expect(creations).toHaveLength(1);
    const meta = creations[0].body!.meta as Record<string, unknown>;
    expect(meta._kubikart_notification_status).toBe("pending");
    expect(JSON.parse(String(meta._kubikart_enquiry)).product).toMatchObject({ id: 160, slug: "starter-visibility-kit-de" });
    const statusUpdate = calls.find((call) => call.url.endsWith("/wp/v2/posts/515"))!;
    expect((statusUpdate.body!.meta as Record<string, unknown>)._kubikart_notification_status).toBe("failed");
    expect((statusUpdate.body!.meta as Record<string, unknown>)._kubikart_notification_attempts).toBe(1);
  });

  it("records an accepted notification when the provider accepts the owner message", async () => {
    const calls = wpFetch();
    send.mockResolvedValue({ success: true, message_ids: ["m-1"] });
    const { POST } = await import("@/app/api/contact/route");

    await POST(contactRequest() as never);

    const statusUpdate = calls.find((call) => call.url.endsWith("/wp/v2/posts/515"))!;
    expect((statusUpdate.body!.meta as Record<string, unknown>)._kubikart_notification_status).toBe("accepted");
    // owner message + customer confirmation
    expect(send.mock.calls.some(([mail]) => mail.reply_to?.email === "max@test.de")).toBe(true);
  });
});

describe("notification retry", () => {
  const storedRecord = JSON.stringify({
    reference: "ANF-261015-K7QX2M", receivedAt: "2026-10-15T10:00:00Z", locale: "de", kind: "product", name: "Max", email: "max@test.de",
    product: { id: 160, name: "Business-Starterpaket", slug: "starter-visibility-kit-de", url: "https://kubikart.de/de/shop/starter-visibility-kit-de", mode: "enquiry" },
  });

  function signed(body: string, secret = "retry-secret", timestamp = Math.floor(Date.now() / 1000)) {
    return new Request("http://localhost:3000/api/enquiries/retry", {
      method: "POST",
      headers: {
        "x-kubikart-signature": createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("base64"),
        "x-kubikart-timestamp": String(timestamp),
      },
      body,
    });
  }

  it("rejects unsigned and wrongly signed requests", async () => {
    wpFetch();
    const { POST } = await import("@/app/api/enquiries/retry/route");

    expect((await POST(new Request("http://localhost:3000/api/enquiries/retry", { method: "POST", body: "{}" }) as never)).status).toBe(401);
    expect((await POST(signed('{"post_id":515}', "wrong") as never)).status).toBe(401);
  });

  it("rejects a replayed request outside the time window and does not accept the revalidation secret", async () => {
    wpFetch();
    vi.stubEnv("REVALIDATE_SECRET", "revalidate-secret");
    const { POST } = await import("@/app/api/enquiries/retry/route");

    expect((await POST(signed('{"post_id":515}', "retry-secret", Math.floor(Date.now() / 1000) - 600) as never)).status).toBe(401);
    expect((await POST(signed('{"post_id":515}', "revalidate-secret") as never)).status).toBe(401);
  });

  it("re-sends a failed notification and updates only its status - no new enquiry", async () => {
    const calls = wpFetch({ _kubikart_enquiry: storedRecord, _kubikart_notification_status: "failed", _kubikart_notification_attempts: 1 });
    send.mockResolvedValue({ success: true, message_ids: ["m-2"] });
    const { POST } = await import("@/app/api/enquiries/retry/route");

    const response = await POST(signed('{"post_id":515}') as never);
    const data = await response.json();

    expect(data.results[0]).toMatchObject({ postId: 515, status: "accepted", attempts: 2, stored: true });
    expect(calls.filter((call) => call.url.endsWith("/wp/v2/posts") && call.method === "POST")).toHaveLength(0);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not resend an accepted notification unless forced", async () => {
    wpFetch({ _kubikart_enquiry: storedRecord, _kubikart_notification_status: "accepted", _kubikart_notification_attempts: 1 });
    send.mockResolvedValue({ success: true, message_ids: ["m-3"] });
    const { POST } = await import("@/app/api/enquiries/retry/route");

    const skipped = await (await POST(signed('{"post_id":515}') as never)).json();
    expect(skipped.results[0].skipped).toBe(true);
    expect(send).not.toHaveBeenCalled();

    await POST(signed('{"post_id":515,"force":true}') as never);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("keeps a still-failing enquiry failed and counts the attempt", async () => {
    wpFetch({ _kubikart_enquiry: storedRecord, _kubikart_notification_status: "failed", _kubikart_notification_attempts: 1 });
    send.mockRejectedValue(new Error("still down"));
    const { POST } = await import("@/app/api/enquiries/retry/route");

    const data = await (await POST(signed('{"post_id":515}') as never)).json();

    expect(data.results[0]).toMatchObject({ status: "failed", attempts: 2 });
  });
});
