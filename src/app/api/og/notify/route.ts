import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INVENTORY_API_URL = process.env.NEXT_PUBLIC_INVENTORY_API_URL;

/**
 * GET /api/og/notify?user_id={roblox_id}
 * Returns array of item IDs the user wants to be notified about
 * Response: [] if none, or ["1", "2", "3"] for item IDs
 */
export async function GET(request: Request) {
  try {
    if (!INVENTORY_API_URL) {
      return NextResponse.json(
        { error: "Inventory API URL not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id parameter is required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${INVENTORY_API_URL}/og/notify?user_id=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OG notify API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: "Failed to fetch OG notifications" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching OG notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/og/notify?user_id={roblox_id}&item_id={item_id}
 * Adds an item to the user's OG notification list
 * Response: { "message": "OG notify added" }
 */
export async function POST(request: Request) {
  try {
    if (!INVENTORY_API_URL) {
      return NextResponse.json(
        { error: "Inventory API URL not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const itemId = searchParams.get("item_id");

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: "user_id and item_id parameters are required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${INVENTORY_API_URL}/og/notify?user_id=${encodeURIComponent(userId)}&item_id=${encodeURIComponent(itemId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OG notify API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: "Failed to add OG notification" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding OG notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/og/notify?user_id={roblox_id}&item_id={item_id}
 * Removes an item from the user's OG notification list
 * Response: { "message": "OG notify deleted" }
 */
export async function DELETE(request: Request) {
  try {
    if (!INVENTORY_API_URL) {
      return NextResponse.json(
        { error: "Inventory API URL not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const itemId = searchParams.get("item_id");

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: "user_id and item_id parameters are required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${INVENTORY_API_URL}/og/notify?user_id=${encodeURIComponent(userId)}&item_id=${encodeURIComponent(itemId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OG notify API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: "Failed to remove OG notification" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error removing OG notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
