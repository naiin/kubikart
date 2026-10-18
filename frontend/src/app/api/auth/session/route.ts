import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getRequestSession } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    // 200 with no user: being signed out is a normal state, not an error (a 401 shows up as a red console error on every page).
    const response = NextResponse.json({ user: null });
    if (request.cookies.has("kubikart_session")) clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({ user: session.user });
}
