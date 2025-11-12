import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || token === "undefined") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!BASE_API_URL) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    // Get page and size from query params
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const size = searchParams.get("size") || "5";

    const response = await fetch(
      `${BASE_API_URL}/notifications/history?token=${encodeURIComponent(token)}&page=${page}&size=${size}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        // User not found - pass through the 404
        const errorText = await response.text();
        return NextResponse.json(
          { error: errorText || "User not found" },
          { status: 404 },
        );
      }

      const errorText = await response.text();
      console.error(
        `Notifications API error: ${response.status} - ${errorText}`,
      );
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
