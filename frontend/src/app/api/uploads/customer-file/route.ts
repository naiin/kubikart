import { CUSTOMER_FILE_MAX_BYTES, CustomerFileError, uploadCustomerFile } from "@/lib/customer-files";
import { checkForSpam } from "@/lib/security";

const ERROR_MESSAGES: Record<CustomerFileError["code"], string> = {
  missing: "No file was provided",
  too_large: "The file is too large",
  empty: "The file is empty",
  type_not_allowed: "Only PNG, JPEG, WebP or PDF files are accepted",
  not_found: "File not found",
  storage_unavailable: "The file could not be stored right now",
};

export async function POST(request: Request) {
  // Per-client rate limiting is applied by the proxy for this path.
  if (checkForSpam({}, request).isSpam) {
    return Response.json({ error: "Invalid request", code: "invalid_origin" }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > CUSTOMER_FILE_MAX_BYTES + 64 * 1024) {
    return Response.json({ error: ERROR_MESSAGES.too_large, code: "too_large" }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  let fieldId: string | undefined;
  try {
    const form = await request.formData();
    file = form.get("file");
    const rawFieldId = form.get("field_id");
    fieldId = typeof rawFieldId === "string" ? rawFieldId.replace(/[^a-z0-9_-]/gi, "") : undefined;
  } catch {
    return Response.json({ error: ERROR_MESSAGES.missing, code: "missing" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: ERROR_MESSAGES.missing, code: "missing" }, { status: 400 });
  }

  try {
    const stored = await uploadCustomerFile(file, fieldId);
    return Response.json({ token: stored.token, filename: stored.filename, size: stored.size, mime: stored.mime }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerFileError) {
      return Response.json({ error: ERROR_MESSAGES[error.code], code: error.code }, { status: error.status });
    }
    console.error("Customer file upload failed unexpectedly");
    return Response.json({ error: ERROR_MESSAGES.storage_unavailable, code: "storage_unavailable" }, { status: 503 });
  }
}
