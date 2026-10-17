import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => vi.unstubAllEnvs());

describe("acquireLock", () => {
  it("allows only one holder at a time without Redis in development", async () => {
    const { acquireLock } = await import("@/lib/distributed-lock");
    const first = await acquireLock("k", 1000);
    expect(first).not.toBeNull();
    expect(await acquireLock("k", 1000)).toBeNull();
    await first!();
    expect(await acquireLock("k", 1000)).not.toBeNull();
  });

  it("claims with SET NX PX in Redis and treats a null reply as already held", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: "OK" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: null }) })
      .mockResolvedValue({ ok: true, json: async () => ({ result: 1 }) });
    vi.stubGlobal("fetch", fetchMock);
    const { acquireLock } = await import("@/lib/distributed-lock");

    const release = await acquireLock("order:1", 5000);
    expect(release).not.toBeNull();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(["SET", "order:1", expect.any(String), "NX", "PX", 5000]);
    expect(await acquireLock("order:1", 5000)).toBeNull();

    await release!();
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)[0]).toBe("EVAL");
  });

  it("fails closed in production when Redis is not configured or unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { acquireLock } = await import("@/lib/distributed-lock");
    await expect(acquireLock("k", 1000)).rejects.toThrow("Distributed locking is required in production");

    process.env.UPSTASH_REDIS_REST_URL = "https://redis.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(acquireLock("k", 1000)).rejects.toThrow("Distributed locking unavailable");
  });
});
