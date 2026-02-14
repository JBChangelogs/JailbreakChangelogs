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

    // Get username and limit from query params
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const rawLimit = parseInt(searchParams.get("limit") || "30", 10);
    const limit = Math.min(
      Math.max(Number.isNaN(rawLimit) ? 30 : rawLimit, 1),
      30,
    );

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 },
      );
    }

    const fields =
      "id,username,global_name,avatar,usernumber,premiumtype,created_at,settings,presence,roblox_id,roblox_username,roblox_display_name,custom_avatar,roblox_avatar,roblox_join_date,flags";

    const url = new URL(`${BASE_API_URL}/users/search`);
    url.searchParams.set("username", username);
    url.searchParams.set("limit", limit.toString());
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
      // Handle 404 as a valid "no results" response
      if (response.status === 404) {
        return NextResponse.json({ users: [] });
      }

      const errorText = await response.text();
      console.error(
        `Users search API error: ${response.status} - ${errorText}`,
      );
      return NextResponse.json(
        { error: "Failed to search users" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
