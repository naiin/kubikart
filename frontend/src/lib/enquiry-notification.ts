import "server-only";

import { randomBytes } from "node:crypto";
import { sendOwnerEnquiryNotification, type OwnerEnquiryEmail } from "@/lib/email";

export type EnquiryRecord = Omit<OwnerEnquiryEmail, "adminUrl">;

export type NotificationStatus = "pending" | "accepted" | "failed";

/** What is stored next to the enquiry. "accepted" means the provider accepted it, not that it reached an inbox. */
export type NotificationState = {
  status: NotificationStatus;
  attempts: number;
  lastAttemptAt: string;
  error?: string;
  messageId?: string;
};

export const ENQUIRY_META = {
  record: "_kubikart_enquiry",
  files: "_kubikart_enquiry_files",
  reference: "_kubikart_enquiry_reference",
  status: "_kubikart_notification_status",
  attempts: "_kubikart_notification_attempts",
  lastAttempt: "_kubikart_notification_last_attempt",
  error: "_kubikart_notification_error",
  messageId: "_kubikart_notification_message_id",
} as const;

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Customer-quotable enquiry reference, e.g. ANF-261015-K7QX2M. */
export function newEnquiryReference(now = new Date()): string {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join("");
  return `ANF-${date}-${suffix}`;
}

function wpConfig() {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, "");
  const user = process.env.WP_APP_USER;
  const password = process.env.WP_APP_PASSWORD;
  if (!url || !user || !password) return null;
  return { url, auth: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}` };
}

export function enquiryAdminUrl(postId: number): string | undefined {
  const config = wpConfig();
  return config ? `${config.url}/wp-admin/post.php?post=${postId}&action=edit` : undefined;
}

/** Keeps provider errors readable and makes sure no credential can end up in WordPress. */
export function safeErrorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : String(error);
  for (const secret of [process.env.MAILTRAP_TOKEN, process.env.WP_APP_PASSWORD]) {
    if (secret) message = message.split(secret).join("[redacted]");
  }
  return message.replace(/\s+/g, " ").slice(0, 300);
}

/** Sends the owner notification. Never throws: the result is the state to record. */
export async function notifyOwner(record: EnquiryRecord, postId: number, previousAttempts = 0): Promise<NotificationState> {
  const base = { attempts: previousAttempts + 1, lastAttemptAt: new Date().toISOString() };
  try {
    const result = await sendOwnerEnquiryNotification({ ...record, adminUrl: enquiryAdminUrl(postId) });
    return { ...base, status: "accepted", ...(result.messageId ? { messageId: result.messageId } : {}) };
  } catch (error) {
    console.error("Owner enquiry notification failed:", safeErrorMessage(error));
    return { ...base, status: "failed", error: safeErrorMessage(error) };
  }
}

/** Records the notification state on the stored enquiry. Never throws. */
export async function storeNotificationState(postId: number, state: NotificationState): Promise<boolean> {
  const config = wpConfig();
  if (!config) return false;
  try {
    const response = await fetch(`${config.url}/wp-json/wp/v2/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: config.auth },
      body: JSON.stringify({
        meta: {
          [ENQUIRY_META.status]: state.status,
          [ENQUIRY_META.attempts]: state.attempts,
          [ENQUIRY_META.lastAttempt]: state.lastAttemptAt,
          [ENQUIRY_META.error]: state.error ?? "",
          [ENQUIRY_META.messageId]: state.messageId ?? "",
        },
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

type WpPost = { id: number; meta?: Record<string, unknown> };

function parseRecord(value: unknown): EnquiryRecord | null {
  try {
    const record = typeof value === "string" ? JSON.parse(value) : value;
    if (record && typeof record === "object" && typeof (record as EnquiryRecord).reference === "string" && typeof (record as EnquiryRecord).email === "string") {
      return record as EnquiryRecord;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Loads a stored enquiry with its notification state from WordPress. */
export async function loadEnquiry(postId: number): Promise<{ postId: number; record: EnquiryRecord; attempts: number; status: NotificationStatus } | null> {
  const config = wpConfig();
  if (!config) return null;
  const response = await fetch(`${config.url}/wp-json/wp/v2/posts/${postId}?context=edit`, { headers: { Authorization: config.auth } });
  if (!response.ok) return null;
  return fromPost((await response.json()) as WpPost);
}

function fromPost(post: WpPost) {
  const record = parseRecord(post.meta?.[ENQUIRY_META.record]);
  if (!record) return null;
  const status = post.meta?.[ENQUIRY_META.status];
  return {
    record,
    attempts: Number(post.meta?.[ENQUIRY_META.attempts]) || 0,
    status: (status === "accepted" || status === "failed" ? status : "pending") as NotificationStatus,
    postId: post.id,
  };
}

/**
 * Enquiries whose notification is not accepted yet (failed, or still pending).
 * Uses the `kubikart_notification=unsent` collection filter of the
 * kubikart-enquiries mu-plugin.
 */
export async function listUnnotifiedEnquiries(limit = 20) {
  const config = wpConfig();
  if (!config) return [];
  const response = await fetch(
    `${config.url}/wp-json/wp/v2/posts?context=edit&status=private&per_page=${limit}&orderby=date&order=asc&kubikart_notification=unsent`,
    { headers: { Authorization: config.auth } },
  );
  if (!response.ok) return [];
  return ((await response.json()) as WpPost[]).map(fromPost).filter((entry): entry is NonNullable<ReturnType<typeof fromPost>> => Boolean(entry));
}
