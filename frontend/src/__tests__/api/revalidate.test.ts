import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "@/lib/woocommerce";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag,
  revalidatePath,
}));

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

/** Signature as the WordPress sender produces it: HMAC over "<timestamp>.<body>". */
function sign(body: string, timestamp = nowSeconds()) {
  return createHmac("sha256", process.env.REVALIDATE_SECRET!).update(`${timestamp}.${body}`).digest("base64");
}

function signBodyOnly(body: string) {
  return createHmac("sha256", process.env.REVALIDATE_SECRET!).update(body).digest("base64");
}

function makeRequest(payload: object, headers: Record<string, string> = {}) {
  const rawBody = JSON.stringify(payload);

  return new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    headers: {
      "x-wc-webhook-signature": sign(rawBody),
      "x-kubikart-timestamp": String(nowSeconds()),
      "x-wc-webhook-topic": "product.updated",
      ...headers,
    },
    body: rawBody,
  });
}

beforeEach(() => {
  vi.resetModules();
  revalidateTag.mockReset();
  revalidatePath.mockReset();
});

describe("POST /api/revalidate replay protection", () => {
  it("rejects a correctly signed request whose timestamp is outside the five-minute window", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const body = JSON.stringify({ slug: "lasergravur" });
    const stale = nowSeconds() - 10 * 60;
    const res = await POST(
      new Request("http://localhost:3000/api/revalidate", {
        method: "POST",
        headers: { "x-wc-webhook-signature": sign(body, stale), "x-kubikart-timestamp": String(stale), "x-wc-webhook-topic": "product.updated" },
        body,
      }) as never,
    );

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a re-dated timestamp, because the timestamp is part of the signed message", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const body = JSON.stringify({ slug: "lasergravur" });
    const old = nowSeconds() - 10 * 60;
    const res = await POST(
      new Request("http://localhost:3000/api/revalidate", {
        method: "POST",
        headers: { "x-wc-webhook-signature": sign(body, old), "x-kubikart-timestamp": String(nowSeconds()), "x-wc-webhook-topic": "product.updated" },
        body,
      }) as never,
    );

    expect(res.status).toBe(401);
  });

  it("rejects a body-only signature by default and accepts it only when untimed webhooks are enabled", async () => {
    const body = JSON.stringify({ slug: "lasergravur" });
    const untimed = () =>
      new Request("http://localhost:3000/api/revalidate", {
        method: "POST",
        headers: { "x-wc-webhook-signature": signBodyOnly(body), "x-wc-webhook-topic": "product.updated" },
        body,
      }) as never;

    const { POST } = await import("@/app/api/revalidate/route");
    expect((await POST(untimed())).status).toBe(401);

    vi.stubEnv("REVALIDATE_ALLOW_UNTIMED_WEBHOOKS", "true");
    vi.resetModules();
    const enabled = await import("@/app/api/revalidate/route");
    expect((await enabled.POST(untimed())).status).toBe(200);
    vi.unstubAllEnvs();
  });
});

describe("POST /api/revalidate", () => {
  it("refreshes the sitemap on product and category lifecycle events", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    for (const topic of ["product.created", "product.updated", "product.deleted", "category.updated"]) {
      revalidatePath.mockClear();
      const response = await POST(makeRequest({ slug: "example" }, { "x-wc-webhook-topic": topic }) as never);
      expect(response.status).toBe(200);
      expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    }
  });
  it("returns 401 for an invalid webhook signature", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const res = await POST(
      makeRequest({ slug: "lasergravur" }, { "x-wc-webhook-signature": "invalid-signature" }) as never,
    );
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects requests without a signature header", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const rawBody = JSON.stringify({ slug: "lasergravur" });
    const res = await POST(
      new Request("http://localhost:3000/api/revalidate", {
        method: "POST",
        headers: { "x-wc-webhook-topic": "product.updated" },
        body: rawBody,
      }) as never,
    );

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects signatures made with another secret", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const rawBody = JSON.stringify({ slug: "lasergravur" });
    const forged = createHmac("sha256", "not-the-secret").update(rawBody).digest("base64");
    const res = await POST(makeRequest({ slug: "lasergravur" }, { "x-wc-webhook-signature": forged }) as never);

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a body that was modified after signing", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const signedBody = JSON.stringify({ slug: "lasergravur" });
    const res = await POST(
      new Request("http://localhost:3000/api/revalidate", {
        method: "POST",
        headers: { "x-wc-webhook-signature": sign(signedBody), "x-kubikart-timestamp": String(nowSeconds()), "x-wc-webhook-topic": "product.updated" },
        body: JSON.stringify({ slug: "other-product" }),
      }) as never,
    );

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects every request while REVALIDATE_SECRET is not configured", async () => {
    const request = makeRequest({ slug: "lasergravur" });
    const secret = process.env.REVALIDATE_SECRET;
    delete process.env.REVALIDATE_SECRET;
    try {
      const { POST } = await import("@/app/api/revalidate/route");
      const res = await POST(request as never);
      expect(res.status).toBe(401);
      expect(revalidateTag).not.toHaveBeenCalled();
    } finally {
      process.env.REVALIDATE_SECRET = secret;
    }
  });

  it("revalidates the product, its translations and the category list for product topics", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const res = await POST(
      makeRequest({
        id: 164,
        slug: "barber-salon-kit-de",
        translations: {
          de: { id: 164, slug: "barber-salon-kit-de" },
          en: { id: 163, slug: "barber-salon-kit" },
        },
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.product("barber-salon-kit-de"), { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.product("barber-salon-kit"), { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.products, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.categories, { expire: 0 });
  });

  it("revalidates product and category caches for category topics", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const res = await POST(
      makeRequest({ id: 187, slug: "business-kits-de" }, { "x-wc-webhook-topic": "category.updated" }) as never,
    );

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.products, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.categories, { expire: 0 });
    expect(revalidateTag).not.toHaveBeenCalledWith(CACHE_TAGS.product("business-kits-de"), { expire: 0 });
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

  it("maps Industry lifecycle topics to focused tags and localized paths", async () => {
    const { WORDPRESS_CACHE_TAGS } = await import("@/lib/wordpress");
    const { POST } = await import("@/app/api/revalidate/route");
    const payload = {
      id: 173,
      slug: "restaurants-lieferdienste",
      translations: {
        de: { id: 173, slug: "restaurants-lieferdienste" },
        en: { id: 176, slug: "restaurants-and-takeaway" },
      },
    };
    const res = await POST(
      makeRequest(payload, { "x-wc-webhook-topic": "industry.updated" }) as never,
    );

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith(WORDPRESS_CACHE_TAGS.industries, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(WORDPRESS_CACHE_TAGS.industry(173), { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(
      WORDPRESS_CACHE_TAGS.slug("en", "restaurants-and-takeaway"),
      { expire: 0 },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/de/businesses");
    expect(revalidatePath).toHaveBeenCalledWith("/en/businesses/restaurants-and-takeaway");
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(revalidateTag).not.toHaveBeenCalledWith(CACHE_TAGS.products, { expire: 0 });
  });
});
