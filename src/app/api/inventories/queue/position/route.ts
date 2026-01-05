import { NextRequest, NextResponse } from "next/server";
import { INVENTORY_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!INVENTORY_API_URL) {
      return NextResponse.json(
        { error: "Inventory API URL not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${INVENTORY_API_URL}/queue/position/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error || "User not found in queue" },
        { status: 404 },
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Queue position API error: ${response.status} - ${errorText}`,
      );
      return NextResponse.json(
        { error: "Failed to fetch queue position" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching queue position:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
