import { NextRequest, NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";
import { sendAccountCreated } from "@/lib/email";
import { setSessionCookie, type SessionUser } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
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

    const user: SessionUser = {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      username: customer.username,
    };

    try {
      const acceptLang = request.headers.get("accept-language") ?? "";
      const locale = acceptLang.startsWith("en") ? "en" : "de";

      await sendAccountCreated(
        customer.email,
        {
          firstName: customer.first_name || firstName,
          lastName: customer.last_name || lastName,
        },
        locale,
      );
    } catch (err) {
      console.error("Failed to send account created email:", err);
    }

    const response = NextResponse.json({ user });
    setSessionCookie(response, user);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
