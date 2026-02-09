import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Dynamically determine the origin to handle localhost, subdomains, etc.
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const redirectUrl = `${origin}/settings`;

  const targetUrl = `${BASE_API_URL}/email/link?redirect=${encodeURIComponent(
    redirectUrl,
  )}&owner=${token}`;

  return NextResponse.redirect(targetUrl);
}
