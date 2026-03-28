import { NextRequest, NextResponse } from "next/server";
import { fetchItemHoarders } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
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
