import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    if (!BASE_API_URL) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.trim();
    if (!ids) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }

    const upstreamUrl = new URL(`${BASE_API_URL}/users/get/batch`);
    upstreamUrl.searchParams.set("ids", ids);
    upstreamUrl.searchParams.set("nocache", "true");

    const response = await fetch(upstreamUrl.toString(), {
      headers: {
        "User-Agent": "JailbreakChangelogs-Servers/1.0",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Users batch API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching users batch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
