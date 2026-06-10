import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL!;
const WC_API_URL = process.env.WC_API_URL!;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY!;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET!;
const WP_AUTH = "Basic " + Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64");

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const id = request.nextUrl.searchParams.get("id");

  if (!token || !id) {
    return new NextResponse(renderHTML("error", "Ungültiger Bestätigungslink."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    // Fetch the post to verify the token
    const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/newsletter-subscribers/${id}`, {
      headers: {
        Authorization: WP_AUTH,
      },
    });

    if (!wpRes.ok) {
      return new NextResponse(renderHTML("error", "Anmeldung nicht gefunden."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const post = await wpRes.json();

    // Parse the stored data
    let data;
    try {
      // Content is wrapped in <p> tags by WP and quotes are converted to smart quotes
      let raw = post.content?.rendered || post.content?.raw || "";
      raw = raw
        .replace(/<\/?p>/g, "")
        .replace(/&#8220;|&#8221;|&#8243;|&ldquo;|&rdquo;/g, '"')
        .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/\n/g, "")
        .trim();
      data = JSON.parse(raw);
    } catch {
      return new NextResponse(renderHTML("error", "Daten konnten nicht gelesen werden."), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Verify token matches
    if (data.token !== token) {
      return new NextResponse(renderHTML("error", "Ungültiger Token."), {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Already confirmed?
    if (data.status === "confirmed") {
      return new NextResponse(renderHTML("success", "Deine Anmeldung wurde bereits bestätigt!"), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Update status to confirmed
    data.status = "confirmed";
    data.confirmed_at = new Date().toISOString();

    // Generate a unique 10% coupon for this subscriber
    const couponCode = `WILLKOMMEN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    let couponCreated = false;

    try {
      const couponRes = await fetch(`${WC_API_URL}/coupons?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          discount_type: "percent",
          amount: "10",
          individual_use: true,
          usage_limit: 1,
          usage_limit_per_user: 1,
          email_restrictions: [data.email],
          description: `Newsletter 10% Willkommensgutschein für ${data.email}`,
          date_expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
      });
      if (couponRes.ok) {
        couponCreated = true;
        data.coupon_code = couponCode;
      }
    } catch {
      // Coupon creation failed — continue without it
      console.error("Failed to create welcome coupon for", data.email);
    }

    await fetch(`${WP_URL}/wp-json/wp/v2/newsletter-subscribers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: WP_AUTH,
      },
      body: JSON.stringify({
        title: `Newsletter ✓: ${data.email}`,
        content: JSON.stringify(data),
      }),
    });

    const couponMessage = couponCreated
      ? `<br><br>🎉 Dein persönlicher <strong>10% Willkommensgutschein</strong>:<br><span style="display:inline-block;margin-top:8px;padding:10px 20px;background:#0a1d37;color:#fff;border-radius:8px;font-size:18px;font-weight:700;letter-spacing:1px;">${couponCode}</span><br><span style="font-size:13px;color:#667085;">Gültig für 90 Tage · Einmalig einlösbar</span>`
      : "";

    return new NextResponse(renderHTML("success", `Deine Newsletter-Anmeldung ist bestätigt! Du erhältst ab jetzt Updates von Kubikart.${couponMessage}`), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("Newsletter confirmation error:", err);
    return new NextResponse(renderHTML("error", "Ein Fehler ist aufgetreten. Bitte versuche es erneut."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function renderHTML(type: "success" | "error", message: string): string {
  const color = type === "success" ? "#059669" : "#dc2626";
  const icon = type === "success" ? "✓" : "✗";
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter – Kubikart</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #faf7f2; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 460px; text-align: center; box-shadow: 0 10px 40px rgba(10,29,55,0.08); }
    .icon { width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; color: white; background: ${color}; margin-bottom: 16px; }
    h1 { color: #0a1d37; font-size: 20px; margin: 0 0 12px; }
    p { color: #667085; font-size: 15px; line-height: 1.6; margin: 0; }
    a { display: inline-block; margin-top: 24px; color: #0a1d37; font-weight: 600; text-decoration: none; }
    a:hover { color: #f78801; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${type === "success" ? "Anmeldung bestätigt!" : "Fehler"}</h1>
    <p>${message}</p>
    <a href="/">← Zurück zu Kubikart</a>
  </div>
</body>
</html>`;
}
