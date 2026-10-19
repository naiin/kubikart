import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { acquireLock } from "@/lib/distributed-lock";

/** GET is a confirmation screen: email link scanners must not unsubscribe a reader. */
async function handle(request: NextRequest, mutate: boolean) {
  const id = request.nextUrl.searchParams.get("id");
  const token = request.nextUrl.searchParams.get("token");
  const en = request.nextUrl.searchParams.get("locale") === "en";
  const reply = (text: string, status = 200, form = false) => new NextResponse(`<!doctype html><html lang="${en ? "en" : "de"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Newsletter – Kubikart</title></head><body><main><h1>Newsletter</h1><p>${text}</p>${form ? `<form method="post"><button type="submit">${en ? "Confirm unsubscribe" : "Abmeldung bestätigen"}</button></form>` : ""}<a href="/${en ? "en" : "de"}">${en ? "Back to Kubikart" : "Zurück zu Kubikart"}</a></main></body></html>`, {
    status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" },
  });
  if (!id || !/^\d+$/.test(id) || !token || !/^[a-f0-9]{64}$/.test(token)) return reply(en ? "Invalid link." : "Ungültiger Link.", 400);
  let release;
  try {
    release = await acquireLock(`kubikart:newsletter-confirm:${id}`, 60_000);
    if (!release) return reply(en ? "Please try again shortly." : "Bitte versuche es gleich erneut.", 409);
    const endpoint = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wp/v2/newsletter-subscribers/${id}`;
    const headers = { Authorization: `Basic ${Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" };
    const response = await fetch(`${endpoint}?context=edit`, { headers, cache: "no-store" });
    if (!response.ok) return reply(en ? "Subscription not found." : "Anmeldung nicht gefunden.", 404);
    const post = await response.json();
    const data = JSON.parse(post.content.raw);
    const expected = data.unsubscribe_token;
    if (typeof expected !== "string" || Buffer.byteLength(expected) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(expected), Buffer.from(token))) return reply(en ? "Invalid link." : "Ungültiger Link.", 403);
    if (!mutate && data.status !== "unsubscribed") return reply(en ? "Would you like to unsubscribe from the Kubikart newsletter?" : "Möchtest du dich vom Kubikart-Newsletter abmelden?", 200, true);
    if (mutate && data.status !== "unsubscribed") {
      const saved = await fetch(endpoint, { method: "PUT", headers, body: JSON.stringify({ content: JSON.stringify({ ...data, status: "unsubscribed", unsubscribed_at: new Date().toISOString() }) }) });
      if (!saved.ok) throw new Error("Unable to store unsubscribe");
    }
    return reply(en ? "You have unsubscribed from the newsletter." : "Du bist vom Newsletter abgemeldet.");
  } catch {
    return reply(en ? "Unsubscribe could not be completed. Please try again." : "Die Abmeldung konnte nicht abgeschlossen werden. Bitte versuche es erneut.", 503);
  } finally { await release?.(); }
}

export const GET = (request: NextRequest) => handle(request, false);
export const POST = (request: NextRequest) => handle(request, true);
