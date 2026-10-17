import { NextResponse } from "next/server";
import { getBusinessKitCommercialState } from "@/lib/business-kits";
import { isEnquiryOnly } from "@/lib/purchase-mode";
import { wcApi, type WCProduct } from "@/lib/woocommerce";

type BlockedReason = "enquiry_only" | "unavailable";

/**
 * Tells the cart which lines can no longer be ordered online (for example an
 * enquiry-only bundle left in an old browser cart). Informational only: the
 * server cart independently refuses these products at every checkout path.
 */
export async function POST(request: Request) {
  let body: { items?: { productId?: unknown }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ids = Array.from(
    new Set((Array.isArray(body.items) ? body.items : []).map((item) => Number(item?.productId)).filter((id) => Number.isInteger(id) && id > 0)),
  ).slice(0, 50);

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const product = await wcApi<WCProduct>(`products/${id}`, { revalidate: 0 });
        let reason: BlockedReason | null = null;
        if (isEnquiryOnly(product)) reason = "enquiry_only";
        else if (product.status !== "publish" || getBusinessKitCommercialState(product).kind === "unavailable") reason = "unavailable";
        return reason ? { productId: id, reason, name: product.name, slug: product.slug } : null;
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({ blocked: results.filter(Boolean) });
}
