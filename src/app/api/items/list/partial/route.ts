import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/items/list/partial
 * Returns a partial list of items with only id, name, and type fields
 * Used for the OG notification selector to minimize data transfer
 */
export async function GET() {
  try {
    if (!BASE_API_URL) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    // Fetch full items list from the backend
    const response = await fetch(`${BASE_API_URL}/items/list`, {
      headers: {
        "User-Agent": "JailbreakChangelogs-ItemCatalog/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Items API error: ${response.status} - ${response.statusText}`,
      );
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: response.status },
      );
    }

    const items = await response.json();

    // Transform to only include id, name, and type
    const partialItems = items.map(
      (item: { id: number; name: string; type: string }) => ({
        id: item.id,
        name: item.name,
        type: item.type,
      }),
    );

    return NextResponse.json(partialItems);
  } catch (error) {
    console.error("Error fetching partial items list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
