import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const envName = process.env.RAILWAY_ENVIRONMENT_NAME;
  const useSharedDomainCookie =
    envName === "production" || envName === "testing";
  const isSecure = useSharedDomainCookie;
  const cookieDomain = useSharedDomainCookie
    ? ".jailbreakchangelogs.com"
    : undefined;
  const cookieParts = [
    "jbcl_token=",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
    isSecure ? "Secure" : "",
    cookieDomain ? `Domain=${cookieDomain}` : "",
  ]
    .filter(Boolean)
    .join("; ");
  response.headers.set("Set-Cookie", cookieParts);
  return response;
}
