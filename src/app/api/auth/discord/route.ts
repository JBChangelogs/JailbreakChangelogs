import { PUBLIC_API_URL } from "@/utils/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!PUBLIC_API_URL) {
    return NextResponse.json(
      { error: "Auth API is not configured." },
      { status: 500 },
    );
  }

  const requestedRedirect = request.nextUrl.searchParams.get("redirect");
  const fallbackRedirect = new URL("/", request.url).toString();
  const redirectTarget = requestedRedirect || fallbackRedirect;

  const oauthUrl = `${PUBLIC_API_URL}/oauth?redirect=${encodeURIComponent(
    redirectTarget,
  )}`;

  return NextResponse.redirect(oauthUrl);
}
