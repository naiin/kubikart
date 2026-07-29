import { checkForSpam } from "@/lib/security";
import { sendWithdrawalConfirmation } from "@/lib/email";

type WithdrawalRequest = {
  name?: unknown;
  email?: unknown;
  contractReference?: unknown;
  scope?: unknown;
  locale?: unknown;
  _hp?: unknown;
  _t?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(value: unknown, maximumLength: number): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  let body: WithdrawalRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const spamCheck = checkForSpam(body as Record<string, unknown>, request, 2500);
  if (spamCheck.isSpam) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const name = sanitize(body.name, 160);
  const email = sanitize(body.email, 254).toLowerCase();
  const contractReference = sanitize(body.contractReference, 240);
  const scope = sanitize(body.scope, 1500);
  const locale = body.locale === "en" ? "en" : "de";

  if (!name || !contractReference || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "invalid_fields" }, { status: 400 });
  }

  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, "");
  const wordpressUser = process.env.WP_APP_USER;
  const wordpressPassword = process.env.WP_APP_PASSWORD;
  if (!wordpressUrl || !wordpressUser || !wordpressPassword) {
    console.error("Withdrawal storage is not configured.");
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  const receivedAt = new Date();
  const receiptId = crypto.randomUUID();
  const content = [
    `<p><strong>Reference:</strong> ${escapeHtml(receiptId)}</p>`,
    `<p><strong>Received:</strong> ${escapeHtml(receivedAt.toISOString())}</p>`,
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Contract / order:</strong> ${escapeHtml(contractReference)}</p>`,
    `<p><strong>Scope:</strong> ${escapeHtml(scope || "Entire contract")}</p>`,
    `<p><strong>Locale:</strong> ${locale}</p>`,
  ].join("\n");

  try {
    const wordpressResponse = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${wordpressUser}:${wordpressPassword}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `Widerruf ${receiptId}`,
        content,
        status: "private",
      }),
      cache: "no-store",
    });

    if (!wordpressResponse.ok) {
      console.error("Withdrawal could not be stored in WordPress.", {
        status: wordpressResponse.status,
      });
      return Response.json({ error: "unavailable" }, { status: 503 });
    }
  } catch (error) {
    console.error("Withdrawal storage failed.", error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  let emailSent = false;
  try {
    emailSent = await sendWithdrawalConfirmation(email, {
      receiptId,
      receivedAt: receivedAt.toISOString(),
      name,
      contractReference,
      scope,
      locale,
    });
  } catch (error) {
    console.error("Withdrawal confirmation email failed.", error);
  }

  return Response.json({
    success: true,
    receiptId,
    receivedAt: receivedAt.toISOString(),
    name,
    email,
    contractReference,
    scope,
    emailSent,
  });
}
