import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

// Rate limiting — max 3 requests per 10 min per IP
const attempts = new Map<string, number[]>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 600_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (attempts.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW);
  times.push(now);
  attempts.set(ip, times);
  return times.length > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    // Still return 200 — never reveal anything to the client
    return NextResponse.json({ success: true }, { status: 200 });
  }

  let email: string;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Detect locale from Accept-Language header (default to de)
  const acceptLang = request.headers.get("accept-language") ?? "";
  const locale = acceptLang.startsWith("en") ? "en" : "de";

  // Proxy to the endpoint in kubikart-security.php (unauthenticated, public)
  await fetch(`${WP_URL}/wp-json/kubikart/v1/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, locale, site_url: SITE_URL }),
  }).catch(() => {
    // Silent failure — user still gets success response to prevent enumeration
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
