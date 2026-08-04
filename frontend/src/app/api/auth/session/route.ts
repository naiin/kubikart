import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getRequestSession } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    const response = NextResponse.json({ user: null }, { status: 401 });
    if (request.cookies.has("kubikart_session")) clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({ user: session.user });
}
