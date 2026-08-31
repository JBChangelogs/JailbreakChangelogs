import { cookies } from "next/headers";

/**
 * Reads the session token from the request cookies. Returns undefined for a
 * missing cookie or the literal string "undefined" (a stale/cleared cookie
 * value some clients can send).
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;
  return token && token !== "undefined" ? token : undefined;
}
