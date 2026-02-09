import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;

  if (token) {
    try {
      await fetch(
        `${BASE_API_URL}/users/token/invalidate?session_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
        },
      );
    } catch {
      // Ignore network errors on logout
    }
  }

  const response = NextResponse.json({ ok: true });
  const isProd = process.env.RAILWAY_ENVIRONMENT_NAME === "production";
  const cookieDomain = isProd ? ".jailbreakchangelogs.xyz" : undefined;
  const cookieParts = [
    "jbcl_token=",
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
    isProd ? "Secure" : "",
    cookieDomain ? `Domain=${cookieDomain}` : "",
  ]
    .filter(Boolean)
    .join("; ");
  response.headers.set("Set-Cookie", cookieParts);
  return response;
}
