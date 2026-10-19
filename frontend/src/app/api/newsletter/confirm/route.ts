import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendNewsletterWelcome } from "@/lib/email";
import { acquireLock } from "@/lib/distributed-lock";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL!;
const WP_AUTH = `Basic ${Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64")}`;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const id = request.nextUrl.searchParams.get("id");
  let locale: "de" | "en" = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "de";
  const reply = (success: boolean, message: string, status = 200) => new NextResponse(renderHTML(success, message, locale), {
    status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
  const message = (de: string, en: string) => locale === "en" ? en : de;
  if (!token || !id || !/^\d+$/.test(id)) return reply(false, message("Ungültiger Bestätigungslink.", "Invalid confirmation link."), 400);

  let release;
  try {
    release = await acquireLock(`kubikart:newsletter-confirm:${id}`, 60_000);
    if (!release) return reply(false, message("Die Bestätigung wird bereits verarbeitet. Bitte versuche es erneut.", "Confirmation is already being processed. Please try again."), 409);
    const endpoint = `${WP_URL}/wp-json/wp/v2/newsletter-subscribers/${id}`;
    const response = await fetch(`${endpoint}?context=edit`, { headers: { Authorization: WP_AUTH }, cache: "no-store" });
    if (!response.ok) return reply(false, message("Anmeldung nicht gefunden.", "Subscription not found."), 404);
    const post = await response.json();
    const raw = post.content?.raw ?? (post.content?.rendered || "").replace(/<\/?p>/g, "").replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|&quot;/g, '"').replace(/&amp;/g, "&").trim();
    const data = JSON.parse(raw);
    if (data.locale === "de" || data.locale === "en") locale = data.locale;
    if (typeof data.token !== "string" || Buffer.byteLength(data.token) !== Buffer.byteLength(token) || !crypto.timingSafeEqual(Buffer.from(data.token), Buffer.from(token))) {
      return reply(false, message("Ungültiger Token.", "Invalid token."), 403);
    }
    if (data.status === "unsubscribed") return reply(false, message("Diese Anmeldung wurde abgemeldet. Bitte melde dich bei Bedarf erneut an.", "This subscription was cancelled. Please sign up again if you wish to subscribe."), 409);
    if (data.status === "confirmed" && data.email_status !== "failed" && data.email_status !== "pending") {
      return reply(true, message("Deine Anmeldung wurde bereits bestätigt!", "Your subscription has already been confirmed!"));
    }

    if (data.status !== "confirmed") {
      const couponCode = `WILLKOMMEN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const couponResponse = await fetch(`${process.env.WC_API_URL}/coupons`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64")}` },
        body: JSON.stringify({ code: couponCode, discount_type: "percent", amount: "10", individual_use: true, usage_limit: 1, usage_limit_per_user: 1, email_restrictions: [data.email], description: `Newsletter: ${data.email}`, date_expires: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0] }),
      });
      if (couponResponse.ok) data.coupon_code = couponCode;
      data.status = "confirmed";
      data.confirmed_at = new Date().toISOString();
      data.email_status = "pending";
    }

    const save = async () => {
      const saved = await fetch(endpoint, { method: "PUT", headers: { Authorization: WP_AUTH, "Content-Type": "application/json" }, body: JSON.stringify({ title: `Newsletter ✓: ${data.email}`, content: JSON.stringify(data) }) });
      if (!saved.ok) throw new Error("Newsletter state could not be stored");
    };
    if (!data.unsubscribe_token) data.unsubscribe_token = crypto.randomBytes(32).toString("hex");
    await save();
    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL || "https://kubikart.de";
      const unsubscribeUrl = `${site}/api/newsletter/unsubscribe?id=${id}&token=${data.unsubscribe_token}&locale=${locale}`;
      await sendNewsletterWelcome(data.email, locale, data.coupon_code, unsubscribeUrl);
      data.email_status = "accepted";
    } catch {
      data.email_status = "failed";
      await save();
      return reply(false, message("Deine Anmeldung ist bestätigt, aber die E-Mail konnte nicht gesendet werden. Bitte öffne diesen Link erneut.", "Your subscription is confirmed, but the email could not be sent. Please open this link again."), 503);
    }
    await save();
    const coupon = typeof data.coupon_code === "string" && /^WILLKOMMEN-[A-F0-9]{8}$/.test(data.coupon_code)
      ? `<br><br>${message("Dein persönlicher 10%-Gutschein", "Your personal 10% coupon")}: <strong>${data.coupon_code}</strong><br>${message("90 Tage gültig · Einmalig einlösbar", "Valid for 90 days · Single use")}` : "";
    return reply(true, message("Deine Newsletter-Anmeldung ist bestätigt!", "Your newsletter subscription is confirmed!") + coupon);
  } catch {
    return reply(false, message("Die Bestätigung konnte nicht abgeschlossen werden. Bitte versuche es erneut.", "Confirmation could not be completed. Please try again."), 503);
  } finally {
    await release?.();
  }
}

function renderHTML(success: boolean, text: string, locale: "de" | "en") {
  const heading = success ? (locale === "en" ? "Subscription confirmed" : "Anmeldung bestätigt") : (locale === "en" ? "Please try again" : "Bitte erneut versuchen");
  const back = locale === "en" ? "Back to Kubikart" : "Zurück zu Kubikart";
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Newsletter – Kubikart</title><style>body{font-family:system-ui,sans-serif;background:#F7F4EF;color:#0C2D48;min-height:100vh;margin:0;display:grid;place-items:center}.card{background:#fff;padding:32px;margin:20px;max-width:460px;border:1px solid #DDE3E8;border-radius:16px}p{line-height:1.6}a{display:inline-block;padding:12px 0;color:#0C2D48}</style></head><body><main class="card"><h1>${heading}</h1><p>${text}</p><a href="/${locale}">← ${back}</a></main></body></html>`;
}
