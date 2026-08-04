import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import { getRequestSession } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const orders = await wcApi<
      Array<{
        id: number;
        status: string;
        date_created: string;
        total: string;
        currency: string;
        line_items: Array<{ id: number; name: string; quantity: number; total: string }>;
      }>
    >("orders", {
      params: { customer: session.user.id, per_page: 20, orderby: "date", order: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
