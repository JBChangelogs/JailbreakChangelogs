import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import type { MeResponse } from "./normalizeMeResponse";

export async function loginWithToken(token: string): Promise<MeResponse> {
  if (!token || token === "undefined") throw new Error("Missing token");
  const { url, headers } = buildApiFetchRequest(PUBLIC_API_URL, "/v2/users/me");
  const response = await fetch(url, {
    headers: { ...headers, Authorization: token },
    // An existing API cookie must not override the token being validated.
    credentials: "omit",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to validate token");
  const user = (await response.json()) as MeResponse;

  const hostname = window.location.hostname;
  const sharedDomain =
    hostname === "jailbreakchangelogs.com" ||
    hostname.endsWith(".jailbreakchangelogs.com");
  document.cookie = [
    `jbcl_token=${encodeURIComponent(token)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 30}`,
    window.location.protocol === "https:" ? "Secure" : "",
    sharedDomain ? "Domain=.jailbreakchangelogs.com" : "",
  ]
    .filter(Boolean)
    .join("; ");
  return user;
}
