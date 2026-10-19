import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/distributed-lock", () => ({ acquireLock: vi.fn().mockResolvedValue(async () => {}) }));
const token = "a".repeat(64);
const data = { email: "qa@example.com", status: "confirmed", unsubscribe_token: token };
const request = (value = token) => ({ nextUrl: new URL(`https://kubikart.de/api/newsletter/unsubscribe?id=1&token=${value}&locale=en`) });
beforeEach(() => { vi.resetModules(); vi.unstubAllGlobals(); });
describe("newsletter unsubscribe", () => {
  it("GET validates the link but does not unsubscribe via email scanners", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: { raw: JSON.stringify(data) } }) });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/newsletter/unsubscribe/route");
    const result = await GET(request() as never);
    expect(result.status).toBe(200);
    expect(await result.text()).toContain("Confirm unsubscribe");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  });
  it("POST persists suppression and is idempotent", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ content: { raw: JSON.stringify(data) } }) }).mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/newsletter/unsubscribe/route");
    expect((await POST(request() as never)).status).toBe(200);
    const saved = JSON.parse(JSON.parse(fetchMock.mock.calls[1][1].body).content);
    expect(saved.status).toBe("unsubscribed");
    expect(saved.unsubscribed_at).toBeTruthy();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ content: { raw: JSON.stringify(saved) } }) });
    expect((await POST(request() as never)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("rejects wrong tokens without changing subscription state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: { raw: JSON.stringify(data) } }) });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/newsletter/unsubscribe/route");
    expect((await POST(request("b".repeat(64)) as never)).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
