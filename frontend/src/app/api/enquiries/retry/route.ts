import { NextRequest, NextResponse } from "next/server";
import { SIGNATURE_TIMESTAMP_HEADER, verifySignedRequest } from "@/lib/signed-request";
import { listUnnotifiedEnquiries, loadEnquiry, notifyOwner, storeNotificationState } from "@/lib/enquiry-notification";

/**
 * Retries the owner notification of stored enquiries. It never creates or
 * changes an enquiry (only its notification status), so a retry cannot
 * duplicate one. Signed with its own secret, ENQUIRY_RETRY_SECRET (no fallback
 * to another endpoint's secret): header `x-kubikart-signature` is the base64
 * HMAC-SHA256 of `"<unix seconds>.<raw body>"` and `x-kubikart-timestamp` the
 * time; requests outside a five-minute window are rejected.
 *
 *   { "post_id": 123 }            retry one enquiry (only if not accepted yet; add "force": true to resend)
 *   {}                            retry every enquiry that is failed or still pending (max 20)
 */
function verify(request: NextRequest, body: string): boolean {
  return verifySignedRequest({
    secret: process.env.ENQUIRY_RETRY_SECRET,
    signature: request.headers.get("x-kubikart-signature"),
    timestamp: request.headers.get(SIGNATURE_TIMESTAMP_HEADER),
    body,
  });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verify(request, raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { post_id?: unknown; force?: unknown } = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const postId = Number(body.post_id);
  const targets: NonNullable<Awaited<ReturnType<typeof loadEnquiry>>>[] = [];

  if (Number.isInteger(postId) && postId > 0) {
    const enquiry = await loadEnquiry(postId);
    if (!enquiry) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    if (enquiry.status === "accepted" && body.force !== true) {
      return NextResponse.json({ results: [{ postId, status: "accepted", skipped: true }] });
    }
    targets.push(enquiry);
  } else {
    targets.push(...(await listUnnotifiedEnquiries(20)));
  }

  const results = [];
  for (const target of targets) {
    const state = await notifyOwner(target.record, target.postId, target.attempts);
    const stored = await storeNotificationState(target.postId, state);
    results.push({ postId: target.postId, reference: target.record.reference, status: state.status, attempts: state.attempts, stored, ...(state.error ? { error: state.error } : {}) });
  }

  return NextResponse.json({ results });
}
