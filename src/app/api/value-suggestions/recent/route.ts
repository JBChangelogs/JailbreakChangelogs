import { NextRequest, NextResponse } from "next/server";

const BASE_API_URL =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.RAILWAY_ENVIRONMENT_NAME !== "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.RAILWAY_INTERNAL_API_URL;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "100";

    const response = await fetch(
      `${BASE_API_URL}/value-suggestions/recent?limit=${limit}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-ValueSuggestions/1.0",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch value suggestions" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching value suggestions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
