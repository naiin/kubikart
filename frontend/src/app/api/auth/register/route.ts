import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if customer exists
    const existing = await wcApi<Array<{ id: number }>>("customers", {
      params: { email },
    });

    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Create customer via WooCommerce
    const customer = await wcApi<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      username: string;
    }>("customers", {
      method: "POST",
      body: {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        username: email.split("@")[0],
      },
    });

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
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
