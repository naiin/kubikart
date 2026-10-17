import "server-only";

import { CUSTOMER_FILE_TOKEN_PATTERN, CustomerFileError, getCustomerFile } from "@/lib/customer-files";

const MAX_LINES = 30;
const MAX_LINE_LENGTH = 300;
const MAX_FILES = 5;

export class EnquiryConfigurationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "EnquiryConfigurationError";
  }
}

function cleanLine(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LINE_LENGTH);
}

/**
 * Turns the choices sent with a product enquiry into message text and the list of uploaded files to keep.
 * Only text is read from the browser; every file token must name a pending upload in the private storage.
 */
export async function resolveEnquiryConfiguration(input: unknown): Promise<{ text: string; fileTokens: string[] }> {
  const record = input && typeof input === "object" ? (input as { lines?: unknown; fileTokens?: unknown }) : {};
  const lines = (Array.isArray(record.lines) ? record.lines : []).slice(0, MAX_LINES).map(cleanLine).filter(Boolean);

  const requested = Array.isArray(record.fileTokens) ? record.fileTokens : [];
  const fileTokens = [...new Set(requested.filter((token): token is string => typeof token === "string" && CUSTOMER_FILE_TOKEN_PATTERN.test(token)))];
  if (fileTokens.length > MAX_FILES || fileTokens.length !== new Set(requested).size) {
    throw new EnquiryConfigurationError("Invalid file", 400);
  }

  for (const token of fileTokens) {
    try {
      const file = await getCustomerFile(token);
      if (file.status && file.status !== "pending") throw new EnquiryConfigurationError("Invalid file", 400);
    } catch (error) {
      if (error instanceof EnquiryConfigurationError) throw error;
      if (error instanceof CustomerFileError && error.code === "not_found") throw new EnquiryConfigurationError("Invalid file", 400);
      throw new EnquiryConfigurationError("Unable to save inquiry", 503);
    }
  }

  return { text: lines.length ? `Auswahl:\n${lines.map((line) => `- ${line}`).join("\n")}` : "", fileTokens };
}
