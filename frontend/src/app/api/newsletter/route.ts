import { NextResponse } from "next/server";
import crypto from "crypto";
import { checkForSpam } from "@/lib/security";
import { sendNewsletterConfirmation } from "@/lib/email";
import { inferRequestLocale } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL!;
const WP_AUTH = "Basic " + Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kubikart-frontend.vercel.app";

// Rate limiting
const submissions = new Map<string, number[]>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 600_000; // 10 min

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
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Spam/bot detection
  const spamCheck = checkForSpam(body, request, 1500);
  if (spamCheck.isSpam) {
    // Return fake success to not reveal detection to bots
    return NextResponse.json({ success: true, doubleOptIn: true });
  }

  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const sanitizedEmail = email.trim().toLowerCase().slice(0, 254);
  const locale = body.locale === "en" || body.locale === "de" ? body.locale : inferRequestLocale(request.headers);

  // Generate a confirmation token for double opt-in
  const token = crypto.randomBytes(32).toString("hex");

  // Store as a private WordPress post with status "pending" (not confirmed yet)
  try {
    const postBody = {
      title: `Newsletter: ${sanitizedEmail}`,
      content: JSON.stringify({
        email: sanitizedEmail,
        token,
        status: "pending",
        subscribed_at: new Date().toISOString(),
        confirmed_at: null,
        ip,
        locale,
      }),
      status: "private",
      categories: [], // Could assign a "newsletter" category
    };

    const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/newsletter-subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: WP_AUTH,
      },
      body: JSON.stringify(postBody),
    });

    if (!wpRes.ok) {
      console.error("Failed to save newsletter subscriber:", await wpRes.text());
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const post = await wpRes.json();

    // Build confirmation URL
    const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${token}&id=${post.id}&locale=${locale}`;

    // Send confirmation email via Mailtrap
    try {
      await sendNewsletterConfirmation(sanitizedEmail, confirmUrl, locale);
      console.log(`[Newsletter] Confirmation email sent to ${sanitizedEmail}`);
    } catch (err) {
      console.error(`[Newsletter] Failed to send confirmation email:`, err);
      return NextResponse.json({ error: "Confirmation email could not be sent. Please try again." }, { status: 503 });
    }
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, doubleOptIn: true });
}
