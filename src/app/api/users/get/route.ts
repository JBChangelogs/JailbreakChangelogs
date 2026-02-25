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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 },
      );
    }

    const fields = [
      "id",
      "username",
      "global_name",
      "avatar",
      "banner",
      "custom_avatar",
      "custom_banner",
      "accent_color",
      "usernumber",
      "premiumtype",
      "settings",
      "presence",
      "last_seen",
      "flags",
      "primary_guild",
    ].join(",");

    const url = new URL(`${BASE_API_URL}/users/get`);
    url.searchParams.set("id", id);
    url.searchParams.set("fields", fields);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "JailbreakChangelogs-MessagesInbox/1.0",
      },
      cache: "no-store",
    });

    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return NextResponse.json(parsed || { error: "Failed to fetch user" }, {
        status: response.status,
      });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching user by id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
