import { NextResponse } from "next/server";
import { checkForSpam } from "@/lib/security";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL!;
const WP_AUTH = "Basic " + Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64");

// Rate limiting: simple in-memory store (per-instance)
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 3; // max submissions
const RATE_WINDOW = 600_000; // per 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = submissions.get(ip)?.filter((t) => now - t < RATE_WINDOW) || [];
  submissions.set(ip, timestamps);
  return timestamps.length >= RATE_LIMIT;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Spam/bot detection (5s min for contact form)
  const spamCheck = checkForSpam(body, request, 5000);
  if (spamCheck.isSpam) {
    // Return fake success to not reveal detection to bots
    return NextResponse.json({ success: true });
  }

  const { name, email, phone, type, message } = body;

  // Validate required fields
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Sanitize inputs (strip HTML tags)
  const sanitize = (str: string) =>
    str
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
          // Track successful submission for rate limiting
          const timestamps = submissions.get(ip) || [];
          timestamps.push(Date.now());
          submissions.set(ip, timestamps);
          return NextResponse.json({ success: true });
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
        Authorization: WP_AUTH,
      },
      body: JSON.stringify(postBody),
    });

    if (!wpRes.ok) {
      // WP post creation failed — still consider it a success for the user
      // since we can log it server-side
      console.error("Failed to save contact form to WP:", await wpRes.text());
    }
  } catch (err) {
    console.error("Contact form WP submission error:", err);
  }

  // Track for rate limiting
  const timestamps = submissions.get(ip) || [];
  timestamps.push(Date.now());
  submissions.set(ip, timestamps);

  return NextResponse.json({ success: true });
}
