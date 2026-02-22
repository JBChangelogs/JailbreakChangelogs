import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jbcl_token")?.value;

    if (!token || token === "undefined") {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const response = await fetch(`${BASE_API_URL}/messages`, {
      method: "GET",
      headers: {
        Authorization: token,
        "User-Agent": "JailbreakChangelogs-Messages/1.0",
      },
      cache: "no-store",
    });

    const responseText = await response.text();

    if (!response.ok) {
      return new NextResponse(
        responseText || '{"error":"failed_to_fetch_messages"}',
        {
          status: response.status,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return new NextResponse(responseText, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Messages API route failed:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}
