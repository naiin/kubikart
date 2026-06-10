import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Authenticate via WordPress - try to get customer by email
    const customers = await wcApi<Array<{ id: number; email: string; first_name: string; last_name: string; username: string }>>("customers", {
      params: { email, role: "all" },
    });

    if (customers.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password via WordPress REST API
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL!;
    const authRes = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`,
      },
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const customer = customers[0];
    const token = Buffer.from(`${customer.id}:${customer.email}:${Date.now()}`).toString("base64");

    return NextResponse.json({
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        username: customer.username,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
