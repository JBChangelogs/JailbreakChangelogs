import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export async function GET(request: Request) {
  try {
    if (!BASE_API_URL) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    // Get page and size from query params
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const rawSize = parseInt(searchParams.get("size") || "30", 10);
    const size = Math.min(
      Math.max(Number.isNaN(rawSize) ? 30 : rawSize, 1),
      30,
    );
    const fields =
      "id,username,global_name,avatar,usernumber,premiumtype,created_at,settings,presence,roblox_id,roblox_username,roblox_display_name,custom_avatar,roblox_avatar,roblox_join_date,flags";

    const url = new URL(`${BASE_API_URL}/users/paginated`);
    url.searchParams.set("page", page);
    url.searchParams.set("size", size.toString());
    url.searchParams.set("fields", fields);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "JailbreakChangelogs-UserSearch/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Users paginated API error: ${response.status} - ${errorText}`,
      );
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching paginated users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
