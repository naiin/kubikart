import { beforeEach, describe, expect, it, vi } from "vitest";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];

function uploadRequest(file: File | null, headers: Record<string, string> = {}) {
  const form = new FormData();
  if (file) form.append("file", file);
  form.append("field_id", "logo");
  return new Request("http://localhost:3000/api/uploads/customer-file", {
    method: "POST",
    headers: { origin: "http://localhost:3000", ...headers },
    body: form,
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("POST /api/uploads/customer-file", () => {
  it("stores a valid PNG through the private WordPress endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "a".repeat(32), filename: "logo.png", mime: "image/png", size: 12 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/uploads/customer-file/route");

    const res = await POST(uploadRequest(new File([new Uint8Array(PNG)], "logo.png", { type: "image/png" })));

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ token: "a".repeat(32), filename: "logo.png" });
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://test-wp.local/wp-json/wc/v3/kubikart/customer-files");
    expect((options as RequestInit).headers).toMatchObject({ Authorization: expect.stringMatching(/^Basic /) });
  });

  it("rejects a file whose content is not an allowed type even if it is named .png", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/uploads/customer-file/route");

    const res = await POST(uploadRequest(new File(["<svg onload=alert(1)></svg>"], "logo.png", { type: "image/png" })));

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ code: "type_not_allowed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects empty and oversized files before contacting WordPress", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/uploads/customer-file/route");

    expect((await POST(uploadRequest(new File([], "empty.png")))).status).toBe(422);
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.png");
    expect((await POST(uploadRequest(big))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request from a foreign origin and a request without a file", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { POST } = await import("@/app/api/uploads/customer-file/route");

    expect((await POST(uploadRequest(new File([new Uint8Array(PNG)], "a.png"), { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(uploadRequest(null))).status).toBe(400);
  });

  it("reports a storage failure honestly instead of pretending the upload worked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ code: "kubikart_file_storage_failed" }) }));
    const { POST } = await import("@/app/api/uploads/customer-file/route");

    const res = await POST(uploadRequest(new File([new Uint8Array(PNG)], "logo.png")));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "storage_unavailable" });
  });
});
