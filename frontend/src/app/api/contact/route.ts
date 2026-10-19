import { getClientIp } from "@/lib/client-ip";
import { checkForSpam } from "@/lib/security";
import { sendContactConfirmation } from "@/lib/email";
import { resolveEnquiryProduct, type EnquiryProduct } from "@/lib/enquiry-context";
import { resolveEnquiryConfiguration, EnquiryConfigurationError } from "@/lib/enquiry-configuration";
import { ENQUIRY_META, newEnquiryReference, notifyOwner, storeNotificationState, type EnquiryRecord } from "@/lib/enquiry-notification";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, "");
const WP_APP_USER = process.env.WP_APP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// Rate limiting: simple in-memory store (per-instance)
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 3; // max submissions
const RATE_WINDOW = 600_000; // per 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = submissions.get(ip)?.filter((t) => now - t < RATE_WINDOW) || [];
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  if (isRateLimited(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Spam/bot detection (5s min for contact form)
  const spamCheck = checkForSpam(body, request, 5000);
  if (spamCheck.isSpam) {
    // Return fake success to not reveal detection to bots
    return Response.json({ success: true });
  }

  const { name, email, phone, type, message, context, company, details } = body;

  // A product/bundle enquiry is validated against WooCommerce: the identity
  // (id, name, URL) comes from the server, not from the browser.
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const requestLocale: "de" | "en" = body.locale === "en" || (body.locale !== "de" && acceptLanguage.startsWith("en")) ? "en" : "de";
  let enquiryProduct: EnquiryProduct | null = null;
  if (context && typeof context === "object" && context.kind === "product") {
    enquiryProduct = await resolveEnquiryProduct(String(context.slug ?? "").trim().toLowerCase(), requestLocale);
    if (!enquiryProduct) return Response.json({ error: "Unknown product" }, { status: 400 });
    if (body.privacy !== true) return Response.json({ error: "Privacy acknowledgement required" }, { status: 400 });
  }

  // Validate required fields (the message is optional for product enquiries)
  if (!name || !email || (!message && !enquiryProduct)) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  // Sanitize inputs (strip HTML tags)
  const sanitize = (value: unknown) =>
    String(value ?? "")
      .replace(/<[^>]*>/g, "")
      .trim()
      .slice(0, 2000);

  const contextLabel = enquiryProduct
    ? [
        `Produkt/Paket: ${enquiryProduct.name} (ID ${enquiryProduct.id}, ${enquiryProduct.slug})`,
        ...(enquiryProduct.sku ? [`SKU: ${enquiryProduct.sku}`] : []),
        `Seite: ${enquiryProduct.url}`,
        `Sprache: ${requestLocale}`,
        `Bestellart: ${enquiryProduct.mode === "enquiry" ? "Nur auf Anfrage" : "Direktkauf"}`,
      ].join("\n")
    : context && typeof context === "object" && context.kind === "industry" && sanitize(context.slug)
      ? `Branche: ${sanitize(context.name).slice(0, 120)} (${sanitize(context.slug).slice(0, 120)})`
      : "";
  const companyLine = sanitize(company).slice(0, 120);

  // "Request custom size" on a product page: both measures are required and plausible (centimetres).
  let customSizeLine = "";
  if (enquiryProduct && details && typeof details === "object" && details.customSize && typeof details.customSize === "object") {
    const width = Number(details.customSize.width);
    const height = Number(details.customSize.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || width > 500 || height < 1 || height > 500) {
      return Response.json({ error: "Invalid custom size" }, { status: 400 });
    }
    customSizeLine = requestLocale === "en"
      ? details.customSize.kind === "film"
        ? `Custom size request: film width ${width} cm, film height ${height} cm`
        : details.customSize.kind === "format"
          ? `Custom format request: finished width ${width} cm, finished height ${height} cm`
          : `Custom size request: overall width ${width} cm, maximum available height ${height} cm`
      : details.customSize.kind === "film"
        ? `Wunschmaß-Anfrage: gewünschte Folienbreite ${width} cm, gewünschte Folienhöhe ${height} cm`
        : details.customSize.kind === "format"
          ? `Wunschformat-Anfrage: gewünschte fertige Breite ${width} cm, gewünschte fertige Höhe ${height} cm`
          : `Wunschmaß-Anfrage: gewünschte Gesamtbreite ${width} cm, maximal verfügbare Höhe ${height} cm`;
  }

  // The customer's choices on an enquiry-only product page (and the files they uploaded for it).
  let configuration = { text: "", fileTokens: [] as string[] };
  if (enquiryProduct && details && typeof details === "object" && details.configuration) {
    try {
      configuration = await resolveEnquiryConfiguration(details.configuration);
    } catch (error) {
      if (error instanceof EnquiryConfigurationError) return Response.json({ error: error.message }, { status: error.status });
      throw error;
    }
  }
  const enquiryMessage = [customSizeLine, requestLocale === "en" ? configuration.text.replace(/^Auswahl:/, "Selected options:") : configuration.text, sanitize(message)].filter(Boolean).join("\n\n");

  const sanitizedData = {
    name: sanitize(name),
    email: sanitize(email),
    phone: sanitize(phone || ""),
    type: enquiryProduct ? "paketanfrage" : sanitize(type || "personal"),
    message: `${enquiryMessage}${companyLine ? `\n\nUnternehmen: ${companyLine}` : ""}${contextLabel ? `\n\nAnfrage-Kontext\n${contextLabel}` : ""}`.trim(),
  };

  const reference = newEnquiryReference();
  const industryContext = !enquiryProduct && context && typeof context === "object" && context.kind === "industry" && sanitize(context.slug)
    ? { name: sanitize(context.name).slice(0, 120), slug: sanitize(context.slug).slice(0, 120) }
    : undefined;
  const record: EnquiryRecord = {
    reference,
    receivedAt: new Date().toISOString(),
    locale: requestLocale,
    kind: enquiryProduct ? "product" : industryContext ? "industry" : "contact",
    name: sanitizedData.name,
    email: sanitizedData.email,
    ...(sanitizedData.phone ? { phone: sanitizedData.phone } : {}),
    ...(companyLine ? { company: companyLine } : {}),
    ...(enquiryMessage ? { message: enquiryMessage } : {}),
    ...(enquiryProduct ? { product: { id: enquiryProduct.id, name: enquiryProduct.name, slug: enquiryProduct.slug, ...(enquiryProduct.sku ? { sku: enquiryProduct.sku } : {}), url: enquiryProduct.url, mode: enquiryProduct.mode } } : {}),
    ...(industryContext ? { industry: industryContext } : {}),
  };

  if (!WP_URL || !WP_APP_USER || !WP_APP_PASSWORD) {
    console.error("Contact inquiry storage is not configured.");
    return Response.json({ error: "Unable to save inquiry" }, { status: 503 });
  }
  const wpAuth = `Basic ${Buffer.from(`${WP_APP_USER}:${WP_APP_PASSWORD}`).toString("base64")}`;

  // Try to submit via CF7 REST API (if CF7 is active and form ID is configured)
  const cf7FormId = process.env.CF7_FORM_ID;

  if (cf7FormId) {
    try {
      const formData = new FormData();
      formData.append("your-name", sanitizedData.name);
      formData.append("your-email", sanitizedData.email);
      formData.append("your-phone", sanitizedData.phone);
      formData.append("your-type", sanitizedData.type);
      formData.append("your-message", sanitizedData.message);

      const cf7Res = await fetch(`${WP_URL}/wp-json/contact-form-7/v1/contact-forms/${cf7FormId}/feedback`, { method: "POST", body: formData });

      if (cf7Res.ok) {
        const result = await cf7Res.json();
        if (result.status === "mail_sent") {
          // Send confirmation email to customer
          try {
            const locale = requestLocale;
            await sendContactConfirmation(sanitizedData.email, record, locale);
          } catch (err) {
            console.error("Failed to send contact confirmation email:", err);
          }

          return Response.json({ success: true });
        }
      }
    } catch {
      // CF7 submission failed, fall through to WP comment method
    }
  }

  // Fallback: create a private WP post to store the inquiry
  let storedPostId = 0;
  try {
    const postBody = {
      title: enquiryProduct ? `Anfrage ${reference}: ${enquiryProduct.name} – ${sanitizedData.name}` : `Kontaktanfrage ${reference}: ${sanitizedData.name} (${sanitizedData.type})`,
      content: `<p><strong>Referenz:</strong> ${reference}</p>
<p><strong>Name:</strong> ${sanitizedData.name}</p>
<p><strong>E-Mail:</strong> ${sanitizedData.email}</p>
<p><strong>Telefon:</strong> ${sanitizedData.phone || "–"}</p>
<p><strong>Typ:</strong> ${sanitizedData.type}</p>
<p><strong>Nachricht:</strong></p>
<p>${sanitizedData.message.replace(/\n/g, "<br>")}</p>`,
      status: "private",
      meta: {
        [ENQUIRY_META.record]: JSON.stringify(record),
        [ENQUIRY_META.reference]: reference,
        [ENQUIRY_META.status]: "pending",
        [ENQUIRY_META.attempts]: 0,
        ...(configuration.fileTokens.length ? { [ENQUIRY_META.files]: JSON.stringify(configuration.fileTokens) } : {}),
      },
    };

    const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: wpAuth,
      },
      body: JSON.stringify(postBody),
    });

    if (!wpRes.ok) {
      console.error("Failed to save contact form to WP.", { status: wpRes.status });
      return Response.json({ error: "Unable to save inquiry" }, { status: 503 });
    }
    storedPostId = Number((await wpRes.json().catch(() => null))?.id) || 0;
  } catch (err) {
    console.error("Contact form WP submission error:", err);
    return Response.json({ error: "Unable to save inquiry" }, { status: 503 });
  }

  // Notify the owner. The enquiry is already stored; a failure here only records
  // a "failed" status that can be retried without creating the enquiry again.
  if (storedPostId) {
    const state = await notifyOwner(record, storedPostId);
    await storeNotificationState(storedPostId, state);
  }

  // Send confirmation email to customer
  try {
    const locale = requestLocale;
    await sendContactConfirmation(sanitizedData.email, record, locale);
  } catch (err) {
    console.error("Failed to send contact confirmation email:", err);
    // Don't fail the request if email fails
  }

  return Response.json({ success: true, reference });
}
