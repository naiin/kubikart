import { describe, it, expect, vi, beforeEach } from "vitest";

const SITE_ORIGIN = "http://localhost:3000";

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "1.2.3.4",
      origin: SITE_ORIGIN,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Max Mustermann",
  email: "max@test.de",
  message: "Ich hätte gerne ein Angebot.",
  _t: Date.now() - 6000, // 6 seconds ago — passes timing check
  _hp: "", // empty honeypot
};

// The enquiry is created with POST /wp/v2/posts; later calls only record the notification status.
function storedCall(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.find((call) => String(call[0]).endsWith("/wp/v2/posts"))!;
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/contact", () => {
  it("returns fake success for honeypot-filled request (bot)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ ...validBody, _hp: "bot@spam.com" }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // WP should NOT have been called
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns fake success for too-fast submission (bot)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ ...validBody, _t: Date.now() - 100 }) as never);
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns fake success for invalid origin", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest(validBody, { origin: "https://evil-bot.com" }) as never);
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for missing required fields", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ email: "max@test.de", _t: Date.now() - 6000, _hp: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest({ ...validBody, email: "not-an-email" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful WP post creation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) })
    );
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns an error if the inquiry cannot be stored", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, text: async () => "Server Error" })
    );
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(503);
  });
  it("validates a product enquiry server-side and stores the product id, name, URL and language", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.doMock("@/lib/enquiry-context", () => ({
      resolveEnquiryProduct: vi.fn(async (slug: string) =>
        slug === "starter-visibility-kit-de"
          ? { id: 160, slug, name: "Business-Starterpaket", mode: "enquiry", url: "https://kubikart.de/de/shop/starter-visibility-kit-de" }
          : null,
      ),
    }));
    const { POST } = await import("@/app/api/contact/route");

    const res = await POST(
      makeRequest({
        ...validBody,
        message: "",
        company: "Salon Müller",
        privacy: true,
        locale: "de",
        // The browser-supplied name must be ignored: identity comes from WooCommerce.
        context: { kind: "product", slug: "starter-visibility-kit-de", name: "Fälschung" },
      }) as never,
    );

    expect(res.status).toBe(200);
    const stored = JSON.parse(storedCall(fetchMock)[1].body as string);
    expect(stored.content).toContain("Produkt/Paket: Business-Starterpaket (ID 160, starter-visibility-kit-de)");
    expect(stored.content).toContain("Seite: https://kubikart.de/de/shop/starter-visibility-kit-de");
    expect(stored.content).toContain("Sprache: de");
    expect(stored.content).toContain("Bestellart: Nur auf Anfrage");
    expect(stored.content).toContain("Unternehmen: Salon Müller");
    expect(stored.content).not.toContain("Fälschung");
  });

  describe("custom size request on a product page", () => {
    function setup() {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 43 }) });
      vi.stubGlobal("fetch", fetchMock);
      vi.doMock("@/lib/enquiry-context", () => ({
        resolveEnquiryProduct: vi.fn(async (slug: string) => ({ id: 539, slug, name: "Öffnungszeiten-Aufkleber", mode: "purchase", url: `https://kubikart.de/de/shop/${slug}` })),
      }));
      return fetchMock;
    }
    const body = (details: unknown) => ({ ...validBody, message: "", privacy: true, locale: "de", context: { kind: "product", slug: "oeffnungszeiten-aufkleber" }, details });

    it("stores the preferred width and maximum height with the enquiry", async () => {
      const fetchMock = setup();
      const { POST } = await import("@/app/api/contact/route");

      const res = await POST(makeRequest(body({ customSize: { width: "55", height: 30 } })) as never);

      expect(res.status).toBe(200);
      const stored = JSON.parse(storedCall(fetchMock)[1].body as string);
      expect(stored.content).toContain("Wunschmaß-Anfrage: gewünschte Gesamtbreite 55 cm, maximal verfügbare Höhe 30 cm");
      expect(JSON.parse(stored.meta._kubikart_enquiry).message).toContain("gewünschte Gesamtbreite 55 cm");
    });

    it.each([
      [{ width: "", height: "30" }],
      [{ width: "abc", height: "30" }],
      [{ width: "0", height: "30" }],
      [{ width: "600", height: "30" }],
    ])("rejects missing, non-numeric or implausible measures %j", async (customSize) => {
      setup();
      const { POST } = await import("@/app/api/contact/route");

      expect((await POST(makeRequest(body({ customSize })) as never)).status).toBe(400);
    });
  });

  describe("configured enquiry on an enquiry-only product page", () => {
    const token = "a".repeat(32);

    function setup(getCustomerFile = vi.fn(async (t: string) => ({ token: t, filename: "logo.png", mime: "image/png", size: 10, status: "pending" }))) {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 44 }) });
      vi.stubGlobal("fetch", fetchMock);
      vi.doMock("@/lib/enquiry-context", () => ({
        resolveEnquiryProduct: vi.fn(async (slug: string) => ({ id: 1215, slug, name: "Milchglasfolie", mode: "enquiry", url: `https://kubikart.de/de/shop/${slug}` })),
      }));
      vi.doMock("@/lib/customer-files", async () => ({
        ...(await vi.importActual<object>("@/lib/customer-files")),
        getCustomerFile,
      }));
      return fetchMock;
    }
    const body = (configuration: unknown, extra: object = {}) => ({
      ...validBody,
      message: "",
      privacy: true,
      locale: "de",
      context: { kind: "product", slug: "milchglasfolie-mit-logo" },
      details: { configuration },
      ...extra,
    });

    it("stores the choices in the message and keeps the uploaded files with the enquiry", async () => {
      const fetchMock = setup();
      const { POST } = await import("@/app/api/contact/route");

      const res = await POST(makeRequest(body({ lines: ["Folienformat: 80 × 30 cm", "Dein Logo: logo.png", "<b>Position</b>: Mittig"], fileTokens: [token] })) as never);

      expect(res.status).toBe(200);
      const stored = JSON.parse(storedCall(fetchMock)[1].body as string);
      expect(stored.content).toContain("Auswahl:");
      expect(stored.content).toContain("- Folienformat: 80 × 30 cm");
      expect(stored.content).toContain("- Position: Mittig");
      expect(stored.content).not.toContain("<b>");
      expect(stored.meta._kubikart_enquiry_files).toBe(JSON.stringify([token]));
      expect(JSON.parse(stored.meta._kubikart_enquiry).message).toContain("- Dein Logo: logo.png");
    });

    it("does not record files when none were uploaded", async () => {
      const fetchMock = setup();
      const { POST } = await import("@/app/api/contact/route");

      await POST(makeRequest(body({ lines: ["Folienformat: 60 × 20 cm"], fileTokens: [] })) as never);

      expect(JSON.parse(storedCall(fetchMock)[1].body as string).meta._kubikart_enquiry_files).toBeUndefined();
    });

    const notFound = async () => {
      const { CustomerFileError } = await import("@/lib/customer-files");
      throw new CustomerFileError("not_found", 404);
    };
    const attached = async (t: string) => ({ token: t, filename: "x.png", mime: "image/png", size: 1, status: "attached" });
    const cases: Array<[string, { lines: string[]; fileTokens: string[] }, ((t: string) => Promise<unknown>) | undefined]> = [
      ["a malformed token", { lines: [], fileTokens: ["../../etc/passwd"] }, undefined],
      ["an unknown token", { lines: [], fileTokens: [token] }, notFound],
      ["a file that already belongs to an order", { lines: [], fileTokens: [token] }, attached],
      ["too many files", { lines: [], fileTokens: ["1", "2", "3", "4", "5", "6"].map((c) => c.repeat(32)) }, undefined],
    ];

    it.each(cases)("rejects %s", async (_name, configuration, getCustomerFile) => {
      const fetchMock = setup(getCustomerFile ? (vi.fn(getCustomerFile) as never) : undefined);
      const { POST } = await import("@/app/api/contact/route");

      const res = await POST(makeRequest(body(configuration)) as never);

      expect(res.status).toBe(400);
      expect(fetchMock.mock.calls.some((call) => String(call[0]).endsWith("/wp/v2/posts"))).toBe(false);
    });

    it("words a custom-format request in terms of the finished width and height and keeps the selection", async () => {
      const fetchMock = setup();
      const { POST } = await import("@/app/api/contact/route");

      const res = await POST(
        makeRequest({
          ...body(undefined),
          details: {
            customSize: { kind: "format", width: "15", height: 25 },
            configuration: { lines: ["Format: Wunschformat anfragen"], fileTokens: [] },
          },
        }) as never,
      );

      expect(res.status).toBe(200);
      const content = JSON.parse(storedCall(fetchMock)[1].body as string).content;
      expect(content).toContain("Wunschformat-Anfrage: gewünschte fertige Breite 15 cm, gewünschte fertige Höhe 25 cm");
      expect(content).toContain("- Format: Wunschformat anfragen");
    });

    it("keeps the files uploaded before switching to a custom size with a custom-size enquiry", async () => {
      const fetchMock = setup();
      const { POST } = await import("@/app/api/contact/route");

      const res = await POST(
        makeRequest({
          ...body(undefined),
          details: {
            customSize: { kind: "overall", width: "55", height: 30 },
            configuration: { lines: ["Gesamtbreite: Wunschmaß anfragen", "Dein Logo: logo.png"], fileTokens: [token] },
          },
        }) as never,
      );

      expect(res.status).toBe(200);
      const stored = JSON.parse(storedCall(fetchMock)[1].body as string);
      expect(stored.content).toContain("gewünschte Gesamtbreite 55 cm");
      expect(stored.content).toContain("- Dein Logo: logo.png");
      expect(stored.meta._kubikart_enquiry_files).toBe(JSON.stringify([token]));
    });

    it("stores a plain quotation request with the chosen options and no measures", async () => {
      const fetchMock = setup();
      const { POST } = await import("@/app/api/contact/route");

      const res = await POST(makeRequest({ ...body({ lines: ["Format: A4", "Gestaltung: Layoutservice anfragen"], fileTokens: [] }) }) as never);

      expect(res.status).toBe(200);
      const content = JSON.parse(storedCall(fetchMock)[1].body as string).content;
      expect(content).toContain("- Gestaltung: Layoutservice anfragen");
      expect(content).not.toContain("Wunsch");
    });

    it("words a film-size request in terms of film width and height", async () => {
      const fetchMock = setup();
      const { POST } = await import("@/app/api/contact/route");

      const res = await POST(makeRequest({ ...body(undefined), details: { customSize: { kind: "film", width: "150", height: 40 } } }) as never);

      expect(res.status).toBe(200);
      expect(JSON.parse(storedCall(fetchMock)[1].body as string).content).toContain("Wunschmaß-Anfrage: gewünschte Folienbreite 150 cm, gewünschte Folienhöhe 40 cm");
    });
  });

  it("rejects a product enquiry for an unknown product or without the privacy acknowledgement", async () => {
    vi.stubGlobal("fetch", vi.fn());
    vi.doMock("@/lib/enquiry-context", () => ({
      resolveEnquiryProduct: vi.fn(async (slug: string) => (slug === "known" ? { id: 1, slug, name: "Known", mode: "enquiry", url: "https://kubikart.de/de/shop/known" } : null)),
    }));
    const { POST } = await import("@/app/api/contact/route");

    const unknown = await POST(makeRequest({ ...validBody, privacy: true, context: { kind: "product", slug: "does-not-exist" } }) as never);
    const noPrivacy = await POST(makeRequest({ ...validBody, context: { kind: "product", slug: "known" } }) as never);

    expect(unknown.status).toBe(400);
    expect(noPrivacy.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("carries an industry context into the stored inquiry", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/contact/route");

    const res = await POST(makeRequest({ ...validBody, context: { kind: "industry", slug: "cafes-baeckereien", name: "Cafés & Bäckereien" } }) as never);

    expect(res.status).toBe(200);
    expect(JSON.parse(storedCall(fetchMock)[1].body as string).content).toContain("Branche: Cafés & Bäckereien (cafes-baeckereien)");
  });

  it("ignores an unknown context kind", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/contact/route");

    await POST(makeRequest({ ...validBody, context: { kind: "other", slug: "x", name: "Y" } }) as never);

    expect(JSON.parse(storedCall(fetchMock)[1].body as string).content).not.toContain("Anfrage-Kontext");
  });
});
