import "server-only";

import { CUSTOMER_FILE_MAX_BYTES } from "@/lib/customer-file-limits";

export { CUSTOMER_FILE_MAX_BYTES };
export const CUSTOMER_FILE_TOKEN_PATTERN = /^[a-f0-9]{32}$/;
export const CUSTOMER_FILE_MARKER_PREFIX = "kubikart-file:";

export type CustomerFileType = "image/png" | "image/jpeg" | "image/webp" | "application/pdf";

export type CustomerFileInfo = {
  token: string;
  filename: string;
  mime: string;
  size: number;
  status?: string;
  order_id?: number;
};

export class CustomerFileError extends Error {
  constructor(
    readonly code: "missing" | "too_large" | "empty" | "type_not_allowed" | "not_found" | "storage_unavailable",
    readonly status: number,
  ) {
    super(code);
    this.name = "CustomerFileError";
  }
}

/** Identifies the file by its content, never by the client-supplied MIME type or name. */
export function detectCustomerFileType(bytes: Uint8Array): CustomerFileType | null {
  const startsWith = (signature: number[], offset = 0) => signature.every((value, index) => bytes[offset + index] === value);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  return null;
}

function customerFilesEndpoint() {
  const base = process.env.WC_API_URL;
  if (!base || !process.env.WC_CONSUMER_KEY || !process.env.WC_CONSUMER_SECRET) {
    throw new CustomerFileError("storage_unavailable", 503);
  }
  return `${base}/kubikart/customer-files`;
}

function authorization() {
  return `Basic ${Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64")}`;
}

function mapBackendError(status: number, code: string | undefined) {
  if (status === 413 || code === "kubikart_file_too_large") return new CustomerFileError("too_large", 413);
  if (code === "kubikart_file_empty") return new CustomerFileError("empty", 422);
  if (code === "kubikart_file_type_not_allowed") return new CustomerFileError("type_not_allowed", 422);
  if (status === 404) return new CustomerFileError("not_found", 404);
  return new CustomerFileError("storage_unavailable", 503);
}

/** Validates the upload and hands it to the private WordPress storage. */
export async function uploadCustomerFile(file: File, fieldId?: string): Promise<CustomerFileInfo> {
  if (file.size === 0) throw new CustomerFileError("empty", 422);
  if (file.size > CUSTOMER_FILE_MAX_BYTES) throw new CustomerFileError("too_large", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectCustomerFileType(bytes);
  if (!detected) throw new CustomerFileError("type_not_allowed", 422);

  const form = new FormData();
  form.append("file", new Blob([bytes], { type: detected }), file.name || "upload");
  if (fieldId) form.append("field_id", fieldId.slice(0, 64));

  let response: Response;
  try {
    response = await fetch(customerFilesEndpoint(), {
      method: "POST",
      headers: { Authorization: authorization() },
      body: form,
      cache: "no-store",
    });
  } catch {
    throw new CustomerFileError("storage_unavailable", 503);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { code?: string } | null;
    throw mapBackendError(response.status, body?.code);
  }
  return (await response.json()) as CustomerFileInfo;
}

export async function getCustomerFile(token: string): Promise<CustomerFileInfo> {
  if (!CUSTOMER_FILE_TOKEN_PATTERN.test(token)) throw new CustomerFileError("not_found", 404);

  let response: Response;
  try {
    response = await fetch(`${customerFilesEndpoint()}/${token}`, {
      headers: { Authorization: authorization() },
      cache: "no-store",
    });
  } catch {
    throw new CustomerFileError("storage_unavailable", 503);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { code?: string } | null;
    throw mapBackendError(response.status, body?.code);
  }
  return (await response.json()) as CustomerFileInfo;
}

/** Order line-item meta value understood by the WordPress customer-files plugin. */
export function formatCustomerFileMetaValue(file: Pick<CustomerFileInfo, "token" | "filename">) {
  return `${file.filename} [${CUSTOMER_FILE_MARKER_PREFIX}${file.token}]`;
}
