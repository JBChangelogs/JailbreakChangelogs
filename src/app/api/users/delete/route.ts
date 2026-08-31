import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import { getAuthToken } from "@/utils/api/routeAuth";

const log = createLogger("API");

export async function DELETE() {
  try {
    const token = await getAuthToken();
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const resp = await fetch(
      `${BASE_API_URL}/users/delete?session_token=${encodeURIComponent(token)}`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      },
    );

    if (!resp.ok) {
      const err = await resp.text();
      log.error("Account deletion failed:", err);
      return NextResponse.json(
        { message: "Failed to delete account" },
        { status: resp.status },
      );
    }

    // Clear auth cookie too
    const res = NextResponse.json({ ok: true });
    const envName = process.env.RAILWAY_ENVIRONMENT_NAME;
    const isProd = envName === "production";
    const useSharedDomainCookie =
      envName === "production" || envName === "testing";
    const cookieDomain = useSharedDomainCookie
      ? ".jailbreakchangelogs.com"
      : undefined;
    const cookieParts = [
      "jbcl_token=",
      "SameSite=Lax",
      "Path=/",
      "Max-Age=0",
      isProd ? "Secure" : "",
      cookieDomain ? `Domain=${cookieDomain}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    res.headers.set("Set-Cookie", cookieParts);
    return res;
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
