import { checkForSpam } from "@/lib/security";
import { sendContactConfirmation } from "@/lib/email";

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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

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

  const { name, email, phone, type, message } = body;

  // Validate required fields
  if (!name || !email || !message) {
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

  const sanitizedData = {
    name: sanitize(name),
    email: sanitize(email),
    phone: sanitize(phone || ""),
    type: sanitize(type || "personal"),
    message: sanitize(message),
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
            const acceptLang = request.headers.get("accept-language") ?? "";
            const locale = acceptLang.startsWith("en") ? "en" : "de";
            await sendContactConfirmation(sanitizedData.email, sanitizedData, locale);
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
  try {
    const postBody = {
      title: `Kontaktanfrage: ${sanitizedData.name} (${sanitizedData.type})`,
      content: `<p><strong>Name:</strong> ${sanitizedData.name}</p>
<p><strong>E-Mail:</strong> ${sanitizedData.email}</p>
<p><strong>Telefon:</strong> ${sanitizedData.phone || "–"}</p>
<p><strong>Typ:</strong> ${sanitizedData.type}</p>
<p><strong>Nachricht:</strong></p>
<p>${sanitizedData.message}</p>`,
      status: "private",
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
  } catch (err) {
    console.error("Contact form WP submission error:", err);
    return Response.json({ error: "Unable to save inquiry" }, { status: 503 });
  }

  // Send confirmation email to customer
  try {
    const acceptLang = request.headers.get("accept-language") ?? "";
    const locale = acceptLang.startsWith("en") ? "en" : "de";
    await sendContactConfirmation(sanitizedData.email, sanitizedData, locale);
  } catch (err) {
    console.error("Failed to send contact confirmation email:", err);
    // Don't fail the request if email fails
  }

  return Response.json({ success: true });
}
