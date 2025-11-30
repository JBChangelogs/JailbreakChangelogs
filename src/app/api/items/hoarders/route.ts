import { NextRequest, NextResponse } from "next/server";
import { fetchItemHoarders } from "@/utils/api";

// Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const type = searchParams.get("type");

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 },
      );
    }

    const hoarders = await fetchItemHoarders(name, type);

    return NextResponse.json(hoarders);
  } catch (error) {
    console.error("Error fetching item hoarders:", error);
    return NextResponse.json(
      { error: "Failed to fetch hoarders" },
      { status: 500 },
    );
  }
}
