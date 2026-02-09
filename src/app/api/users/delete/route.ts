import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jbcl_token")?.value;
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
      console.error("Account deletion failed:", err);
      return NextResponse.json(
        { message: "Failed to delete account" },
        { status: resp.status },
      );
    }

    // Clear auth cookie too
    const res = NextResponse.json({ ok: true });
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
    res.headers.set("Set-Cookie", cookieParts);
    return res;
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
