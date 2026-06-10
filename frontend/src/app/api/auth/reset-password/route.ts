import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL!;
const WP_AUTH = "Basic " + Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64");

export async function POST(request: NextRequest) {
  let key: string, login: string, password: string;

  try {
    ({ key, login, password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!key || !login || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  // Same pattern as login — proxy to WordPress using Application Password auth
  const res = await fetch(`${WP_URL}/wp-json/kubikart/v1/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: WP_AUTH,
    },
    body: JSON.stringify({ key, login, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.message ?? "invalid_key" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
