import { NextRequest, NextResponse } from "next/server";
import { fetchItemDupes } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 },
      );
    }

    const dupes = await fetchItemDupes(Number(id));

    return NextResponse.json(dupes);
  } catch (error) {
    console.error("Error fetching item dupes:", error);
    return NextResponse.json(
      { error: "Failed to fetch dupes" },
      { status: 500 },
    );
  }
}
