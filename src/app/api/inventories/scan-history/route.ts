import { NextRequest, NextResponse } from "next/server";
import { INVENTORY_API_URL } from "@/utils/api/api";

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
      `${INVENTORY_API_URL}/user/history?id=${userId}&limit=1000`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array if no scan history found
        return NextResponse.json([]);
      }

      const errorText = await response.text();
      console.error(`Inventory API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: "Failed to fetch scan history" },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Handle both array and empty object responses
    if (Array.isArray(data)) {
      return NextResponse.json(data);
    } else if (typeof data === "object" && Object.keys(data).length === 0) {
      // Empty object means no scan history
      return NextResponse.json([]);
    } else {
      // Unexpected response format
      console.error("Unexpected scan history response format:", data);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error fetching scan history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
