import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "@/lib/woocommerce";

const revalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag,
}));

function sign(body: string) {
  return createHmac("sha256", process.env.REVALIDATE_SECRET!).update(body).digest("base64");
}

function makeRequest(payload: object, headers: Record<string, string> = {}) {
  const rawBody = JSON.stringify(payload);

  return new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    headers: {
      "x-wc-webhook-signature": sign(rawBody),
      "x-wc-webhook-topic": "product.updated",
      ...headers,
    },
    body: rawBody,
  });
}

beforeEach(() => {
  vi.resetModules();
  revalidateTag.mockReset();
});

describe("POST /api/revalidate", () => {
  it("returns 401 for an invalid webhook signature", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const res = await POST(
      makeRequest({ slug: "lasergravur" }, { "x-wc-webhook-signature": "invalid-signature" }) as never,
    );
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the product and product-list tags for product topics", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const res = await POST(makeRequest({ slug: "lasergravur" }) as never);

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.product("lasergravur"), { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.products, { expire: 0 });
  });

  it("skips frontend revalidation for coupon and order topics", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const res = await POST(makeRequest({ id: 17 }, { "x-wc-webhook-topic": "coupon.updated" }) as never);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.skipped).toBe(true);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates broad caches for unknown topics", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const res = await POST(makeRequest({ foo: "bar" }, { "x-wc-webhook-topic": "product-category.updated" }) as never);

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.products, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.categories, { expire: 0 });
  });
});
